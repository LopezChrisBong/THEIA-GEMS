import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Users } from '../../auth/entities/auth.entity';

export enum TransactionAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('transaction_logs')
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_type', length: 50 })
  transactionType: string;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'table_name', length: 50 })
  tableName: string;

  @Column({
    type: 'enum',
    enum: TransactionAction,
  })
  action: TransactionAction;

  @Column({ name: 'old_values', type: 'json', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'json', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'performed_by' })
  performedBy: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'performed_by' })
  performer: Users;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
