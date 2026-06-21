import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
const hbs = require('handlebars');

hbs.registerHelper('isDefined', function (value) {
  return value != null || value != undefined ? true : false;
});

hbs.registerHelper('i1', function (otp) {
  return otp[0];
});

hbs.registerHelper('i2', function (otp) {
  return otp[1];
});

hbs.registerHelper('i3', function (otp) {
  return otp[2];
});

hbs.registerHelper('i4', function (otp) {
  return otp[3];
});

hbs.registerHelper('i5', function (otp) {
  return otp[4];
});

hbs.registerHelper('i6', function (otp) {
  return otp[5];
});

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: any) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: user.subject,
      template: 'confirmation1', // `.hbs` extension is appended automatically
      // attachments: [{
      //   filename: "invoice.pdf",
      //   path: "saved_invoices/" + user.pdfToAttach,
      //   contentType: 'application/pdf'
      // }],
      context: {
        invoice_no: user.invoice_no,
        PO: user.PO,
        note: user.note,
      },
    });
  }

  async sendOTP(user: any) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to DNSC-HIS! Confirm your Email',
      template: 'otp1', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        OTP: user.OTP,
      },
      attachments: [
        {
          filename: 'headerImg',
          path: join(process.cwd(), '/../static/img/HIS_LOGO3.png'),
          cid: 'headerImg',
        },
      ],
    });
  }

  async sendTempPassword(user: any) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to DNSC-HIS! Temporary Password',
      template: 'reset-password', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        new_password: user.new_password,
      },
      attachments: [
        {
          filename: 'headerImg',
          path: join(process.cwd(), '/../static/img/HIS_LOGO3.png'),
          cid: 'headerImg',
        },
      ],
    });
  }

  async sendConfirmation(user: any) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to DNSC-HIS!',
      template: 'confirmation', // `.hbs` extension is appended automatically
      attachments: [
        {
          filename: 'headerImg',
          path: join(process.cwd(), '/../static/img/HIS_LOGO3.png'),
          cid: 'headerImg',
        },
      ],
    });
  }

  // ── LAYAWAY NOTIFICATIONS ──────────────────────────────────────────────
  async sendLayawayConfirmation(params: {
    to: string; customerName: string; planNumber: string;
    totalAmount: number; downPayment: number; remainingBalance: number;
    monthlyPayment: number; numberOfPayments: number; nextPaymentDate: string;
  }) {
    const fmt = (v: number) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#6B4A30;">Dear ${params.customerName},</p>
      <p style="color:#3A2515;">Your installment plan has been created successfully.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9A7858;">Plan Number</td><td style="font-weight:600;color:#3A2515;">${params.planNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Total Amount</td><td style="font-weight:600;color:#3A2515;">${fmt(params.totalAmount)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Down Payment</td><td style="color:#3A2515;">${fmt(params.downPayment)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Remaining Balance</td><td style="color:#3A2515;">${fmt(params.remainingBalance)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Monthly Payment</td><td style="font-weight:600;color:#9B6B3A;">${fmt(params.monthlyPayment)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Number of Payments</td><td style="color:#3A2515;">${params.numberOfPayments} months</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Next Payment Due</td><td style="font-weight:600;color:#3A2515;">${params.nextPaymentDate}</td></tr>
      </table>
      <p style="color:#9A7858;font-size:12px;text-align:center;margin-top:20px;">Theia Gems — Fine Jewelry</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: `Installment Plan Confirmed — ${params.planNumber}`, html });
  }

  async sendLayawayPaymentConfirmation(params: {
    to: string; customerName: string; planNumber: string;
    amountPaid: number; remainingBalance: number; nextPaymentDate: string | null; isCompleted: boolean;
  }) {
    const fmt = (v: number) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const statusMsg = params.isCompleted
      ? '<p style="color:#3D7A5A;font-weight:600;">Your installment plan is now fully paid. Thank you!</p>'
      : `<p style="color:#3A2515;">Next payment due: <strong>${params.nextPaymentDate}</strong></p>`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#6B4A30;">Dear ${params.customerName},</p>
      <p style="color:#3A2515;">We have received your payment for plan <strong>${params.planNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9A7858;">Amount Paid</td><td style="font-weight:600;color:#3D7A5A;">${fmt(params.amountPaid)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Remaining Balance</td><td style="font-weight:600;color:#9B6B3A;">${fmt(params.remainingBalance)}</td></tr>
      </table>
      ${statusMsg}
      <p style="color:#9A7858;font-size:12px;text-align:center;margin-top:20px;">Theia Gems — Fine Jewelry</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: `Payment Received — Plan ${params.planNumber}`, html });
  }

  async sendLayawayReminder(params: {
    to: string; customerName: string; planNumber: string;
    amountDue: number; dueDate: string; daysLeft: number;
  }) {
    const fmt = (v: number) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#3A2515;font-size:17px;font-weight:600;margin-bottom:16px;">Layaway Reminder! 💎✨</p>
      <p style="color:#3A2515;">Hi ${params.customerName}!</p>
      <p style="color:#3A2515;">Just a gentle reminder that your next payment for your layaway item amounting to <strong>${fmt(params.amountDue)}</strong> is due on <strong>${params.dueDate}</strong>.</p>
      <p style="color:#3A2515;">If you've already settled this payment, please disregard this message. Should you need any assistance, feel free to reach out. 🤍</p>
      <p style="color:#3A2515;">Thank you for choosing Theia Gems.</p>
      <p style="color:#6B4A30;font-style:italic;margin-top:20px;">Wear your Memories. Wear Theia Gems.<br/>Cristy</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: 'Layaway Reminder!', html });
  }

  async sendLayawayOverdue(params: {
    to: string; customerName: string; planNumber: string;
    amountDue: number; dueDate: string; daysOverdue: number;
  }) {
    const fmt = (v: number) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#B84040;font-size:17px;font-weight:600;margin-bottom:16px;">Overdue Reminder! 💎✨</p>
      <p style="color:#3A2515;">Hi ${params.customerName}!</p>
      <p style="color:#3A2515;">A gentle reminder that your payment for your layaway item amounting to <strong>${fmt(params.amountDue)}</strong> is already overdue.</p>
      <p style="color:#3A2515;">Kindly settle the payment at your earliest convenience to avoid any delays with your layaway plan. If payment has already been made, please disregard this message.</p>
      <p style="color:#3A2515;margin-top:20px;">Thank you! 🤍<br/>Theia Gems</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: 'Overdue Reminder!', html });
  }

  // ── TRANSFER NOTIFICATIONS ──────────────────────────────────────────────
  async sendTransferNotification(params: {
    to: string; recipientName: string; transferNumber: string;
    fromBranch: string; toBranch: string; itemCount: number; notes?: string;
  }) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#6B4A30;">Dear ${params.recipientName},</p>
      <p style="color:#3A2515;">A new inventory transfer has been created and is heading to your branch.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9A7858;">Transfer #</td><td style="font-weight:600;color:#3A2515;">${params.transferNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">From</td><td style="color:#3A2515;">${params.fromBranch}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">To</td><td style="font-weight:600;color:#3A2515;">${params.toBranch}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Items</td><td style="color:#3A2515;">${params.itemCount} item${params.itemCount !== 1 ? 's' : ''}</td></tr>
        ${params.notes ? `<tr><td style="padding:6px 0;color:#9A7858;">Notes</td><td style="color:#3A2515;">${params.notes}</td></tr>` : ''}
      </table>
      <p style="color:#9A7858;font-size:12px;text-align:center;margin-top:20px;">Theia Gems — Fine Jewelry</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: `Transfer ${params.transferNumber} — ${params.fromBranch} → ${params.toBranch}`, html });
  }

  // ── CONSIGNMENT NOTIFICATIONS ───────────────────────────────────────────
  async sendConsignmentAuthNotification(params: {
    to: string; consignorName: string; itemCode: string;
    isAuthentic: boolean; branch: string;
  }) {
    const status = params.isAuthentic ? 'Accepted as Genuine/Entrupy' : 'Rejected — Not Genuine';
    const color = params.isAuthentic ? '#3D7A5A' : '#B84040';
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#6B4A30;">Dear ${params.consignorName},</p>
      <p style="color:#3A2515;">Your consignment item has been reviewed.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9A7858;">Item Code</td><td style="font-weight:600;color:#3A2515;">${params.itemCode}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Branch</td><td style="color:#3A2515;">${params.branch}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Result</td><td style="font-weight:600;color:${color};">${status}</td></tr>
      </table>
      ${params.isAuthentic
        ? '<p style="color:#3A2515;">Your item is now listed and available for sale in our store.</p>'
        : '<p style="color:#3A2515;">Please contact us to arrange the return of your item.</p>'}
      <p style="color:#9A7858;font-size:12px;text-align:center;margin-top:20px;">Theia Gems — Fine Jewelry</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: `Consignment Item ${params.isAuthentic ? 'Accepted' : 'Rejected'} — ${params.itemCode}`, html });
  }

  async sendConsignmentSoldNotification(params: {
    to: string; consignorName: string; itemCode: string;
    sellingPrice: number; commission: number; netPayout: number; branch: string;
  }) {
    const fmt = (v: number) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
      <h2 style="font-family:Georgia,serif;color:#3A2515;text-align:center;letter-spacing:0.06em;">THEIA GEMS</h2>
      <p style="color:#6B4A30;">Dear ${params.consignorName},</p>
      <p style="color:#3A2515;">Great news! Your consignment item has been sold.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#9A7858;">Item Code</td><td style="font-weight:600;color:#3A2515;">${params.itemCode}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Branch</td><td style="color:#3A2515;">${params.branch}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Selling Price</td><td style="color:#3A2515;">${fmt(params.sellingPrice)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Commission</td><td style="color:#B84040;">- ${fmt(params.commission)}</td></tr>
        <tr><td style="padding:6px 0;color:#9A7858;">Your Payout</td><td style="font-weight:700;color:#3D7A5A;">${fmt(params.netPayout)}</td></tr>
      </table>
      <p style="color:#3A2515;">Please visit Theia Gems to claim your payout. Thank you for consigning with us!</p>
      <p style="color:#9A7858;font-size:12px;text-align:center;margin-top:20px;">Theia Gems — Fine Jewelry</p>
    </div>`;
    await this.mailerService.sendMail({ to: params.to, subject: `Your Consignment Item Sold — ${params.itemCode}`, html });
  }

  async sendPromotional(params: { to: string; subject: string; body: string; customerName?: string }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FDFAF6;border:1px solid #e8dcc8;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h2 style="font-family:Georgia,serif;color:#3A2515;font-size:22px;letter-spacing:0.04em;">THEIA GEMS</h2>
        </div>
        ${params.customerName ? `<p style="color:#6B4A30;font-size:14px;">Dear ${params.customerName},</p>` : ''}
        <div style="color:#3A2515;font-size:14px;line-height:1.7;white-space:pre-wrap;">${params.body}</div>
        <hr style="border:none;border-top:1px solid #e8dcc8;margin:24px 0;" />
        <p style="color:#9A7858;font-size:11px;text-align:center;">Theia Gems — Fine Jewelry</p>
      </div>`;

    await this.mailerService.sendMail({
      to: params.to,
      subject: params.subject || 'Message from Theia Gems',
      html,
    });
  }
}
