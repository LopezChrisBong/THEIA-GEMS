import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JewelryItemImage } from './entities/jewelry-item-image.entity';
import { CreateJewelryItemImageDto } from './dto/create-jewelry-item-image.dto';
import { UpdateJewelryItemImageDto } from './dto/update-jewelry-item-image.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JewelryItemImagesService {
  constructor(
    @InjectRepository(JewelryItemImage)
    private readonly jewelryItemImageRepository: Repository<JewelryItemImage>,
  ) {}

  async create(createDto: CreateJewelryItemImageDto): Promise<JewelryItemImage> {
    const image = this.jewelryItemImageRepository.create(createDto);
    return this.jewelryItemImageRepository.save(image);
  }

  async createFromFiles(
    jewelryItemId: number,
    files: Express.Multer.File[],
  ): Promise<JewelryItemImage[]> {
    const existingCount = await this.jewelryItemImageRepository.count({
      where: { jewelryItemId },
    });

    const images = files.map((file, index) => {
      return this.jewelryItemImageRepository.create({
        jewelryItemId,
        imagePath: file.filename,
        isPrimary: existingCount === 0 && index === 0,
        sortOrder: existingCount + index,
      });
    });

    return this.jewelryItemImageRepository.save(images);
  }

  async findAllByItem(jewelryItemId: number): Promise<JewelryItemImage[]> {
    return this.jewelryItemImageRepository.find({
      where: { jewelryItemId },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<JewelryItemImage> {
    const image = await this.jewelryItemImageRepository.findOne({
      where: { id },
    });
    if (!image) {
      throw new NotFoundException(`JewelryItemImage with ID ${id} not found`);
    }
    return image;
  }

  async update(id: number, updateDto: UpdateJewelryItemImageDto): Promise<JewelryItemImage> {
    const image = await this.findOne(id);
    Object.assign(image, updateDto);
    return this.jewelryItemImageRepository.save(image);
  }

  async remove(id: number): Promise<void> {
    const image = await this.findOne(id);

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'jewelry-items', image.imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.jewelryItemImageRepository.remove(image);
  }
}
