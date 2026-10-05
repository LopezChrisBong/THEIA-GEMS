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
import { InstallmentPaymentsService } from './installment-payments.service';
import { CreateInstallmentPaymentDto } from './dto/create-installment-payment.dto';
import { UpdateInstallmentPaymentDto } from './dto/update-installment-payment.dto';
import { InstallmentPayment } from './entities/installment-payment.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Installment Payments')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('installment-payments')
export class InstallmentPaymentsController {
  constructor(
    private readonly installmentPaymentsService: InstallmentPaymentsService,
  ) {}

  @Post()
  create(
    @Body() createInstallmentPaymentDto: CreateInstallmentPaymentDto,
  ): Promise<InstallmentPayment> {
    return this.installmentPaymentsService.create(createInstallmentPaymentDto);
  }

  @Get()
  findAll(): Promise<InstallmentPayment[]> {
    return this.installmentPaymentsService.findAll();
  }

  @Get('generate-receipt')
  generateReceiptNumber(): Promise<string> {
    return this.installmentPaymentsService.generateReceiptNumber();
  }

  @Get('plan/:planId')
  findByInstallmentPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<InstallmentPayment[]> {
    return this.installmentPaymentsService.findByInstallmentPlan(planId);
  }

  @Get('plan/:planId/total')
  getTotalPaymentsForPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<number> {
    return this.installmentPaymentsService.getTotalPaymentsForPlan(planId);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<InstallmentPayment[]> {
    return this.installmentPaymentsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('daily-summary')
  getDailySummary(@Query('date') date: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    paymentCount: number;
  }> {
    return this.installmentPaymentsService.getDailySummary(
      new Date(date || Date.now()),
    );
  }

  @Get('receipt/:receiptNumber')
  findByReceiptNumber(
    @Param('receiptNumber') receiptNumber: string,
  ): Promise<InstallmentPayment> {
    return this.installmentPaymentsService.findByReceiptNumber(receiptNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InstallmentPayment> {
    return this.installmentPaymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstallmentPaymentDto: UpdateInstallmentPaymentDto,
  ): Promise<InstallmentPayment> {
    return this.installmentPaymentsService.update(id, updateInstallmentPaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.installmentPaymentsService.remove(id);
  }
}
