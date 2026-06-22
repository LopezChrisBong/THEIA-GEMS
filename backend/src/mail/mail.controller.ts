import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { TestSendMailDto } from './dto/test-send-mail.dto';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

const SAMPLE_DEFAULTS: Record<string, Record<string, any>> = {
  layaway_reminder: {
    customerName: 'Juan Dela Cruz',
    planNumber: 'LP-20260622-0001',
    amountDue: 2500,
    dueDate: 'June 25, 2026',
    daysLeft: 3,
  },
  layaway_overdue: {
    customerName: 'Juan Dela Cruz',
    planNumber: 'LP-20260622-0001',
    amountDue: 2500,
    dueDate: 'June 15, 2026',
    daysOverdue: 7,
  },
  layaway_confirmation: {
    customerName: 'Juan Dela Cruz',
    planNumber: 'LP-20260622-0001',
    totalAmount: 25000,
    downPayment: 5000,
    remainingBalance: 20000,
    monthlyPayment: 2500,
    numberOfPayments: 8,
    nextPaymentDate: 'July 22, 2026',
  },
  layaway_payment_confirmation: {
    customerName: 'Juan Dela Cruz',
    planNumber: 'LP-20260622-0001',
    amountPaid: 2500,
    remainingBalance: 17500,
    nextPaymentDate: 'August 22, 2026',
    isCompleted: false,
  },
  transfer_notification: {
    recipientName: 'BGC Branch',
    transferNumber: 'TR-20260622-0001',
    fromBranch: 'Davao Branch',
    toBranch: 'BGC Branch',
    itemCount: 5,
    notes: 'Sample test transfer notification.',
  },
  consignment_auth: {
    consignorName: 'Maria Santos',
    itemCode: 'TG-RING-0042',
    isAuthentic: true,
    branch: 'Davao Branch',
  },
  consignment_sold: {
    consignorName: 'Maria Santos',
    itemCode: 'TG-RING-0042',
    sellingPrice: 45000,
    commission: 4500,
    netPayout: 40500,
    branch: 'Davao Branch',
  },
  aged_consignment: {
    days: 40,
    items: [
      {
        itemCode: 'TG-RING-0042',
        consignorName: 'Maria Santos',
        branch: 'Davao Branch',
        consignmentDate: 'May 13, 2026',
        daysHeld: 40,
        sellingPrice: 45000,
      },
    ],
  },
  promotional: {
    subject: 'Theia Gems — Test Promotional Email',
    body: 'This is a sample promotional message used for testing the email template.',
    customerName: 'Juan Dela Cruz',
  },
};

@ApiTags('Mail (Testing)')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  /**
   * Fires any mail template with sample data merged with caller-supplied overrides.
   * Built for manual QA of the notification system, not for production traffic.
   */
  @Post('test-send')
  async testSend(@Body() dto: TestSendMailDto) {
    const defaults = SAMPLE_DEFAULTS[dto.template] || {};
    const params = { to: dto.to, ...defaults, ...(dto.payload || {}) };

    switch (dto.template) {
      case 'layaway_reminder':
        await this.mailService.sendLayawayReminder(params as any);
        break;
      case 'layaway_overdue':
        await this.mailService.sendLayawayOverdue(params as any);
        break;
      case 'layaway_confirmation':
        await this.mailService.sendLayawayConfirmation(params as any);
        break;
      case 'layaway_payment_confirmation':
        await this.mailService.sendLayawayPaymentConfirmation(params as any);
        break;
      case 'transfer_notification':
        await this.mailService.sendTransferNotification(params as any);
        break;
      case 'consignment_auth':
        await this.mailService.sendConsignmentAuthNotification(params as any);
        break;
      case 'consignment_sold':
        await this.mailService.sendConsignmentSoldNotification(params as any);
        break;
      case 'aged_consignment':
        await this.mailService.sendAgedConsignmentReminder(params as any);
        break;
      case 'promotional':
        await this.mailService.sendPromotional(params as any);
        break;
      default:
        throw new BadRequestException(`Unknown template: ${dto.template}`);
    }

    return { sent: true, template: dto.template, to: dto.to };
  }
}
