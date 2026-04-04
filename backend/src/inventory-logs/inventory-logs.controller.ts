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
import { InventoryLogsService } from './inventory-logs.service';
import { CreateInventoryLogDto } from './dto/create-inventory-log.dto';
import { UpdateInventoryLogDto } from './dto/update-inventory-log.dto';
import { InventoryLog, ActionType } from './entities/inventory-log.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Inventory Logs')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('inventory-logs')
export class InventoryLogsController {
  constructor(private readonly inventoryLogsService: InventoryLogsService) {}

  @Post()
  create(
    @Body() createInventoryLogDto: CreateInventoryLogDto,
  ): Promise<InventoryLog> {
    return this.inventoryLogsService.create(createInventoryLogDto);
  }

  @Get()
  findAll(): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findAll();
  }

  @Get('summary')
  getSummaryByAction(
    @Query('branchId') branchId?: string,
  ): Promise<Record<string, { count: number }>> {
    return this.inventoryLogsService.getSummaryByAction(
      branchId ? parseInt(branchId, 10) : undefined,
    );
  }

  @Get('jewelry-item/:jewelryItemId')
  findByJewelryItem(
    @Param('jewelryItemId', ParseIntPipe) jewelryItemId: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByJewelryItem(jewelryItemId);
  }

  @Get('jewelry-item/:jewelryItemId/history')
  getItemHistory(
    @Param('jewelryItemId', ParseIntPipe) jewelryItemId: number,
    @Query('branchId') branchId?: string,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.getItemHistory(
      jewelryItemId,
      branchId ? parseInt(branchId, 10) : undefined,
    );
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByBranch(branchId);
  }

  @Get('action/:actionType')
  findByActionType(
    @Param('actionType') actionType: ActionType,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByActionType(actionType);
  }

  @Get('reference/:referenceType/:referenceId')
  findByReference(
    @Param('referenceType') referenceType: string,
    @Param('referenceId', ParseIntPipe) referenceId: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByReference(referenceType, referenceId);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('performer/:performedBy')
  findByPerformer(
    @Param('performedBy', ParseIntPipe) performedBy: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogsService.findByPerformer(performedBy);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryLog> {
    return this.inventoryLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryLogDto: UpdateInventoryLogDto,
  ): Promise<InventoryLog> {
    return this.inventoryLogsService.update(id, updateInventoryLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.inventoryLogsService.remove(id);
  }
}
