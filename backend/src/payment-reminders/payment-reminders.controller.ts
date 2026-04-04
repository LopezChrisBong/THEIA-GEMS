import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentRemindersService } from './payment-reminders.service';
import { CreatePaymentReminderDto } from './dto/create-payment-reminder.dto';
import { UpdatePaymentReminderDto } from './dto/update-payment-reminder.dto';
import {
  PaymentReminder,
  ReminderStatus,
  ReminderType,
} from './entities/payment-reminder.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Payment Reminders')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('payment-reminders')
export class PaymentRemindersController {
  constructor(
    private readonly paymentRemindersService: PaymentRemindersService,
  ) {}

  @Post()
  create(
    @Body() createPaymentReminderDto: CreatePaymentReminderDto,
  ): Promise<PaymentReminder> {
    return this.paymentRemindersService.create(createPaymentReminderDto);
  }

  @Post('bulk')
  createBulk(
    @Body() reminders: CreatePaymentReminderDto[],
  ): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.createBulk(reminders);
  }

  @Get()
  findAll(): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findAll();
  }

  @Get('pending')
  findPending(): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findPending();
  }

  @Get('summary')
  getSummary(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    return this.paymentRemindersService.getSummary();
  }

  @Get('scheduled')
  findScheduledForDate(@Query('date') date: string): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findScheduledForDate(
      new Date(date || Date.now()),
    );
  }

  @Get('plan/:planId')
  findByLayawayPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findByLayawayPlan(planId);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findByCustomer(customerId);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: ReminderStatus): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findByStatus(status);
  }

  @Get('type/:type')
  findByType(@Param('type') type: ReminderType): Promise<PaymentReminder[]> {
    return this.paymentRemindersService.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentReminder> {
    return this.paymentRemindersService.findOne(id);
  }

  @Post(':id/send')
  markAsSent(
    @Param('id', ParseIntPipe) id: number,
    @Body('sentBy') sentBy: number,
  ): Promise<PaymentReminder> {
    return this.paymentRemindersService.markAsSent(id, sentBy);
  }

  @Post(':id/fail')
  markAsFailed(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ): Promise<PaymentReminder> {
    return this.paymentRemindersService.markAsFailed(id, notes);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number): Promise<PaymentReminder> {
    return this.paymentRemindersService.cancel(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentReminderDto: UpdatePaymentReminderDto,
  ): Promise<PaymentReminder> {
    return this.paymentRemindersService.update(id, updatePaymentReminderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.paymentRemindersService.remove(id);
  }
}
