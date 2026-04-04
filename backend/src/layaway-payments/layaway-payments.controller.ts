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
import { LayawayPaymentsService } from './layaway-payments.service';
import { CreateLayawayPaymentDto } from './dto/create-layaway-payment.dto';
import { UpdateLayawayPaymentDto } from './dto/update-layaway-payment.dto';
import { LayawayPayment } from './entities/layaway-payment.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Layaway Payments')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('layaway-payments')
export class LayawayPaymentsController {
  constructor(
    private readonly layawayPaymentsService: LayawayPaymentsService,
  ) {}

  @Post()
  create(
    @Body() createLayawayPaymentDto: CreateLayawayPaymentDto,
  ): Promise<LayawayPayment> {
    return this.layawayPaymentsService.create(createLayawayPaymentDto);
  }

  @Get()
  findAll(): Promise<LayawayPayment[]> {
    return this.layawayPaymentsService.findAll();
  }

  @Get('generate-receipt')
  generateReceiptNumber(): Promise<string> {
    return this.layawayPaymentsService.generateReceiptNumber();
  }

  @Get('plan/:planId')
  findByLayawayPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<LayawayPayment[]> {
    return this.layawayPaymentsService.findByLayawayPlan(planId);
  }

  @Get('plan/:planId/total')
  getTotalPaymentsForPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<number> {
    return this.layawayPaymentsService.getTotalPaymentsForPlan(planId);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<LayawayPayment[]> {
    return this.layawayPaymentsService.findByDateRange(
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
    return this.layawayPaymentsService.getDailySummary(
      new Date(date || Date.now()),
    );
  }

  @Get('receipt/:receiptNumber')
  findByReceiptNumber(
    @Param('receiptNumber') receiptNumber: string,
  ): Promise<LayawayPayment> {
    return this.layawayPaymentsService.findByReceiptNumber(receiptNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LayawayPayment> {
    return this.layawayPaymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLayawayPaymentDto: UpdateLayawayPaymentDto,
  ): Promise<LayawayPayment> {
    return this.layawayPaymentsService.update(id, updateLayawayPaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.layawayPaymentsService.remove(id);
  }
}
