import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_name', type: 'varchar', length: 100, nullable: false })
  categoryName: string;

  @Column({ name: 'parent_category_id', nullable: true })
  parentCategoryId: number;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  children: Category[];

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
