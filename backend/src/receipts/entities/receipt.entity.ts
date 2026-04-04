import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Users } from '../../auth/entities/auth.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_id', unique: true })
  saleId: number;

  @OneToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'receipt_number', unique: true })
  receiptNumber: string;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'header_text', type: 'text', nullable: true })
  headerText: string;

  @Column({ name: 'footer_text', type: 'text', nullable: true })
  footerText: string;

  @Column({ name: 'logo_url', length: 255, nullable: true })
  logoUrl: string;

  @Column({ name: 'printed_at', type: 'datetime', nullable: true })
  printedAt: Date;

  @Column({ name: 'printed_by', nullable: true })
  printedBy: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'printed_by' })
  printer: Users;

  @Column({ name: 'reprint_count', type: 'int', default: 0 })
  reprintCount: number;
}
