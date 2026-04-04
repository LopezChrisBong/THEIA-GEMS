import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateVerifiedUser {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  userID: number;

  @ApiProperty()
  positionID: number;

  @ApiProperty()
  empID: string;

  @ApiProperty()
  date_hired: string;

  @ApiProperty()
  officeID: number;

  @ApiProperty()
  designationID: number;

  @ApiProperty()
  empStatusID: number;

  @ApiProperty()
  usertypeID: number;

  @ApiProperty()
  user_roleID: number;

  @ApiProperty()
  assignedModuleID: number;

  @ApiProperty()
  update_type: number;

  @ApiProperty({ required: false })
  branchId?: number;
}
