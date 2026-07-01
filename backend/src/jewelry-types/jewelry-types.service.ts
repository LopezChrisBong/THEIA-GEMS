import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JewelryType } from './entities/jewelry-type.entity';
import { CreateJewelryTypeDto } from './dto/create-jewelry-type.dto';
import { UpdateJewelryTypeDto } from './dto/update-jewelry-type.dto';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';

@Injectable()
export class JewelryTypesService {
  constructor(
    @InjectRepository(JewelryType)
    private readonly jewelryTypeRepository: Repository<JewelryType>,
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
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

    const itemCount = await this.jewelryItemRepository.count({ where: { jewelryTypeId: id } });
    if (itemCount > 0) {
      throw new ConflictException(
        `Cannot delete "${jewelryType.name}" — it is still used by ${itemCount} item(s). Reassign or remove those items first.`,
      );
    }

    await this.jewelryTypeRepository.remove(jewelryType);
  }
}
