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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SaleAdditionalPaymentsService } from './sale-additional-payments.service';
import { CreateSaleAdditionalPaymentDto } from './dto/create-sale-additional-payment.dto';
import { UpdateSaleAdditionalPaymentDto } from './dto/update-sale-additional-payment.dto';
import { SaleAdditionalPayment } from './entities/sale-additional-payment.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Sale Additional Payments')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('sale-additional-payments')
export class SaleAdditionalPaymentsController {
  constructor(private readonly service: SaleAdditionalPaymentsService) {}

  @Post()
  create(@Body() dto: CreateSaleAdditionalPaymentDto): Promise<SaleAdditionalPayment> {
    return this.service.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() items: CreateSaleAdditionalPaymentDto[]): Promise<SaleAdditionalPayment[]> {
    return this.service.createBulk(items);
  }

  @Get()
  findAll(): Promise<SaleAdditionalPayment[]> {
    return this.service.findAll();
  }

  @Get('sale/:saleId')
  findBySale(@Param('saleId', ParseIntPipe) saleId: number): Promise<SaleAdditionalPayment[]> {
    return this.service.findBySale(saleId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SaleAdditionalPayment> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaleAdditionalPaymentDto,
  ): Promise<SaleAdditionalPayment> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
