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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JewelryItemImagesService } from './jewelry-item-images.service';
import { UpdateJewelryItemImageDto } from './dto/update-jewelry-item-image.dto';
import { JewelryItemImage } from './entities/jewelry-item-image.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';
import { Helper } from 'src/shared/helper';

@ApiTags('Jewelry Item Images')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('jewelry-item-images')
export class JewelryItemImagesController {
  constructor(private readonly jewelryItemImagesService: JewelryItemImagesService) {}

  @Post('upload/:jewelryItemId')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: Helper.jewelryItemImagePath,
        filename: Helper.customFileName,
      }),
    }),
  )
  async uploadImages(
    @Param('jewelryItemId', ParseIntPipe) jewelryItemId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<JewelryItemImage[]> {
    return this.jewelryItemImagesService.createFromFiles(jewelryItemId, files);
  }

  @Get('item/:jewelryItemId')
  findAllByItem(
    @Param('jewelryItemId', ParseIntPipe) jewelryItemId: number,
  ): Promise<JewelryItemImage[]> {
    return this.jewelryItemImagesService.findAllByItem(jewelryItemId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JewelryItemImage> {
    return this.jewelryItemImagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateJewelryItemImageDto,
  ): Promise<JewelryItemImage> {
    return this.jewelryItemImagesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.jewelryItemImagesService.remove(id);
  }
}
