import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JewelryType } from './entities/jewelry-type.entity';
import { CreateJewelryTypeDto } from './dto/create-jewelry-type.dto';
import { UpdateJewelryTypeDto } from './dto/update-jewelry-type.dto';

@Injectable()
export class JewelryTypesService {
  constructor(
    @InjectRepository(JewelryType)
    private readonly jewelryTypeRepository: Repository<JewelryType>,
  ) {}

  async create(createJewelryTypeDto: CreateJewelryTypeDto): Promise<JewelryType> {
    const jewelryType = this.jewelryTypeRepository.create(createJewelryTypeDto);
    return this.jewelryTypeRepository.save(jewelryType);
  }

  async findAll(): Promise<JewelryType[]> {
    return this.jewelryTypeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<JewelryType> {
    const jewelryType = await this.jewelryTypeRepository.findOne({
      where: { id },
    });
    if (!jewelryType) {
      throw new NotFoundException(`JewelryType with ID ${id} not found`);
    }
    return jewelryType;
  }

  async update(id: number, updateJewelryTypeDto: UpdateJewelryTypeDto): Promise<JewelryType> {
    const jewelryType = await this.findOne(id);
    Object.assign(jewelryType, updateJewelryTypeDto);
    return this.jewelryTypeRepository.save(jewelryType);
  }

  async remove(id: number): Promise<void> {
    const jewelryType = await this.findOne(id);
    await this.jewelryTypeRepository.remove(jewelryType);
  }
}
