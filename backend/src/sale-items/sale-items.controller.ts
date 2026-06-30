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
import { SaleItemsService } from './sale-items.service';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';
import { SaleItem } from './entities/sale-item.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Sale Items')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('sale-items')
export class SaleItemsController {
  constructor(private readonly saleItemsService: SaleItemsService) {}

  @Post()
  create(@Body() createSaleItemDto: CreateSaleItemDto): Promise<SaleItem> {
    return this.saleItemsService.create(createSaleItemDto);
  }

  @Post('bulk')
  createBulk(@Body() items: CreateSaleItemDto[]): Promise<SaleItem[]> {
    return this.saleItemsService.createBulk(items);
  }

  @Get()
  findAll(): Promise<SaleItem[]> {
    return this.saleItemsService.findAll();
  }

  @Get('sale/:saleId')
  findBySale(@Param('saleId', ParseIntPipe) saleId: number): Promise<SaleItem[]> {
    return this.saleItemsService.findBySale(saleId);
  }

  @Get('sale/:saleId/summary')
  getSaleSummary(@Param('saleId', ParseIntPipe) saleId: number): Promise<{
    itemCount: number;
    subtotal: number;
    totalDiscount: number;
  }> {
    return this.saleItemsService.getSaleSummary(saleId);
  }

  @Get('jewelry-item/:jewelryItemId')
  findByJewelryItem(@Param('jewelryItemId', ParseIntPipe) jewelryItemId: number): Promise<SaleItem[]> {
    return this.saleItemsService.findByJewelryItem(jewelryItemId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SaleItem> {
    return this.saleItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleItemDto: UpdateSaleItemDto,
  ): Promise<SaleItem> {
    return this.saleItemsService.update(id, updateSaleItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.saleItemsService.remove(id);
  }
}
