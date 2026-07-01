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
import { ConsignmentItemsService } from './consignment-items.service';
import { CreateConsignmentItemDto } from './dto/create-consignment-item.dto';
import { UpdateConsignmentItemDto } from './dto/update-consignment-item.dto';
import { ConsignmentItem, ConsignmentStatus } from './entities/consignment-item.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Consignment Items')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('consignment-items')
export class ConsignmentItemsController {
  constructor(private readonly consignmentItemsService: ConsignmentItemsService) {}

  @Post()
  create(@Body() createConsignmentItemDto: CreateConsignmentItemDto): Promise<ConsignmentItem> {
    return this.consignmentItemsService.create(createConsignmentItemDto);
  }

  @Get()
  findAll(): Promise<ConsignmentItem[]> {
    return this.consignmentItemsService.findAll();
  }

  @Get('active')
  findActive(): Promise<ConsignmentItem[]> {
    return this.consignmentItemsService.findActive();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: ConsignmentStatus): Promise<ConsignmentItem[]> {
    return this.consignmentItemsService.findByStatus(status);
  }

  @Get('branch/:branchId')
  findByBranch(@Param('branchId', ParseIntPipe) branchId: number): Promise<ConsignmentItem[]> {
    return this.consignmentItemsService.findByBranch(branchId);
  }

  @Get('consignor')
  findByConsignor(@Query('name') name: string): Promise<ConsignmentItem[]> {
    return this.consignmentItemsService.findByConsignor(name);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ConsignmentItem> {
    return this.consignmentItemsService.findOne(id);
  }

  @Get(':id/commission')
  calculateCommission(@Param('id', ParseIntPipe) id: number): Promise<{ commission: number; netToConsignor: number }> {
    return this.consignmentItemsService.calculateCommission(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsignmentItemDto: UpdateConsignmentItemDto,
  ): Promise<ConsignmentItem> {
    return this.consignmentItemsService.update(id, updateConsignmentItemDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ConsignmentStatus,
  ): Promise<ConsignmentItem> {
    return this.consignmentItemsService.updateStatus(id, status);
  }

  @Patch(':id/sold')
  markAsSold(@Param('id', ParseIntPipe) id: number): Promise<ConsignmentItem> {
    return this.consignmentItemsService.markAsSold(id);
  }

  @Patch(':id/returned')
  markAsReturned(@Param('id', ParseIntPipe) id: number): Promise<ConsignmentItem> {
    return this.consignmentItemsService.markAsReturned(id);
  }

  @Patch(':id/pullout')
  markAsPullout(@Param('id', ParseIntPipe) id: number): Promise<ConsignmentItem> {
    return this.consignmentItemsService.markAsReturned(id);
  }

  @Patch(':id/buyout')
  markAsBuyout(@Param('id', ParseIntPipe) id: number): Promise<ConsignmentItem> {
    return this.consignmentItemsService.markAsBuyout(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.consignmentItemsService.remove(id);
  }
}
