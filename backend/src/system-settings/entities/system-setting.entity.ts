import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../auth/entities/auth.entity';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'setting_key', unique: true, length: 100 })
  settingKey: string;

  @Column({ name: 'setting_value', type: 'text', nullable: true })
  settingValue: string | null;

  @Column({ name: 'setting_type', length: 50, nullable: true })
  settingType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: Users;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
