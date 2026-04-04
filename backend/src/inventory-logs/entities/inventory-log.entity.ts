import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { JewelryItem } from '../../jewelry-items/entities/jewelry-item.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Users } from '../../auth/entities/auth.entity';

export enum ActionType {
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  ADJUST = 'adjust',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  SALE = 'sale',
  RETURN = 'return',
  STATUS_CHANGE = 'status_change',
}

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'jewelry_item_id', nullable: true })
  jewelryItemId: number;

  @ManyToOne(() => JewelryItem, { nullable: true })
  @JoinColumn({ name: 'jewelry_item_id' })
  jewelryItem: JewelryItem;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ name: 'previous_status', type: 'varchar', length: 50, nullable: true })
  previousStatus: string;

  @Column({ name: 'new_status', type: 'varchar', length: 50, nullable: true })
  newStatus: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: number;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'performed_by' })
  performedBy: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'performed_by' })
  performer: Users;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
