import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SchedulerService } from './scheduler.service';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

// Every route here fans real SMS/email out to every matching customer — keep tightly throttled.
@ApiTags('Scheduler (Testing)')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Throttle({ default: { limit: 3, ttl: 300000 } })
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  /** Manually runs the full daily notification sweep (8 AM + 8 PM jobs) against real data. */
  @Post('run-all')
  async runAll() {
    const [daily, endOfDay] = await Promise.all([
      this.schedulerService.runDailyNotifications(),
      this.schedulerService.runEndOfDayReport(),
    ]);
    return { ...daily, ...endOfDay };
  }

  @Post('upcoming-reminders')
  upcomingReminders() {
    return this.schedulerService.sendUpcomingReminders();
  }

  @Post('overdue-alerts')
  overdueAlerts() {
    return this.schedulerService.sendOverdueAlerts();
  }

  @Post('upcoming-installment-reminders')
  upcomingInstallmentReminders() {
    return this.schedulerService.sendUpcomingInstallmentReminders();
  }

  @Post('overdue-installment-alerts')
  overdueInstallmentAlerts() {
    return this.schedulerService.sendOverdueInstallmentAlerts();
  }

  @Post('aged-consignment-alerts')
  agedConsignmentAlerts() {
    return this.schedulerService.sendAgedConsignmentAlerts();
  }

  @Post('low-stock-alerts')
  lowStockAlerts() {
    return this.schedulerService.sendLowStockAlerts();
  }

  @Post('daily-sales-report')
  dailySalesReport() {
    return this.schedulerService.sendDailySalesReportEmail();
  }
}
