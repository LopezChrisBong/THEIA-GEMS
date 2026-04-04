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
import { StoneTypesService } from './stone-types.service';
import { CreateStoneTypeDto } from './dto/create-stone-type.dto';
import { UpdateStoneTypeDto } from './dto/update-stone-type.dto';
import { StoneType } from './entities/stone-type.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Stone Types')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('stone-types')
export class StoneTypesController {
  constructor(private readonly stoneTypesService: StoneTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStoneTypeDto: CreateStoneTypeDto): Promise<StoneType> {
    return this.stoneTypesService.create(createStoneTypeDto);
  }

  @Get()
  findAll(): Promise<StoneType[]> {
    return this.stoneTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StoneType> {
    return this.stoneTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoneTypeDto: UpdateStoneTypeDto,
  ): Promise<StoneType> {
    return this.stoneTypesService.update(id, updateStoneTypeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.stoneTypesService.remove(id);
  }
}
