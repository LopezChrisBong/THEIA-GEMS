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
