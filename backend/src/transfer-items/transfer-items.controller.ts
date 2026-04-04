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
import { TransferItemsService } from './transfer-items.service';
import { CreateTransferItemDto } from './dto/create-transfer-item.dto';
import { UpdateTransferItemDto } from './dto/update-transfer-item.dto';
import { TransferItem } from './entities/transfer-item.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Transfer Items')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('transfer-items')
export class TransferItemsController {
  constructor(private readonly transferItemsService: TransferItemsService) {}

  @Post()
  create(@Body() createTransferItemDto: CreateTransferItemDto): Promise<TransferItem> {
    return this.transferItemsService.create(createTransferItemDto);
  }

  @Post('bulk')
  createBulk(@Body() items: CreateTransferItemDto[]): Promise<TransferItem[]> {
    return this.transferItemsService.createBulk(items);
  }

  @Get()
  findAll(): Promise<TransferItem[]> {
    return this.transferItemsService.findAll();
  }

  @Get('transfer/:transferId')
  findByTransfer(@Param('transferId', ParseIntPipe) transferId: number): Promise<TransferItem[]> {
    return this.transferItemsService.findByTransfer(transferId);
  }

  @Get('transfer/:transferId/summary')
  getTransferSummary(@Param('transferId', ParseIntPipe) transferId: number): Promise<{
    totalItems: number;
  }> {
    return this.transferItemsService.getTransferSummary(transferId);
  }

  @Get('jewelry-item/:jewelryItemId')
  findByJewelryItem(@Param('jewelryItemId', ParseIntPipe) jewelryItemId: number): Promise<TransferItem[]> {
    return this.transferItemsService.findByJewelryItem(jewelryItemId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TransferItem> {
    return this.transferItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransferItemDto: UpdateTransferItemDto,
  ): Promise<TransferItem> {
    return this.transferItemsService.update(id, updateTransferItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.transferItemsService.remove(id);
  }
}
