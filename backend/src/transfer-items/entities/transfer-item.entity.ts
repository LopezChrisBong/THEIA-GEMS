import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transfer } from 'src/transfers/entities/transfer.entity';
import { JewelryItem } from 'src/jewelry-items/entities/jewelry-item.entity';

@Entity('transfer_items')
export class TransferItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transfer_id' })
  transferId: number;

  @ManyToOne(() => Transfer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;

  @Column({ name: 'jewelry_item_id' })
  jewelryItemId: number;

  @ManyToOne(() => JewelryItem)
  @JoinColumn({ name: 'jewelry_item_id' })
  jewelryItem: JewelryItem;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
