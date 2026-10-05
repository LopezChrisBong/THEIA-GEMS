import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InstallmentPlan, InstallmentStatus } from './entities/installment-plan.entity';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { UpdateInstallmentPlanDto } from './dto/update-installment-plan.dto';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { JewelryItem, JewelryItemStatus } from '../jewelry-items/entities/jewelry-item.entity';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class InstallmentPlansService {
  private readonly logger = new Logger(InstallmentPlansService.name);

  constructor(
    @InjectRepository(InstallmentPlan)
    private readonly installmentPlanRepository: Repository<InstallmentPlan>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  private fmtDate(d: Date | string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async create(createInstallmentPlanDto: CreateInstallmentPlanDto): Promise<InstallmentPlan> {
    const startDate = new Date(createInstallmentPlanDto.startDate);
    const remainingBalance =
      createInstallmentPlanDto.totalAmount - createInstallmentPlanDto.downPayment;
    const monthlyPayment =
      remainingBalance / createInstallmentPlanDto.numberOfPayments;

    // Calculate end date (number of months from start)
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + createInstallmentPlanDto.numberOfPayments);

    // Next payment is one month from start
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const installmentPlan = this.installmentPlanRepository.create({
      ...createInstallmentPlanDto,
      planNumber:
        createInstallmentPlanDto.planNumber || (await this.generatePlanNumber()),
      startDate,
      endDate: createInstallmentPlanDto.endDate
        ? new Date(createInstallmentPlanDto.endDate)
        : endDate,
      nextPaymentDate: createInstallmentPlanDto.nextPaymentDate
        ? new Date(createInstallmentPlanDto.nextPaymentDate)
        : nextPaymentDate,
      remainingBalance,
      monthlyPayment,
    });
    const saved = await this.installmentPlanRepository.save(installmentPlan);

    // Notify customer (fire-and-forget)
    const plan = await this.findOne(saved.id);
    if (plan.customer) {
      const customerName = `${plan.customer.firstName} ${plan.customer.lastName}`;
      const smsBody = `Hi ${customerName}, your Theia Gems installment plan (${saved.planNumber}) has been created. Monthly payment: ₱${Number(saved.monthlyPayment).toFixed(2)} for ${createInstallmentPlanDto.numberOfPayments} months. Next due: ${this.fmtDate(saved.nextPaymentDate)}. Thank you!`;
      if (plan.customer.email) {
        this.mailService.sendInstallmentConfirmation({
          to: plan.customer.email,
          customerName,
          planNumber: saved.planNumber,
          totalAmount: Number(saved.totalAmount ?? createInstallmentPlanDto.totalAmount),
          downPayment: Number(saved.downPayment ?? createInstallmentPlanDto.downPayment),
          remainingBalance: Number(saved.remainingBalance),
          monthlyPayment: Number(saved.monthlyPayment),
          numberOfPayments: createInstallmentPlanDto.numberOfPayments,
          nextPaymentDate: this.fmtDate(saved.nextPaymentDate),
        }).catch((e) => this.logger.error('Installment confirmation email failed', e));
      }
      if (plan.customer.phone) {
        this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: smsBody })
          .catch((e) => this.logger.error('Installment confirmation SMS failed', e));
      }
    }

    return saved;
  }

  async findAll(): Promise<InstallmentPlan[]> {
    return this.installmentPlanRepository.find({
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<InstallmentPlan> {
    const installmentPlan = await this.installmentPlanRepository.findOne({
      where: { id },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!installmentPlan) {
      throw new NotFoundException(`Installment plan with ID ${id} not found`);
    }
    return installmentPlan;
  }

  async findByPlanNumber(planNumber: string): Promise<InstallmentPlan> {
    const installmentPlan = await this.installmentPlanRepository.findOne({
      where: { planNumber },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!installmentPlan) {
      throw new NotFoundException(
        `Installment plan with number ${planNumber} not found`,
      );
    }
    return installmentPlan;
  }

  async findByCustomer(customerId: number): Promise<InstallmentPlan[]> {
    return this.installmentPlanRepository.find({
      where: { customerId },
      relations: ['sale', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<InstallmentPlan[]> {
    return this.installmentPlanRepository.find({
      where: { branchId },
      relations: ['sale', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: InstallmentStatus): Promise<InstallmentPlan[]> {
    return this.installmentPlanRepository.find({
      where: { status },
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOverdue(): Promise<InstallmentPlan[]> {
    const today = new Date();
    return this.installmentPlanRepository.find({
      where: {
        status: InstallmentStatus.ACTIVE,
        nextPaymentDate: LessThanOrEqual(today),
      },
      relations: ['sale', 'customer', 'branch'],
      order: { nextPaymentDate: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<InstallmentPlan[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.installmentPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.sale', 'sale')
      .leftJoinAndSelect('plan.customer', 'customer')
      .leftJoinAndSelect('plan.branch', 'branch')
      .where('plan.status = :status', { status: InstallmentStatus.ACTIVE })
      .andWhere('plan.next_payment_date > :today', { today })
      .andWhere('plan.next_payment_date <= :futureDate', { futureDate })
      .orderBy('plan.next_payment_date', 'ASC')
      .getMany();
  }

  async recordPayment(
    id: number,
    amount: number,
  ): Promise<InstallmentPlan> {
    const plan = await this.findOne(id);

    plan.remainingBalance = Number(plan.remainingBalance) - amount;
    plan.paymentsMade += 1;

    // Update next payment date
    if (plan.remainingBalance <= 0) {
      plan.status = InstallmentStatus.COMPLETED;
      plan.remainingBalance = 0;
      plan.nextPaymentDate = null;

      // Mark all jewelry items on this sale as SOLD
      if (plan.saleId) {
        const saleItems = await this.saleItemRepository.find({ where: { saleId: plan.saleId } });
        const jewelryItemIds = saleItems.map((si) => si.jewelryItemId).filter(Boolean);
        if (jewelryItemIds.length) {
          await this.jewelryItemRepository
            .createQueryBuilder()
            .update(JewelryItem)
            .set({ status: JewelryItemStatus.SOLD })
            .whereInIds(jewelryItemIds)
            .execute();
        }
      }
    } else {
      const nextDate = new Date(plan.nextPaymentDate!);
      nextDate.setMonth(nextDate.getMonth() + 1);
      plan.nextPaymentDate = nextDate;
    }

    const saved = await this.installmentPlanRepository.save(plan);

    // Notify customer of payment received
    if (saved.customer) {
      const customerName = `${saved.customer.firstName} ${saved.customer.lastName}`;
      const isCompleted = saved.status === InstallmentStatus.COMPLETED;
      const smsBody = isCompleted
        ? `Hi ${customerName}, your Theia Gems plan (${saved.planNumber}) is now FULLY PAID. Thank you!`
        : `Hi ${customerName}, payment received for plan ${saved.planNumber}. Remaining balance: ₱${Number(saved.remainingBalance).toFixed(2)}. Next due: ${this.fmtDate(saved.nextPaymentDate)}. Thank you!`;
      if (saved.customer.email) {
        this.mailService.sendInstallmentPaymentConfirmation({
          to: saved.customer.email,
          customerName,
          planNumber: saved.planNumber,
          amountPaid: amount,
          remainingBalance: Number(saved.remainingBalance),
          nextPaymentDate: saved.nextPaymentDate ? this.fmtDate(saved.nextPaymentDate) : null,
          isCompleted,
        }).catch((e) => this.logger.error('Payment confirmation email failed', e));
      }
      if (saved.customer.phone) {
        this.smsService.sendSmsSemaphore({ recipient: saved.customer.phone, message: smsBody })
          .catch((e) => this.logger.error('Payment confirmation SMS failed', e));
      }
    }

    return saved;
  }

  async updateStatus(id: number, status: InstallmentStatus): Promise<InstallmentPlan> {
    const plan = await this.findOne(id);
    plan.status = status;
    return this.installmentPlanRepository.save(plan);
  }

  async update(
    id: number,
    updateInstallmentPlanDto: UpdateInstallmentPlanDto,
  ): Promise<InstallmentPlan> {
    const installmentPlan = await this.findOne(id);
    Object.assign(installmentPlan, updateInstallmentPlanDto);
    if (updateInstallmentPlanDto.startDate) {
      installmentPlan.startDate = new Date(updateInstallmentPlanDto.startDate);
    }
    if (updateInstallmentPlanDto.endDate) {
      installmentPlan.endDate = new Date(updateInstallmentPlanDto.endDate);
    }
    if (updateInstallmentPlanDto.nextPaymentDate) {
      installmentPlan.nextPaymentDate = new Date(updateInstallmentPlanDto.nextPaymentDate);
    }
    return this.installmentPlanRepository.save(installmentPlan);
  }

  async remove(id: number): Promise<void> {
    const installmentPlan = await this.findOne(id);
    await this.installmentPlanRepository.remove(installmentPlan);
  }

  async generatePlanNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INS-${datePrefix}-`;

    const lastPlan = await this.installmentPlanRepository
      .createQueryBuilder('plan')
      .where('plan.plan_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('plan.plan_number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPlan) {
      const lastNumber = parseInt(lastPlan.planNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
