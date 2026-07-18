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
import { Users } from '../../auth/entities/auth.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  GCASH = 'gcash',
  MAYA = 'maya',
  CHECK = 'check',
  OTHER = 'other',
}

export enum PaymentType {
  FULL = 'full',
  PARTIAL = 'partial',
  DEPOSIT = 'deposit',
  LAYAWAY = 'layaway',
  REFUND = 'refund',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'payment_number', unique: true })
  paymentNumber: string;

  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

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

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  paymentType: PaymentType;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string;

  @Column({ name: 'payment_date', type: 'datetime' })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
