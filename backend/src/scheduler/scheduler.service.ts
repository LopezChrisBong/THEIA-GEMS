import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as XLSX from 'xlsx';
import { LayawayPlansService } from '../layaway-plans/layaway-plans.service';
import { ConsignmentItemsService } from '../consignment-items/consignment-items.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { SalesService, SaleLineItem } from '../sales/sales.service';
import { BranchesService } from '../branches/branches.service';
import { Branch } from '../branches/entities/branch.entity';

const REMINDER_DAYS = 3; // send reminder 3 days before due date
const AGED_CONSIGNMENT_DAYS = 40; // alert owner once a consignment item has sat unsold this long

interface BranchSalesReport {
  branch: Branch;
  report: {
    summary: {
      totalOrders: number;
      totalRevenue: number;
      totalDiscount: number;
      totalTax: number;
      avgOrderValue: number;
      paidCount: number;
      partialCount: number;
      layawayCount: number;
      totalCost: number;
      totalProfit: number;
    };
    items: SaleLineItem[];
  };
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly layawayPlansService: LayawayPlansService,
    private readonly consignmentItemsService: ConsignmentItemsService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly salesService: SalesService,
    private readonly branchesService: BranchesService,
  ) {}

  private fmtDate(d: Date | string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** Runs every day at 8:00 AM — customer-facing layaway reminders + owner consignment alert */
  @Cron('0 8 * * *')
  async runDailyNotifications() {
    this.logger.log('Running daily layaway notification check...');
    const [upcoming, overdue, agedConsignment] = await Promise.all([
      this.sendUpcomingReminders(),
      this.sendOverdueAlerts(),
      this.sendAgedConsignmentAlerts(),
    ]);
    return { upcoming, overdue, agedConsignment };
  }

  /** Runs every day at 8:00 PM — end-of-day sales report to the owner, broken down by branch */
  @Cron('0 20 * * *')
  async runEndOfDayReport() {
    this.logger.log('Running end-of-day sales report...');
    const salesReport = await this.sendDailySalesReportEmail();
    return { salesReport };
  }

  async sendUpcomingReminders(): Promise<{ count: number; message: string }> {
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
          const sms = `Layaway Reminder!\n\nHi ${customerName}! 💎✨\n\nJust a gentle reminder that your next payment for your layaway item amounting to ₱${Number(plan.monthlyPayment).toFixed(2)} is due on ${this.fmtDate(plan.nextPaymentDate)}.\n\nIf you've already settled this payment, please disregard this message. Should you need any assistance, feel free to reach out. 🤍\n\nThank you for choosing Theia Gems.\n\nWear your Memories. Wear Theia Gems.\nCristy`;
          this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: sms })
            .catch((e) => this.logger.error(`Reminder SMS failed for plan ${plan.planNumber}`, e));
        }
      }
      const message = `Sent reminders for ${plans.length} upcoming plan(s).`;
      this.logger.log(message);
      return { count: plans.length, message };
    } catch (e) {
      this.logger.error('sendUpcomingReminders error', e);
      return { count: 0, message: e?.message || 'sendUpcomingReminders failed' };
    }
  }

  async sendOverdueAlerts(): Promise<{ count: number; message: string }> {
    try {
      const plans = await this.layawayPlansService.findOverdue();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let alerted = 0;

      for (const plan of plans) {
        if (!plan.customer || !plan.nextPaymentDate) continue;
        // Only alert if actually past due (not just today)
        const dueDate = new Date(plan.nextPaymentDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate >= today) continue;

        const customerName = `${plan.customer.firstName} ${plan.customer.lastName}`;
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        alerted++;

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
          const sms = `Overdue Reminder!\n\nHi ${customerName}! 💎✨\n\nA gentle reminder that your payment for your layaway item amounting to ₱${Number(plan.monthlyPayment).toFixed(2)} is already overdue.\n\nKindly settle the payment at your earliest convenience to avoid any delays with your layaway plan. If payment has already been made, please disregard this message.\n\nThank you! 🤍\nTheia Gems`;
          this.smsService.sendSmsSemaphore({ recipient: plan.customer.phone, message: sms })
            .catch((e) => this.logger.error(`Overdue SMS failed for plan ${plan.planNumber}`, e));
        }
      }
      const message = `Sent overdue alerts for ${alerted} plan(s).`;
      this.logger.log(message);
      return { count: alerted, message };
    } catch (e) {
      this.logger.error('sendOverdueAlerts error', e);
      return { count: 0, message: e?.message || 'sendOverdueAlerts failed' };
    }
  }

  async sendAgedConsignmentAlerts(): Promise<{ count: number; message: string }> {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      const message = 'OWNER_EMAIL is not set — skipping aged consignment alert.';
      this.logger.warn(message);
      return { count: 0, message };
    }

    try {
      const items = await this.consignmentItemsService.findAgedActive(AGED_CONSIGNMENT_DAYS);
      if (items.length === 0) {
        const message = 'No aged consignment items found.';
        this.logger.log(message);
        return { count: 0, message };
      }

      const today = new Date();
      const payload = items.map((item) => {
        const consignedOn = new Date(item.consignmentDate);
        const daysHeld = Math.floor((today.getTime() - consignedOn.getTime()) / (1000 * 60 * 60 * 24));
        return {
          itemCode: item.jewelryItem?.itemCode || `#${item.id}`,
          consignorName: item.consignorName,
          branch: item.branch?.branchName || '—',
          consignmentDate: this.fmtDate(item.consignmentDate),
          daysHeld,
          sellingPrice: Number(item.sellingPrice),
        };
      });

      await this.mailService.sendAgedConsignmentReminder({
        to: ownerEmail,
        days: AGED_CONSIGNMENT_DAYS,
        items: payload,
      });

      const message = `Sent aged consignment alert to owner for ${items.length} item(s).`;
      this.logger.log(message);
      return { count: items.length, message };
    } catch (e) {
      this.logger.error('sendAgedConsignmentAlerts error', e);
      return { count: 0, message: e?.message || 'sendAgedConsignmentAlerts failed' };
    }
  }

  async sendDailySalesReportEmail(): Promise<{ count: number; message: string }> {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      const message = 'OWNER_EMAIL is not set — skipping daily sales report.';
      this.logger.warn(message);
      return { count: 0, message };
    }

    try {
      // Report covers "today" since this now runs at end-of-day (8 PM).
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const dateLabel = this.fmtDate(start);

      const branches = (await this.branchesService.findAll()).filter((b) => b.isActive);

      const branchReports: BranchSalesReport[] = await Promise.all(
        branches.map(async (branch) => {
          const report = await this.salesService.getSalesReport(
            'daily',
            new Date(start),
            new Date(end),
            branch.branchId,
          );
          return { branch, report: report as BranchSalesReport['report'] };
        }),
      );

      const totalOrders = branchReports.reduce((s, b) => s + b.report.summary.totalOrders, 0);
      const attachment = this.buildSalesReportExcel(branchReports, dateLabel);

      await this.mailService.sendDailySalesReport({
        to: ownerEmail,
        dateLabel,
        branchReports: branchReports.map((b) => ({
          branchName: b.branch.branchName,
          summary: b.report.summary,
        })),
        attachment,
        filename: `Daily-Sales-Report-${start.toISOString().slice(0, 10)}.xlsx`,
      });

      const message = `Sent daily sales report to owner for ${dateLabel} across ${branches.length} branch(es) — ${totalOrders} order(s) total.`;
      this.logger.log(message);
      return { count: totalOrders, message };
    } catch (e) {
      this.logger.error('sendDailySalesReportEmail error', e);
      return { count: 0, message: e?.message || 'sendDailySalesReportEmail failed' };
    }
  }

  private buildSalesReportExcel(branchReports: BranchSalesReport[], dateLabel: string): Buffer {
    const wb = XLSX.utils.book_new();

    // ── Overview sheet: one row per branch + grand total ──
    const overviewRows: (string | number)[][] = [
      ['THEIA GEMS — DAILY SALES REPORT'],
      [`Date: ${dateLabel}`],
      [],
      ['Branch', 'Orders', 'Revenue (₱)', 'Discount (₱)', 'Cost (₱)', 'Profit (₱)', 'Items Sold'],
    ];

    let grandOrders = 0, grandRevenue = 0, grandDiscount = 0, grandCost = 0, grandProfit = 0, grandItems = 0;

    for (const { branch, report } of branchReports) {
      const s = report.summary;
      overviewRows.push([
        branch.branchName,
        s.totalOrders,
        Number(s.totalRevenue.toFixed(2)),
        Number(s.totalDiscount.toFixed(2)),
        Number((s.totalCost || 0).toFixed(2)),
        Number((s.totalProfit || 0).toFixed(2)),
        report.items.length,
      ]);
      grandOrders += s.totalOrders;
      grandRevenue += s.totalRevenue;
      grandDiscount += s.totalDiscount;
      grandCost += s.totalCost || 0;
      grandProfit += s.totalProfit || 0;
      grandItems += report.items.length;
    }

    overviewRows.push([]);
    overviewRows.push([
      'GRAND TOTAL',
      grandOrders,
      Number(grandRevenue.toFixed(2)),
      Number(grandDiscount.toFixed(2)),
      Number(grandCost.toFixed(2)),
      Number(grandProfit.toFixed(2)),
      grandItems,
    ]);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewRows), 'Overview');

    // ── One sheet per branch with every item sold that day ──
    const usedNames = new Set<string>();
    for (const { branch, report } of branchReports) {
      const rows: (string | number)[][] = [
        [`${branch.branchName} — Items Sold (${dateLabel})`],
        [],
        ['Sale #', 'Time', 'Item Code', 'Category', 'Brand', 'Description', 'Unit Price (₱)', 'Unit Cost (₱)', 'Profit (₱)'],
        ...report.items.map((i) => [
          i.saleNumber || '',
          i.saleDate ? new Date(i.saleDate).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '',
          i.itemCode || '',
          i.category || '',
          i.brand || '',
          i.description || '',
          Number(i.unitPrice.toFixed(2)),
          i.unitCost != null ? Number(i.unitCost.toFixed(2)) : '',
          i.profit != null ? Number(i.profit.toFixed(2)) : '',
        ]),
      ];

      if (report.items.length === 0) {
        rows.push(['No items sold today.']);
      }

      let sheetName = branch.branchName.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || `Branch ${branch.branchId}`;
      let suffix = 1;
      while (usedNames.has(sheetName)) {
        sheetName = `${sheetName.slice(0, 28)}_${suffix++}`;
      }
      usedNames.add(sheetName);

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
