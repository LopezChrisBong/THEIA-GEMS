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
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale, PaymentStatus, SaleType } from './entities/sale.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto): Promise<Sale> {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll(): Promise<Sale[]> {
    return this.salesService.findAll();
  }

  @Get('generate-number')
  generateSaleNumber(): Promise<string> {
    return this.salesService.generateSaleNumber();
  }

  @Get('branch/:branchId')
  findByBranch(@Param('branchId', ParseIntPipe) branchId: number): Promise<Sale[]> {
    return this.salesService.findByBranch(branchId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number): Promise<Sale[]> {
    return this.salesService.findByCustomer(customerId);
  }

  @Get('payment-status/:status')
  findByPaymentStatus(@Param('status') status: PaymentStatus): Promise<Sale[]> {
    return this.salesService.findByPaymentStatus(status);
  }

  @Get('sale-type/:type')
  findBySaleType(@Param('type') type: SaleType): Promise<Sale[]> {
    return this.salesService.findBySaleType(type);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Sale[]> {
    return this.salesService.findByDateRange(new Date(startDate), new Date(endDate));
  }

  @Get('report')
  getSalesReport(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesService.getSalesReport(
      period,
      new Date(startDate),
      new Date(endDate),
      branchId ? Number(branchId) : undefined,
    );
  }

  @Get('daily-summary')
  getDailySummary(
    @Query('date') date: string,
    @Query('branchId') branchId?: number,
  ): Promise<{
    totalSales: number;
    totalAmount: number;
    totalDiscount: number;
    saleCount: number;
  }> {
    return this.salesService.getDailySummary(new Date(date), branchId);
  }

  @Get('number/:saleNumber')
  findBySaleNumber(@Param('saleNumber') saleNumber: string): Promise<Sale> {
    return this.salesService.findBySaleNumber(saleNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Sale> {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
  ): Promise<Sale> {
    return this.salesService.update(id, updateSaleDto);
  }

  @Patch(':id/payment-status')
  updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PaymentStatus,
  ): Promise<Sale> {
    return this.salesService.updatePaymentStatus(id, status);
  }

  @Patch(':id/record-payment')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ): Promise<Sale> {
    return this.salesService.recordPayment(id, amount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.salesService.remove(id);
  }
}
