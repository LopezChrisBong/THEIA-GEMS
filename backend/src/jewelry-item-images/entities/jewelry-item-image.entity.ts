import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JewelryItem } from 'src/jewelry-items/entities/jewelry-item.entity';

@Entity('jewelry_item_images')
export class JewelryItemImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'jewelry_item_id', nullable: false })
  jewelryItemId: number;

  @ManyToOne(() => JewelryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jewelry_item_id' })
  jewelryItem: JewelryItem;

  @Column({ name: 'image_path', type: 'varchar', length: 255, nullable: false })
  imagePath: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
