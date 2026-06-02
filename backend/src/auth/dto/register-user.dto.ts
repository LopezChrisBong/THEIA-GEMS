import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, MinLength } from "class-validator";

export class RegisterUserDto {
    @ApiProperty()
    @IsNotEmpty()
    fname: string;

    @ApiProperty()
    mname: string;

    @ApiProperty()
    @IsNotEmpty()
    lname: string;

    @ApiProperty()
    suffix: string;

    @ApiProperty()
    positionID: string;

    @ApiProperty()
    instituteID: string;

    @ApiProperty()
    empStatusID: string;

    @ApiProperty()
    officeID: string;

    @ApiProperty()
    designationID: string;
    
    @ApiProperty()
    user_roleID

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    assignedModuleID?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    branchId?: number;

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

}