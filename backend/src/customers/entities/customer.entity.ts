import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_code', type: 'varchar', length: 50, unique: true, nullable: true })
  customerCode: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'is_repeat_buyer', type: 'boolean', default: false })
  isRepeatBuyer: boolean;

  @Column({ name: 'total_purchases', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPurchases: number;

  @Column({ name: 'purchase_count', type: 'int', default: 0 })
  purchaseCount: number;

  @Column({ name: 'registered_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registeredAt: Date;

  @Column({ name: 'last_purchase_at', type: 'timestamp', nullable: true })
  lastPurchaseAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
