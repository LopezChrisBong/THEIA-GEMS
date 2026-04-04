import { Users } from 'src/auth/entities/auth.entity';
import { UserType } from 'src/user-type/entities/user-type.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserDetail {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  fname: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  mname: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  lname: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  suffix: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  bdate: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  birth_place: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 6,
  })
  sex: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  email: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  civil_status: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  civil_status_others: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  height: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  weight: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 10,
  })
  blood_type: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  GSIS: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  PHILHEALTH: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  PAGIBIG: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  SSS: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  TIN: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  agency_employee_num: string;

  @Column({
    type: 'tinyint',
    default: false,
  })
  is_dual_citizen: boolean;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  citizenship: string;

  @Column({
    nullable: true,
    type: 'int',
  })
  citizenship_type: number;

  @Column({
    nullable: true,
    type: 'int',
  })
  country: number;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  tel_no: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 13,
  })
  mobile_no: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_zip: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_house_no: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_street: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_subd: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_brgy: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_city: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  residential_prov: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_zip: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_house_no: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_street: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_subd: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_brgy: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_city: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  permanent_prov: string;

  @Column({
    nullable: true,
    type: 'tinyint',
    default: false,
  })
  isApproved: boolean;

  @Column({
    type: 'int',
    default: 1,
  })
  status: number;

  @Column({
    nullable: true,
    type: 'tinyint',
  })
  isSameAddress: boolean;

  @Column({
    nullable: true,
    type: 'datetime',
  })
  date_approved: string;

  @Column({
    nullable: true,
    type: 'int',
  })
  userID: number;

  @Column({
    nullable: true,
    type: 'int',
    name: 'branch_id',
  })
  branchId: number;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 150,
  })
  profile_img: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  allowedPDSUpdateID: number;

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
}
