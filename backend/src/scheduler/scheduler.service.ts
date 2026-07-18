import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as XLSX from 'xlsx';
import { LayawayPlansService } from '../layaway-plans/layaway-plans.service';
import { ConsignmentItemsService } from '../consignment-items/consignment-items.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { SalesService, SaleLineItem } from '../sales/sales.service';
import { BranchesService } from '../branches/branches.service';
import { PaymentsService } from '../payments/payments.service';
import { Payment, PaymentMethod } from '../payments/entities/payment.entity';
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
    private readonly paymentsService: PaymentsService,
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

      const [branchReports, payments] = await Promise.all([
        Promise.all(
          branches.map(async (branch) => {
            const report = await this.salesService.getSalesReport(
              'daily',
              new Date(start),
              new Date(end),
              branch.branchId,
            );
            return { branch, report: report as BranchSalesReport['report'] };
          }),
        ),
        this.paymentsService.findByDateRange(new Date(start), new Date(end)),
      ]);

      const totalOrders = branchReports.reduce((s, b) => s + b.report.summary.totalOrders, 0);
      const attachment = this.buildSalesReportExcel(branchReports, payments, start, end, dateLabel);

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

  /** Parse payment notes to determine the specific sub-type column key. */
  private paymentColumnKey(p: Payment): string {
    const notes = (p.notes || '').toLowerCase();
    if (p.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      if (notes.includes('bank: bpi')) return 'BT-BPI';
      if (notes.includes('bank: bdo')) return 'BT-BDO';
      if (notes.includes('bank: pnb')) return 'BT-PNB';
      return 'BT-BDO'; // fallback
    }
    if (p.paymentMethod === PaymentMethod.CREDIT_CARD) {
      if (notes.includes('terminal: bpi')) return 'CC-BPI';
      if (notes.includes('terminal: bdo')) return 'CC-BDO';
      if (notes.includes('terminal: paymaya') || notes.includes('terminal: maya')) return 'CC-PAYMAYA';
      return 'CC-BDO'; // fallback
    }
    if (p.paymentMethod === PaymentMethod.GCASH) return 'GCASH';
    if (p.paymentMethod === PaymentMethod.CHECK) return 'CHEQUE';
    return 'CASH';
  }

  private buildSalesReportExcel(
    branchReports: BranchSalesReport[],
    payments: Payment[],
    start: Date,
    end: Date,
    dateLabel: string,
  ): Buffer {
    const wb = XLSX.utils.book_new();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    // ── Aggregate totals across all branches ──
    let grandOrders = 0, grandRevenue = 0, grandDiscount = 0, grandTax = 0;
    let grandPaid = 0, grandPartial = 0, grandLayaway = 0;
    const allGrouped: Record<string, { label: string; orders: number; revenue: number; discount: number }> = {};

    for (const { report } of branchReports) {
      const s = report.summary;
      grandOrders += s.totalOrders;
      grandRevenue += s.totalRevenue;
      grandDiscount += s.totalDiscount;
      grandTax += s.totalTax;
      grandPaid += s.paidCount;
      grandPartial += s.partialCount;
      grandLayaway += s.layawayCount;
      for (const g of (report as any).grouped ?? []) {
        if (!allGrouped[g.label]) allGrouped[g.label] = { label: g.label, orders: 0, revenue: 0, discount: 0 };
        allGrouped[g.label].orders += g.orders;
        allGrouped[g.label].revenue += g.revenue;
        allGrouped[g.label].discount += g.discount;
      }
    }
    const avgOrder = grandOrders > 0 ? grandRevenue / grandOrders : 0;
    const groupedRows = Object.values(allGrouped);

    // ── Payment method columns (fixed order) ──
    const PAY_COLS = ['CASH', 'GCASH', 'BT-BPI', 'BT-BDO', 'BT-PNB', 'CC-BDO', 'CC-BPI', 'CC-PAYMAYA', 'CHEQUE'];

    // ── Build the Summary sheet ──
    const rows: (string | number)[][] = [];

    // Header
    rows.push(['THEIA GEMS — SALES REPORT', '', `From: ${fmt(start)}`, `To: ${fmt(end)}`]);
    rows.push(['Period: Daily']);
    rows.push([]);

    // Overview
    rows.push(['OVERVIEW']);
    rows.push(['Total Orders', grandOrders]);
    rows.push(['Total Revenue', Number(grandRevenue.toFixed(2))]);
    rows.push(['Total Discount', Number(grandDiscount.toFixed(2))]);
    rows.push(['Total Tax', Number(grandTax.toFixed(2))]);
    rows.push(['Avg. Order Value', Number(avgOrder.toFixed(4))]);
    rows.push(['Paid Orders', grandPaid]);
    rows.push(['Partial Orders', grandPartial]);
    rows.push(['Layaway Orders', grandLayaway]);
    rows.push([]);

    // Daily Breakdown
    rows.push(['DAILY BREAKDOWN']);
    rows.push(['Period', 'Orders', 'Revenue (₱)', 'Discount (₱)', 'Avg. Order (₱)']);
    for (const g of groupedRows) {
      const avg = g.orders > 0 ? g.revenue / g.orders : 0;
      rows.push([g.label, g.orders, Number(g.revenue.toFixed(2)), Number(g.discount.toFixed(2)), Number(avg.toFixed(2))]);
    }
    rows.push([]);
    rows.push([]);

    // Payment Method Breakdown
    rows.push(['PAYMENT METHOD', ...PAY_COLS]);

    const colTotals: Record<string, number> = {};
    PAY_COLS.forEach((c) => (colTotals[c] = 0));

    payments.forEach((p, idx) => {
      const col = this.paymentColumnKey(p);
      const amt = Number(p.amount);
      colTotals[col] = (colTotals[col] ?? 0) + amt;
      const row: (string | number)[] = [`TRANSACTION ${idx + 1}`];
      for (const c of PAY_COLS) {
        row.push(c === col ? amt : '');
      }
      rows.push(row);
    });

    if (payments.length === 0) {
      rows.push(['No transactions recorded.', ...PAY_COLS.map(() => '')]);
    }

    rows.push([]);
    const totalRow: (string | number)[] = ['TOTAL'];
    for (const c of PAY_COLS) {
      totalRow.push(colTotals[c] > 0 ? Number(colTotals[c].toFixed(2)) : 0);
    }
    rows.push(totalRow);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sales Report');

    // ── Per-branch item detail sheets ──
    const usedNames = new Set<string>(['Sales Report']);
    for (const { branch, report } of branchReports) {
      const detailRows: (string | number)[][] = [
        [`${branch.branchName} — Items Sold (${dateLabel})`],
        [],
        ['Sale #', 'Time', 'Item Code', 'Category', 'Name', 'Description', 'Unit Price (₱)'],
        ...report.items.map((i) => [
          i.saleNumber || '',
          i.saleDate ? new Date(i.saleDate).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '',
          i.itemCode || '',
          i.category || '',
          i.brand || '',
          i.description || '',
          Number(i.unitPrice.toFixed(2)),
        ]),
      ];
      if (report.items.length === 0) detailRows.push(['No items sold.']);

      let sheetName = branch.branchName.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || `Branch ${branch.branchId}`;
      let suffix = 1;
      while (usedNames.has(sheetName)) sheetName = `${sheetName.slice(0, 28)}_${suffix++}`;
      usedNames.add(sheetName);

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), sheetName);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
