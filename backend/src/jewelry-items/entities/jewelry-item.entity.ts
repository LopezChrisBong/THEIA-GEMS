import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { StoneType } from 'src/stone-types/entities/stone-type.entity';
import { JewelryType } from 'src/jewelry-types/entities/jewelry-type.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { JewelryItemImage } from 'src/jewelry-item-images/entities/jewelry-item-image.entity';
import { Users } from 'src/auth/entities/auth.entity';

export enum GoldType {
  YG = 'YG',
  WG = 'WG',
  RG = 'RG',
  TWO_TONED = 'TWO_TONED',
}

export enum JewelryItemStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
  TRANSFERRED = 'TRANSFERRED',
  CONSIGNMENT = 'CONSIGNMENT',
  LAYAWAY = 'LAYAWAY',
  PULLED_OUT = 'PULLED_OUT',
  RESERVED = 'RESERVED',
}

@Entity('jewelry_items')
export class JewelryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'item_code', type: 'varchar', length: 50, unique: true, nullable: false })
  itemCode: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'brand', type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ name: 'color', type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ name: 'material', type: 'varchar', length: 100, nullable: true })
  material: string;

  @Column({ name: 'stone_type_id', nullable: true })
  stoneTypeId: number;

  @ManyToOne(() => StoneType, { nullable: true })
  @JoinColumn({ name: 'stone_type_id' })
  stoneType: StoneType;

  @Column({ name: 'jewelry_type_id', nullable: true })
  jewelryTypeId: number;

  @ManyToOne(() => JewelryType, { nullable: true })
  @JoinColumn({ name: 'jewelry_type_id' })
  jewelryType: JewelryType;

  @Column({
    name: 'gold_type',
    type: 'enum',
    enum: GoldType,
    nullable: true,
  })
  goldType: GoldType;

  @Column({ name: 'carat', type: 'varchar', length: 100, nullable: true })
  carat: string;

  @Column({ name: 'gold_weight', type: 'varchar', length: 50, nullable: true })
  goldWeight: string;

  @Column({ name: 'karat', type: 'varchar', length: 20, nullable: true })
  karat: string;

  @Column({ name: 'size', type: 'varchar', length: 50, nullable: true })
  size: string;

  @Column({ name: 'ring_size', type: 'varchar', length: 50, nullable: true })
  ringSize: string;

  @Column({ name: 'band_width', type: 'varchar', length: 20, nullable: true })
  bandWidth: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: JewelryItemStatus,
    default: JewelryItemStatus.IN_STOCK,
  })
  status: JewelryItemStatus;

  @Column({ name: 'branch_id', nullable: false })
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_code', type: 'varchar', length: 100, nullable: true })
  supplierCode: string;

  @Column({ name: 'barcode', type: 'varchar', length: 100, nullable: true })
  barcode: string;

  @Column({ name: 'parent_item_id', nullable: true })
  parentItemId: number;

  @ManyToOne(() => JewelryItem, (item) => item.children, { nullable: true })
  @JoinColumn({ name: 'parent_item_id' })
  parentItem: JewelryItem;

  @OneToMany(() => JewelryItem, (item) => item.parentItem)
  children: JewelryItem[];

  @OneToMany(() => JewelryItemImage, (image) => image.jewelryItem)
  images: JewelryItemImage[];

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sale_date', type: 'date', nullable: true })
  saleDate: Date;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'added_by', nullable: true })
  addedBy: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'added_by' })
  addedByUser: Users;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
