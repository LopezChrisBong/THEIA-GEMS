import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Scheduler (Testing)')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
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

  @Post('aged-consignment-alerts')
  agedConsignmentAlerts() {
    return this.schedulerService.sendAgedConsignmentAlerts();
  }

  @Post('daily-sales-report')
  dailySalesReport() {
    return this.schedulerService.sendDailySalesReportEmail();
  }
}
