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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentMethod, PaymentType } from './entities/payment.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll(): Promise<Payment[]> {
    return this.paymentsService.findAll();
  }

  @Get('generate-number')
  generatePaymentNumber(): Promise<string> {
    return this.paymentsService.generatePaymentNumber();
  }

  @Get('sale/:saleId')
  findBySale(
    @Param('saleId', ParseIntPipe) saleId: number,
  ): Promise<Payment[]> {
    return this.paymentsService.findBySale(saleId);
  }

  @Get('sale/:saleId/total')
  getSaleTotalPayments(
    @Param('saleId', ParseIntPipe) saleId: number,
  ): Promise<number> {
    return this.paymentsService.getSaleTotalPayments(saleId);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Payment[]> {
    return this.paymentsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('method/:method')
  findByPaymentMethod(
    @Param('method') method: PaymentMethod,
  ): Promise<Payment[]> {
    return this.paymentsService.findByPaymentMethod(method);
  }

  @Get('type/:type')
  findByPaymentType(@Param('type') type: PaymentType): Promise<Payment[]> {
    return this.paymentsService.findByPaymentType(type);
  }

  @Get('daily-summary')
  getDailySummary(@Query('date') date: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    byMethod: Record<string, { count: number; amount: number }>;
  }> {
    return this.paymentsService.getDailySummary(new Date(date || Date.now()));
  }

  @Get('number/:paymentNumber')
  findByPaymentNumber(
    @Param('paymentNumber') paymentNumber: string,
  ): Promise<Payment> {
    return this.paymentsService.findByPaymentNumber(paymentNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Payment> {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.paymentsService.remove(id);
  }
}
