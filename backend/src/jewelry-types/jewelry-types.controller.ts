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
import { JewelryTypesService } from './jewelry-types.service';
import { CreateJewelryTypeDto } from './dto/create-jewelry-type.dto';
import { UpdateJewelryTypeDto } from './dto/update-jewelry-type.dto';
import { JewelryType } from './entities/jewelry-type.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Jewelry Types')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('jewelry-types')
export class JewelryTypesController {
  constructor(private readonly jewelryTypesService: JewelryTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createJewelryTypeDto: CreateJewelryTypeDto): Promise<JewelryType> {
    return this.jewelryTypesService.create(createJewelryTypeDto);
  }

  @Get()
  findAll(): Promise<JewelryType[]> {
    return this.jewelryTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JewelryType> {
    return this.jewelryTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJewelryTypeDto: UpdateJewelryTypeDto,
  ): Promise<JewelryType> {
    return this.jewelryTypesService.update(id, updateJewelryTypeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.jewelryTypesService.remove(id);
  }
}
