import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InstallmentPayment } from './entities/installment-payment.entity';
import { CreateInstallmentPaymentDto } from './dto/create-installment-payment.dto';
import { UpdateInstallmentPaymentDto } from './dto/update-installment-payment.dto';
import { InstallmentPlansService } from '../installment-plans/installment-plans.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class InstallmentPaymentsService {
  constructor(
    @InjectRepository(InstallmentPayment)
    private readonly installmentPaymentRepository: Repository<InstallmentPayment>,
    private readonly installmentPlansService: InstallmentPlansService,
    private readonly salesService: SalesService,
  ) {}

  async create(
    createInstallmentPaymentDto: CreateInstallmentPaymentDto,
  ): Promise<InstallmentPayment> {
    // Get the installment plan to record the payment
    const plan = await this.installmentPlansService.findOne(
      createInstallmentPaymentDto.installmentPlanId,
    );

    const balanceBefore = Number(plan.remainingBalance);
    const balanceAfter = balanceBefore - createInstallmentPaymentDto.amount;

    const installmentPayment = this.installmentPaymentRepository.create({
      ...createInstallmentPaymentDto,
      receiptNumber:
        createInstallmentPaymentDto.receiptNumber ||
        (await this.generateReceiptNumber()),
      paymentDate: createInstallmentPaymentDto.paymentDate
        ? new Date(createInstallmentPaymentDto.paymentDate)
        : new Date(),
      paymentNumber: plan.paymentsMade + 1,
      balanceBefore,
      balanceAfter: Math.max(0, balanceAfter),
    });

    const savedPayment = await this.installmentPaymentRepository.save(installmentPayment);

    // Update the installment plan
    await this.installmentPlansService.recordPayment(
      plan.id,
      createInstallmentPaymentDto.amount,
    );

    // Reflect the cash actually collected on the parent sale, so Sales Report /
    // Dashboard revenue tracks real payments instead of the full item price.
    await this.salesService.addPayment(plan.saleId, createInstallmentPaymentDto.amount);

    return savedPayment;
  }

  async findAll(): Promise<InstallmentPayment[]> {
    return this.installmentPaymentRepository.find({
      relations: ['installmentPlan', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<InstallmentPayment> {
    const installmentPayment = await this.installmentPaymentRepository.findOne({
      where: { id },
      relations: ['installmentPlan', 'receiver'],
    });
    if (!installmentPayment) {
      throw new NotFoundException(`Installment payment with ID ${id} not found`);
    }
    return installmentPayment;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<InstallmentPayment> {
    const installmentPayment = await this.installmentPaymentRepository.findOne({
      where: { receiptNumber },
      relations: ['installmentPlan', 'receiver'],
    });
    if (!installmentPayment) {
      throw new NotFoundException(
        `Installment payment with receipt ${receiptNumber} not found`,
      );
    }
    return installmentPayment;
  }

  async findByInstallmentPlan(installmentPlanId: number): Promise<InstallmentPayment[]> {
    return this.installmentPaymentRepository.find({
      where: { installmentPlanId },
      relations: ['receiver'],
      order: { paymentNumber: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<InstallmentPayment[]> {
    return this.installmentPaymentRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
      },
      relations: ['installmentPlan', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async getTotalPaymentsForPlan(installmentPlanId: number): Promise<number> {
    const result = await this.installmentPaymentRepository
      .createQueryBuilder('payment')
      .where('payment.installment_plan_id = :installmentPlanId', { installmentPlanId })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  async getDailySummary(date: Date): Promise<{
    totalPayments: number;
    totalAmount: number;
    paymentCount: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await this.findByDateRange(startOfDay, endOfDay);

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paymentCount: payments.length,
    };
  }

  async update(
    id: number,
    updateInstallmentPaymentDto: UpdateInstallmentPaymentDto,
  ): Promise<InstallmentPayment> {
    const installmentPayment = await this.findOne(id);
    Object.assign(installmentPayment, updateInstallmentPaymentDto);
    if (updateInstallmentPaymentDto.paymentDate) {
      installmentPayment.paymentDate = new Date(updateInstallmentPaymentDto.paymentDate);
    }
    return this.installmentPaymentRepository.save(installmentPayment);
  }

  async remove(id: number): Promise<void> {
    const installmentPayment = await this.findOne(id);
    await this.installmentPaymentRepository.remove(installmentPayment);
  }

  async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `IPR-${datePrefix}-`;

    const lastPayment = await this.installmentPaymentRepository
      .createQueryBuilder('payment')
      .where('payment.receipt_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.receipt_number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(
        lastPayment.receiptNumber.replace(prefix, ''),
        10,
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
