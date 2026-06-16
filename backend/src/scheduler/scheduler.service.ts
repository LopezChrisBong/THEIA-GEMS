import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LayawayPlansService } from '../layaway-plans/layaway-plans.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

const REMINDER_DAYS = 3; // send reminder 3 days before due date

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly layawayPlansService: LayawayPlansService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  private fmtDate(d: Date | string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** Runs every day at 8:00 AM */
  @Cron('0 8 * * *')
  async runDailyNotifications() {
    this.logger.log('Running daily layaway notification check...');
    await Promise.all([
      this.sendUpcomingReminders(),
      this.sendOverdueAlerts(),
    ]);
  }

  async sendUpcomingReminders() {
    try {
      const plans = await this.layawayPlansService.findUpcoming(REMINDER_DAYS);
      for (const plan of plans) {
        if (!plan.customer) continue;
        const customerName = `${plan.customer.firstName} ${plan.customer.lastName}`;
        const dueDate = new Date(plan.nextPaymentDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (plan.customer.email) {
          this.mailService.sendLayawayReminder({
            to: plan.customer.email,
            customerName,
            planNumber: plan.planNumber,
            amountDue: Number(plan.monthlyPayment),
            dueDate: this.fmtDate(plan.nextPaymentDate),
            daysLeft,
          }).catch((e) => this.logger.error(`Reminder email failed for plan ${plan.planNumber}`, e));
        }

        if (plan.customer.phone) {
          const sms = `Hi ${customerName}, your Theia Gems installment (${plan.planNumber}) of ₱${Number(plan.monthlyPayment).toFixed(2)} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} on ${this.fmtDate(plan.nextPaymentDate)}. Please settle on time. Thank you!`;
          this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: sms })
            .catch((e) => this.logger.error(`Reminder SMS failed for plan ${plan.planNumber}`, e));
        }
      }
      this.logger.log(`Sent reminders for ${plans.length} upcoming plan(s).`);
    } catch (e) {
      this.logger.error('sendUpcomingReminders error', e);
    }
  }

  async sendOverdueAlerts() {
    try {
      const plans = await this.layawayPlansService.findOverdue();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const plan of plans) {
        if (!plan.customer || !plan.nextPaymentDate) continue;
        // Only alert if actually past due (not just today)
        const dueDate = new Date(plan.nextPaymentDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate >= today) continue;

        const customerName = `${plan.customer.firstName} ${plan.customer.lastName}`;
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (plan.customer.email) {
          this.mailService.sendLayawayOverdue({
            to: plan.customer.email,
            customerName,
            planNumber: plan.planNumber,
            amountDue: Number(plan.monthlyPayment),
            dueDate: this.fmtDate(plan.nextPaymentDate),
            daysOverdue,
          }).catch((e) => this.logger.error(`Overdue email failed for plan ${plan.planNumber}`, e));
        }

        if (plan.customer.phone) {
          const sms = `URGENT: Hi ${customerName}, your Theia Gems installment (${plan.planNumber}) of ₱${Number(plan.monthlyPayment).toFixed(2)} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} OVERDUE. Please contact us immediately to avoid plan cancellation.`;
          this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: sms })
            .catch((e) => this.logger.error(`Overdue SMS failed for plan ${plan.planNumber}`, e));
        }
      }
      this.logger.log(`Sent overdue alerts for ${plans.length} plan(s).`);
    } catch (e) {
      this.logger.error('sendOverdueAlerts error', e);
    }
  }
}
