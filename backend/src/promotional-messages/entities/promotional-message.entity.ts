import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Users } from '../../auth/entities/auth.entity';

export enum MessageType {
  PROMOTIONAL = 'promotional',
  REMINDER = 'reminder',
  ANNOUNCEMENT = 'announcement',
}

export enum SendMethod {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both',
}

export enum MessageStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('promotional_messages')
export class PromotionalMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    default: MessageType.PROMOTIONAL,
  })
  messageType: MessageType;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({
    name: 'send_method',
    type: 'enum',
    enum: SendMethod,
    default: SendMethod.EMAIL,
  })
  sendMethod: SendMethod;

  @Column({ length: 200, nullable: true })
  subject: string;

  @Column({ name: 'message_content', type: 'text' })
  messageContent: string;

  @Column({ name: 'scheduled_date', type: 'datetime', nullable: true })
  scheduledDate: Date | null;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.DRAFT,
  })
  status: MessageStatus;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'created_by' })
  creator: Users;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
