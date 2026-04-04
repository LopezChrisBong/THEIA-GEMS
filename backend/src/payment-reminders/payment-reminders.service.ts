import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between } from 'typeorm';
import {
  PaymentReminder,
  ReminderStatus,
  ReminderType,
  ReminderChannel,
} from './entities/payment-reminder.entity';
import { CreatePaymentReminderDto } from './dto/create-payment-reminder.dto';
import { UpdatePaymentReminderDto } from './dto/update-payment-reminder.dto';

@Injectable()
export class PaymentRemindersService {
  constructor(
    @InjectRepository(PaymentReminder)
    private readonly paymentReminderRepository: Repository<PaymentReminder>,
  ) {}

  async create(
    createPaymentReminderDto: CreatePaymentReminderDto,
  ): Promise<PaymentReminder> {
    const { scheduledDate, paymentDueDate, sentDate, ...rest } = createPaymentReminderDto;
    const reminder = this.paymentReminderRepository.create({
      ...rest,
      scheduledDate: new Date(scheduledDate),
      paymentDueDate: new Date(paymentDueDate),
      sentDate: sentDate ? new Date(sentDate) : null,
    });
    return this.paymentReminderRepository.save(reminder);
  }

  async createBulk(
    reminders: CreatePaymentReminderDto[],
  ): Promise<PaymentReminder[]> {
    const entities = reminders.map((dto) => {
      const { scheduledDate, paymentDueDate, sentDate, ...rest } = dto;
      return this.paymentReminderRepository.create({
        ...rest,
        scheduledDate: new Date(scheduledDate),
        paymentDueDate: new Date(paymentDueDate),
        sentDate: sentDate ? new Date(sentDate) : null,
      });
    });
    return this.paymentReminderRepository.save(entities);
  }

  async findAll(): Promise<PaymentReminder[]> {
    return this.paymentReminderRepository.find({
      relations: ['layawayPlan', 'customer', 'sender'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PaymentReminder> {
    const reminder = await this.paymentReminderRepository.findOne({
      where: { id },
      relations: ['layawayPlan', 'customer', 'sender'],
    });
    if (!reminder) {
      throw new NotFoundException(`Payment reminder with ID ${id} not found`);
    }
    return reminder;
  }

  async findByLayawayPlan(layawayPlanId: number): Promise<PaymentReminder[]> {
    return this.paymentReminderRepository.find({
      where: { layawayPlanId },
      relations: ['customer', 'sender'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByCustomer(customerId: number): Promise<PaymentReminder[]> {
    return this.paymentReminderRepository.find({
      where: { customerId },
      relations: ['layawayPlan', 'sender'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByStatus(status: ReminderStatus): Promise<PaymentReminder[]> {
    return this.paymentReminderRepository.find({
      where: { status },
      relations: ['layawayPlan', 'customer', 'sender'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByType(type: ReminderType): Promise<PaymentReminder[]> {
    return this.paymentReminderRepository.find({
      where: { reminderType: type },
      relations: ['layawayPlan', 'customer', 'sender'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findPending(): Promise<PaymentReminder[]> {
    const now = new Date();
    return this.paymentReminderRepository.find({
      where: {
        status: ReminderStatus.PENDING,
        scheduledDate: LessThanOrEqual(now),
      },
      relations: ['layawayPlan', 'customer'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findScheduledForDate(date: Date): Promise<PaymentReminder[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.paymentReminderRepository.find({
      where: {
        scheduledDate: Between(startOfDay, endOfDay),
      },
      relations: ['layawayPlan', 'customer'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async markAsSent(id: number, sentBy: number): Promise<PaymentReminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.SENT;
    reminder.sentDate = new Date();
    reminder.sentBy = sentBy;
    return this.paymentReminderRepository.save(reminder);
  }

  async markAsFailed(id: number, notes?: string): Promise<PaymentReminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.FAILED;
    if (notes) {
      reminder.notes = notes;
    }
    return this.paymentReminderRepository.save(reminder);
  }

  async cancel(id: number): Promise<PaymentReminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.CANCELLED;
    return this.paymentReminderRepository.save(reminder);
  }

  async getSummary(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const [pending, sent, failed, cancelled] = await Promise.all([
      this.paymentReminderRepository.count({
        where: { status: ReminderStatus.PENDING },
      }),
      this.paymentReminderRepository.count({
        where: { status: ReminderStatus.SENT },
      }),
      this.paymentReminderRepository.count({
        where: { status: ReminderStatus.FAILED },
      }),
      this.paymentReminderRepository.count({
        where: { status: ReminderStatus.CANCELLED },
      }),
    ]);

    return { pending, sent, failed, cancelled };
  }

  async update(
    id: number,
    updatePaymentReminderDto: UpdatePaymentReminderDto,
  ): Promise<PaymentReminder> {
    const reminder = await this.findOne(id);
    Object.assign(reminder, updatePaymentReminderDto);
    if (updatePaymentReminderDto.scheduledDate) {
      reminder.scheduledDate = new Date(updatePaymentReminderDto.scheduledDate);
    }
    if (updatePaymentReminderDto.paymentDueDate) {
      reminder.paymentDueDate = new Date(updatePaymentReminderDto.paymentDueDate);
    }
    if (updatePaymentReminderDto.sentDate) {
      reminder.sentDate = new Date(updatePaymentReminderDto.sentDate);
    }
    return this.paymentReminderRepository.save(reminder);
  }

  async remove(id: number): Promise<void> {
    const reminder = await this.findOne(id);
    await this.paymentReminderRepository.remove(reminder);
  }
}
