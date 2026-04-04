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
import { Users } from '../../auth/entities/auth.entity';
import { PaymentMethod } from '../../payments/entities/payment.entity';

@Entity('layaway_payments')
export class LayawayPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'receipt_number', unique: true })
  receiptNumber: string;

  @Column({ name: 'layaway_plan_id' })
  layawayPlanId: number;

  @ManyToOne(() => LayawayPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'layaway_plan_id' })
  layawayPlan: LayawayPlan;

  @Column({ name: 'received_by' })
  receivedBy: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'received_by' })
  receiver: Users;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string;

  @Column({ name: 'payment_date', type: 'datetime' })
  paymentDate: Date;

  @Column({ name: 'payment_number', type: 'int' })
  paymentNumber: number;

  @Column({ name: 'balance_before', type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
