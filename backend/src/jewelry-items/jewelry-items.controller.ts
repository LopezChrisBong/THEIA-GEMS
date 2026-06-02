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
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JewelryItemsService } from './jewelry-items.service';
import { CreateJewelryItemDto } from './dto/create-jewelry-item.dto';
import { UpdateJewelryItemDto } from './dto/update-jewelry-item.dto';
import { JewelryItem } from './entities/jewelry-item.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Jewelry Items')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('jewelry-items')
export class JewelryItemsController {
  constructor(private readonly jewelryItemsService: JewelryItemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createJewelryItemDto: CreateJewelryItemDto): Promise<JewelryItem> {
    return this.jewelryItemsService.create(createJewelryItemDto);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.CREATED)
  async bulkImport(@Body() items: CreateJewelryItemDto[]): Promise<{ imported: number; errors: string[] }> {
    return this.jewelryItemsService.bulkImport(items);
  }

  @Get()
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  findAll(
    @Query('branchId') branchId?: number,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: number,
    @Query('supplierId') supplierId?: number,
  ): Promise<JewelryItem[]> {
    return this.jewelryItemsService.findAll(branchId, status, categoryId, supplierId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JewelryItem> {
    return this.jewelryItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJewelryItemDto: UpdateJewelryItemDto,
  ): Promise<JewelryItem> {
    return this.jewelryItemsService.update(id, updateJewelryItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.jewelryItemsService.remove(id);
  }
}
