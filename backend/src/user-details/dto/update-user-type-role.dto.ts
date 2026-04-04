import { ApiProperty } from "@nestjs/swagger";

export class UserTypeRole {
    @ApiProperty()
    id: number

    @ApiProperty()
    user_roleID: number

    @ApiProperty()
    usertypeID: number

    @ApiProperty({ required: false })
    branchId?: number

}