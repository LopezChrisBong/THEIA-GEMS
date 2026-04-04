import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LayawayPayment } from './entities/layaway-payment.entity';
import { CreateLayawayPaymentDto } from './dto/create-layaway-payment.dto';
import { UpdateLayawayPaymentDto } from './dto/update-layaway-payment.dto';
import { LayawayPlansService } from '../layaway-plans/layaway-plans.service';

@Injectable()
export class LayawayPaymentsService {
  constructor(
    @InjectRepository(LayawayPayment)
    private readonly layawayPaymentRepository: Repository<LayawayPayment>,
    private readonly layawayPlansService: LayawayPlansService,
  ) {}

  async create(
    createLayawayPaymentDto: CreateLayawayPaymentDto,
  ): Promise<LayawayPayment> {
    // Get the layaway plan to record the payment
    const plan = await this.layawayPlansService.findOne(
      createLayawayPaymentDto.layawayPlanId,
    );

    const balanceBefore = Number(plan.remainingBalance);
    const balanceAfter = balanceBefore - createLayawayPaymentDto.amount;

    const layawayPayment = this.layawayPaymentRepository.create({
      ...createLayawayPaymentDto,
      receiptNumber:
        createLayawayPaymentDto.receiptNumber ||
        (await this.generateReceiptNumber()),
      paymentDate: createLayawayPaymentDto.paymentDate
        ? new Date(createLayawayPaymentDto.paymentDate)
        : new Date(),
      paymentNumber: plan.paymentsMade + 1,
      balanceBefore,
      balanceAfter: Math.max(0, balanceAfter),
    });

    const savedPayment = await this.layawayPaymentRepository.save(layawayPayment);

    // Update the layaway plan
    await this.layawayPlansService.recordPayment(
      plan.id,
      createLayawayPaymentDto.amount,
    );

    return savedPayment;
  }

  async findAll(): Promise<LayawayPayment[]> {
    return this.layawayPaymentRepository.find({
      relations: ['layawayPlan', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LayawayPayment> {
    const layawayPayment = await this.layawayPaymentRepository.findOne({
      where: { id },
      relations: ['layawayPlan', 'receiver'],
    });
    if (!layawayPayment) {
      throw new NotFoundException(`Layaway payment with ID ${id} not found`);
    }
    return layawayPayment;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<LayawayPayment> {
    const layawayPayment = await this.layawayPaymentRepository.findOne({
      where: { receiptNumber },
      relations: ['layawayPlan', 'receiver'],
    });
    if (!layawayPayment) {
      throw new NotFoundException(
        `Layaway payment with receipt ${receiptNumber} not found`,
      );
    }
    return layawayPayment;
  }

  async findByLayawayPlan(layawayPlanId: number): Promise<LayawayPayment[]> {
    return this.layawayPaymentRepository.find({
      where: { layawayPlanId },
      relations: ['receiver'],
      order: { paymentNumber: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<LayawayPayment[]> {
    return this.layawayPaymentRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
      },
      relations: ['layawayPlan', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async getTotalPaymentsForPlan(layawayPlanId: number): Promise<number> {
    const result = await this.layawayPaymentRepository
      .createQueryBuilder('payment')
      .where('payment.layaway_plan_id = :layawayPlanId', { layawayPlanId })
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
    updateLayawayPaymentDto: UpdateLayawayPaymentDto,
  ): Promise<LayawayPayment> {
    const layawayPayment = await this.findOne(id);
    Object.assign(layawayPayment, updateLayawayPaymentDto);
    if (updateLayawayPaymentDto.paymentDate) {
      layawayPayment.paymentDate = new Date(updateLayawayPaymentDto.paymentDate);
    }
    return this.layawayPaymentRepository.save(layawayPayment);
  }

  async remove(id: number): Promise<void> {
    const layawayPayment = await this.findOne(id);
    await this.layawayPaymentRepository.remove(layawayPayment);
  }

  async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LPR-${datePrefix}-`;

    const lastPayment = await this.layawayPaymentRepository
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
