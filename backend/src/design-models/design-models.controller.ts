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
import { DesignModelsService } from './design-models.service';
import { CreateDesignModelDto } from './dto/create-design-model.dto';
import { UpdateDesignModelDto } from './dto/update-design-model.dto';
import { DesignModel } from './entities/design-model.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Design Models')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('design-models')
export class DesignModelsController {
  constructor(private readonly designModelsService: DesignModelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDesignModelDto: CreateDesignModelDto): Promise<DesignModel> {
    return this.designModelsService.create(createDesignModelDto);
  }

  @Get()
  findAll(): Promise<DesignModel[]> {
    return this.designModelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DesignModel> {
    return this.designModelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDesignModelDto: UpdateDesignModelDto,
  ): Promise<DesignModel> {
    return this.designModelsService.update(id, updateDesignModelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.designModelsService.remove(id);
  }
}
