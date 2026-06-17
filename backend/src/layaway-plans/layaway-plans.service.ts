import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { LayawayPlan, LayawayStatus } from './entities/layaway-plan.entity';
import { CreateLayawayPlanDto } from './dto/create-layaway-plan.dto';
import { UpdateLayawayPlanDto } from './dto/update-layaway-plan.dto';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { JewelryItem, JewelryItemStatus } from '../jewelry-items/entities/jewelry-item.entity';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class LayawayPlansService {
  private readonly logger = new Logger(LayawayPlansService.name);

  constructor(
    @InjectRepository(LayawayPlan)
    private readonly layawayPlanRepository: Repository<LayawayPlan>,
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

  async create(createLayawayPlanDto: CreateLayawayPlanDto): Promise<LayawayPlan> {
    const startDate = new Date(createLayawayPlanDto.startDate);
    const remainingBalance =
      createLayawayPlanDto.totalAmount - createLayawayPlanDto.downPayment;
    const monthlyPayment =
      remainingBalance / createLayawayPlanDto.numberOfPayments;

    // Calculate end date (number of months from start)
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + createLayawayPlanDto.numberOfPayments);

    // Next payment is one month from start
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const layawayPlan = this.layawayPlanRepository.create({
      ...createLayawayPlanDto,
      planNumber:
        createLayawayPlanDto.planNumber || (await this.generatePlanNumber()),
      startDate,
      endDate: createLayawayPlanDto.endDate
        ? new Date(createLayawayPlanDto.endDate)
        : endDate,
      nextPaymentDate: createLayawayPlanDto.nextPaymentDate
        ? new Date(createLayawayPlanDto.nextPaymentDate)
        : nextPaymentDate,
      remainingBalance,
      monthlyPayment,
    });
    const saved = await this.layawayPlanRepository.save(layawayPlan);

    // Notify customer (fire-and-forget)
    const plan = await this.findOne(saved.id);
    if (plan.customer) {
      const customerName = `${plan.customer.firstName} ${plan.customer.lastName}`;
      const smsBody = `Hi ${customerName}, your Theia Gems installment plan (${saved.planNumber}) has been created. Monthly payment: ₱${Number(saved.monthlyPayment).toFixed(2)} for ${createLayawayPlanDto.numberOfPayments} months. Next due: ${this.fmtDate(saved.nextPaymentDate)}. Thank you!`;
      if (plan.customer.email) {
        this.mailService.sendLayawayConfirmation({
          to: plan.customer.email,
          customerName,
          planNumber: saved.planNumber,
          totalAmount: Number(saved.totalAmount ?? createLayawayPlanDto.totalAmount),
          downPayment: Number(saved.downPayment ?? createLayawayPlanDto.downPayment),
          remainingBalance: Number(saved.remainingBalance),
          monthlyPayment: Number(saved.monthlyPayment),
          numberOfPayments: createLayawayPlanDto.numberOfPayments,
          nextPaymentDate: this.fmtDate(saved.nextPaymentDate),
        }).catch((e) => this.logger.error('Layaway confirmation email failed', e));
      }
      if (plan.customer.phone) {
        this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: smsBody })
          .catch((e) => this.logger.error('Layaway confirmation SMS failed', e));
      }
    }

    return saved;
  }

  async findAll(): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LayawayPlan> {
    const layawayPlan = await this.layawayPlanRepository.findOne({
      where: { id },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!layawayPlan) {
      throw new NotFoundException(`Layaway plan with ID ${id} not found`);
    }
    return layawayPlan;
  }

  async findByPlanNumber(planNumber: string): Promise<LayawayPlan> {
    const layawayPlan = await this.layawayPlanRepository.findOne({
      where: { planNumber },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!layawayPlan) {
      throw new NotFoundException(
        `Layaway plan with number ${planNumber} not found`,
      );
    }
    return layawayPlan;
  }

  async findByCustomer(customerId: number): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { customerId },
      relations: ['sale', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { branchId },
      relations: ['sale', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: LayawayStatus): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { status },
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOverdue(): Promise<LayawayPlan[]> {
    const today = new Date();
    return this.layawayPlanRepository.find({
      where: {
        status: LayawayStatus.ACTIVE,
        nextPaymentDate: LessThanOrEqual(today),
      },
      relations: ['sale', 'customer', 'branch'],
      order: { nextPaymentDate: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<LayawayPlan[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.layawayPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.sale', 'sale')
      .leftJoinAndSelect('plan.customer', 'customer')
      .leftJoinAndSelect('plan.branch', 'branch')
      .where('plan.status = :status', { status: LayawayStatus.ACTIVE })
      .andWhere('plan.next_payment_date > :today', { today })
      .andWhere('plan.next_payment_date <= :futureDate', { futureDate })
      .orderBy('plan.next_payment_date', 'ASC')
      .getMany();
  }

  async recordPayment(
    id: number,
    amount: number,
  ): Promise<LayawayPlan> {
    const plan = await this.findOne(id);

    plan.remainingBalance = Number(plan.remainingBalance) - amount;
    plan.paymentsMade += 1;

    // Update next payment date
    if (plan.remainingBalance <= 0) {
      plan.status = LayawayStatus.COMPLETED;
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

    const saved = await this.layawayPlanRepository.save(plan);

    // Notify customer of payment received
    if (saved.customer) {
      const customerName = `${saved.customer.firstName} ${saved.customer.lastName}`;
      const isCompleted = saved.status === LayawayStatus.COMPLETED;
      const smsBody = isCompleted
        ? `Hi ${customerName}, your Theia Gems plan (${saved.planNumber}) is now FULLY PAID. Thank you!`
        : `Hi ${customerName}, payment received for plan ${saved.planNumber}. Remaining balance: ₱${Number(saved.remainingBalance).toFixed(2)}. Next due: ${this.fmtDate(saved.nextPaymentDate)}. Thank you!`;
      if (saved.customer.email) {
        this.mailService.sendLayawayPaymentConfirmation({
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

  async updateStatus(id: number, status: LayawayStatus): Promise<LayawayPlan> {
    const plan = await this.findOne(id);
    plan.status = status;
    return this.layawayPlanRepository.save(plan);
  }

  async update(
    id: number,
    updateLayawayPlanDto: UpdateLayawayPlanDto,
  ): Promise<LayawayPlan> {
    const layawayPlan = await this.findOne(id);
    Object.assign(layawayPlan, updateLayawayPlanDto);
    if (updateLayawayPlanDto.startDate) {
      layawayPlan.startDate = new Date(updateLayawayPlanDto.startDate);
    }
    if (updateLayawayPlanDto.endDate) {
      layawayPlan.endDate = new Date(updateLayawayPlanDto.endDate);
    }
    if (updateLayawayPlanDto.nextPaymentDate) {
      layawayPlan.nextPaymentDate = new Date(updateLayawayPlanDto.nextPaymentDate);
    }
    return this.layawayPlanRepository.save(layawayPlan);
  }

  async remove(id: number): Promise<void> {
    const layawayPlan = await this.findOne(id);
    await this.layawayPlanRepository.remove(layawayPlan);
  }

  async generatePlanNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LAY-${datePrefix}-`;

    const lastPlan = await this.layawayPlanRepository
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
