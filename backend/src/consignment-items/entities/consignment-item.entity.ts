import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JewelryItem } from 'src/jewelry-items/entities/jewelry-item.entity';
import { Branch } from 'src/branches/entities/branch.entity';

export enum ConsignmentStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RETURNED = 'returned', // legacy — kept for backward compat with existing DB rows
  PULLOUT = 'pullout',
  BUYOUT = 'buyout',
}

@Entity('consignment_items')
export class ConsignmentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'jewelry_item_id' })
  jewelryItemId: number;

  @ManyToOne(() => JewelryItem)
  @JoinColumn({ name: 'jewelry_item_id' })
  jewelryItem: JewelryItem;

  @Column({ name: 'consignor_name', type: 'varchar', length: 100 })
  consignorName: string;

  @Column({ name: 'consignor_email', type: 'varchar', length: 100, nullable: true })
  consignorEmail: string;

  @Column({ name: 'consignor_phone', type: 'varchar', length: 50, nullable: true })
  consignorPhone: string;

  @Column({ name: 'consigned_price', type: 'decimal', precision: 10, scale: 2 })
  consignedPrice: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2 })
  sellingPrice: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  commissionRate: number;

  @Column({ name: 'consignment_date', type: 'date' })
  consignmentDate: Date;

  @Column({
    type: 'enum',
    enum: ConsignmentStatus,
    default: ConsignmentStatus.ACTIVE,
  })
  status: ConsignmentStatus;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'is_authentic', type: 'boolean', nullable: true })
  isAuthentic: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
