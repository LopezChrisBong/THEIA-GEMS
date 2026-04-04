import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentMethod, PaymentType } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentNumber:
        createPaymentDto.paymentNumber || (await this.generatePaymentNumber()),
      paymentDate: createPaymentDto.paymentDate
        ? new Date(createPaymentDto.paymentDate)
        : new Date(),
    });
    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['sale', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['sale', 'receiver'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async findByPaymentNumber(paymentNumber: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentNumber },
      relations: ['sale', 'receiver'],
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with number ${paymentNumber} not found`,
      );
    }
    return payment;
  }

  async findBySale(saleId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { saleId },
      relations: ['receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
      },
      relations: ['sale', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findByPaymentMethod(method: PaymentMethod): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { paymentMethod: method },
      relations: ['sale', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async findByPaymentType(type: PaymentType): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { paymentType: type },
      relations: ['sale', 'receiver'],
      order: { paymentDate: 'DESC' },
    });
  }

  async getSaleTotalPayments(saleId: number): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.sale_id = :saleId', { saleId })
      .andWhere('payment.payment_type != :refundType', {
        refundType: PaymentType.REFUND,
      })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  async getDailySummary(date: Date): Promise<{
    totalPayments: number;
    totalAmount: number;
    byMethod: Record<string, { count: number; amount: number }>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await this.findByDateRange(startOfDay, endOfDay);

    const byMethod: Record<string, { count: number; amount: number }> = {};

    for (const payment of payments) {
      if (!byMethod[payment.paymentMethod]) {
        byMethod[payment.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[payment.paymentMethod].count++;
      byMethod[payment.paymentMethod].amount += Number(payment.amount);
    }

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      byMethod,
    };
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    if (updatePaymentDto.paymentDate) {
      payment.paymentDate = new Date(updatePaymentDto.paymentDate);
    }
    return this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async generatePaymentNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAY-${datePrefix}-`;

    const lastPayment = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.payment_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.payment_number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(
        lastPayment.paymentNumber.replace(prefix, ''),
        10,
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
