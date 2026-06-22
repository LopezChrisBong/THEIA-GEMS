import { IsEmail, IsIn, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export const TEST_MAIL_TEMPLATES = [
  'layaway_reminder',
  'layaway_overdue',
  'layaway_confirmation',
  'layaway_payment_confirmation',
  'transfer_notification',
  'consignment_auth',
  'consignment_sold',
  'aged_consignment',
  'promotional',
] as const;

export type TestMailTemplate = (typeof TEST_MAIL_TEMPLATES)[number];

export class TestSendMailDto {
  @IsNotEmpty()
  @IsIn(TEST_MAIL_TEMPLATES)
  template: TestMailTemplate;

  @IsNotEmpty()
  @IsEmail()
  to: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
