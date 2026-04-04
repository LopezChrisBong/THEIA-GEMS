import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from 'src/branches/entities/branch.entity';
import { Users } from 'src/auth/entities/auth.entity';

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transfer_number', type: 'varchar', length: 50, unique: true })
  transferNumber: string;

  @Column({ name: 'from_branch_id' })
  fromBranchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'from_branch_id' })
  fromBranch: Branch;

  @Column({ name: 'to_branch_id' })
  toBranchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'to_branch_id' })
  toBranch: Branch;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Column({ name: 'requested_by' })
  requestedBy: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'requested_by' })
  requester: Users;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: Users;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'transfer_date', type: 'date' })
  transferDate: Date;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
