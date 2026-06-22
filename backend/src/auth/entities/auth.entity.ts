import { Exclude } from 'class-transformer';
import { UserDetail } from 'src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  email: string;

  @Exclude()
  @Column({
    type: 'text',
    nullable: false,
    select: false,
  })
  password: string;

  @Column({
    nullable: true,
    type: 'int',
  })
  usertypeID: number;

  @Column({
    nullable: true,
    type: 'int',
  })
  user_roleID: number;

  @Column({
    nullable: true,
    type: 'int',
    default: 2,
  })
  assignedModuleID: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  otp: string;

  @Column({ type: 'tinyint', default: false })
  isValidated: boolean;

  @Column({ type: 'tinyint', default: false })
  isAdminApproved: boolean;

  @Column({ type: 'tinyint', default: false })
  canAccessNotifications: boolean;

  @CreateDateColumn({
    nullable: false,
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    default: () => 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date;

  // @OneToOne(type => UserDetail)
  // @JoinColumn({ referencedColumnName: 'id' })
  // userdetail: UserDetail
}
