import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Branch } from 'src/branches/entities/branch.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Users } from 'src/auth/entities/auth.entity';

export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  LAYAWAY = 'layaway',
  REFUNDED = 'refunded',
}

export enum SaleType {
  REGULAR = 'regular',
  LAYAWAY = 'layaway',
  CONSIGNMENT = 'consignment',
}

export enum SalesChannel {
  IG = 'ig',
  WEBSITE = 'website',
  WALK_IN = 'walk_in',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_number', type: 'varchar', length: 50, unique: true })
  saleNumber: string;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'cashier_id' })
  cashierId: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'cashier_id' })
  cashier: Users;

  @Column({ name: 'sale_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'change_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  changeAmount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'sale_type',
    type: 'enum',
    enum: SaleType,
    default: SaleType.REGULAR,
  })
  saleType: SaleType;

  @Column({
    name: 'sales_channel',
    type: 'enum',
    enum: SalesChannel,
    default: SalesChannel.WALK_IN,
  })
  salesChannel: SalesChannel;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
