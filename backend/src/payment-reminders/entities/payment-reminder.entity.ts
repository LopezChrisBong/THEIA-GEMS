import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LayawayPlan } from '../../layaway-plans/entities/layaway-plan.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Users } from '../../auth/entities/auth.entity';

export enum ReminderType {
  UPCOMING = 'upcoming',
  DUE = 'due',
  OVERDUE = 'overdue',
  FINAL_NOTICE = 'final_notice',
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReminderChannel {
  SMS = 'sms',
  EMAIL = 'email',
  PHONE_CALL = 'phone_call',
  IN_PERSON = 'in_person',
}

@Entity('payment_reminders')
export class PaymentReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'layaway_plan_id' })
  layawayPlanId: number;

  @ManyToOne(() => LayawayPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'layaway_plan_id' })
  layawayPlan: LayawayPlan;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({
    name: 'reminder_type',
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.UPCOMING,
  })
  reminderType: ReminderType;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ReminderChannel,
    default: ReminderChannel.SMS,
  })
  channel: ReminderChannel;

  @Column({ name: 'scheduled_date', type: 'datetime' })
  scheduledDate: Date;

  @Column({ name: 'sent_date', type: 'datetime', nullable: true })
  sentDate: Date | null;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'sent_by', nullable: true })
  sentBy: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'sent_by' })
  sender: Users;

  @Column({ name: 'payment_due_date', type: 'date' })
  paymentDueDate: Date;

  @Column({ name: 'amount_due', type: 'decimal', precision: 10, scale: 2 })
  amountDue: number;

  @Column({ name: 'days_before_due', type: 'int', default: 0 })
  daysBeforeDue: number;

  @Column({ name: 'days_overdue', type: 'int', default: 0 })
  daysOverdue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
