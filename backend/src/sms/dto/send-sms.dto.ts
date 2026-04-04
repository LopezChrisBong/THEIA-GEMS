import { ApiProperty } from '@nestjs/swagger';

export class SendSMSDTO {
  @ApiProperty()
  recipient: string;
  @ApiProperty()
  message: string;
}
