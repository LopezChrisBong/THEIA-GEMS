import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum LayawayStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

@Entity('layaway_plans')
export class LayawayPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_number', unique: true })
  planNumber: string;

  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'down_payment', type: 'decimal', precision: 10, scale: 2 })
  downPayment: number;

  @Column({ name: 'remaining_balance', type: 'decimal', precision: 10, scale: 2 })
  remainingBalance: number;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 10, scale: 2 })
  monthlyPayment: number;

  @Column({ name: 'number_of_payments', type: 'int' })
  numberOfPayments: number;

  @Column({ name: 'payments_made', type: 'int', default: 0 })
  paymentsMade: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'next_payment_date', type: 'date', nullable: true })
  nextPaymentDate: Date | null;

  @Column({
    type: 'enum',
    enum: LayawayStatus,
    default: LayawayStatus.ACTIVE,
  })
  status: LayawayStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
