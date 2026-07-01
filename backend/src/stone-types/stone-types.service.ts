import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoneType } from './entities/stone-type.entity';
import { CreateStoneTypeDto } from './dto/create-stone-type.dto';
import { UpdateStoneTypeDto } from './dto/update-stone-type.dto';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';

@Injectable()
export class StoneTypesService {
  constructor(
    @InjectRepository(StoneType)
    private readonly stoneTypeRepository: Repository<StoneType>,
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
  ) {}

  async create(createStoneTypeDto: CreateStoneTypeDto): Promise<StoneType> {
    const stoneType = this.stoneTypeRepository.create(createStoneTypeDto);
    return this.stoneTypeRepository.save(stoneType);
  }

  async findAll(): Promise<StoneType[]> {
    return this.stoneTypeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<StoneType> {
    const stoneType = await this.stoneTypeRepository.findOne({
      where: { id },
    });
    if (!stoneType) {
      throw new NotFoundException(`StoneType with ID ${id} not found`);
    }
    return stoneType;
  }

  async update(id: number, updateStoneTypeDto: UpdateStoneTypeDto): Promise<StoneType> {
    const stoneType = await this.findOne(id);
    Object.assign(stoneType, updateStoneTypeDto);
    return this.stoneTypeRepository.save(stoneType);
  }

  async remove(id: number): Promise<void> {
    const stoneType = await this.findOne(id);

    const itemCount = await this.jewelryItemRepository.count({ where: { stoneTypeId: id } });
    if (itemCount > 0) {
      throw new ConflictException(
        `Cannot delete "${stoneType.name}" — it is still used by ${itemCount} item(s). Reassign or remove those items first.`,
      );
    }

    await this.stoneTypeRepository.remove(stoneType);
  }
}
