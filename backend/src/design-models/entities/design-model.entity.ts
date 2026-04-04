import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('design_models')
export class DesignModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'model_name', type: 'varchar', length: 100, unique: true, nullable: false })
  modelName: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
