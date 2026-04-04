import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JewelryItem } from './entities/jewelry-item.entity';
import { CreateJewelryItemDto } from './dto/create-jewelry-item.dto';
import { UpdateJewelryItemDto } from './dto/update-jewelry-item.dto';

@Injectable()
export class JewelryItemsService {
  constructor(
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
  ) {}

  async create(createJewelryItemDto: CreateJewelryItemDto): Promise<JewelryItem> {
    if (createJewelryItemDto.parentItemId) {
      const parentItem = await this.jewelryItemRepository.findOne({
        where: { id: createJewelryItemDto.parentItemId },
      });
      if (!parentItem) {
        throw new BadRequestException(
          `Parent item with ID ${createJewelryItemDto.parentItemId} not found`,
        );
      }
    }

    const jewelryItem = this.jewelryItemRepository.create(createJewelryItemDto);
    return this.jewelryItemRepository.save(jewelryItem);
  }

  async findAll(branchId?: number, status?: string, categoryId?: number): Promise<JewelryItem[]> {
    const queryBuilder = this.jewelryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.stoneType', 'stoneType')
      .leftJoinAndSelect('item.jewelryType', 'jewelryType')
      .leftJoinAndSelect('item.designModel', 'designModel')
      .leftJoinAndSelect('item.branch', 'branch')
      .leftJoinAndSelect('item.supplier', 'supplier')
      .leftJoinAndSelect('item.parentItem', 'parentItem')
      .leftJoinAndSelect('item.children', 'children')
      .leftJoinAndSelect('item.images', 'images')
      .where('item.isActive = :isActive', { isActive: true });

    if (branchId) {
      queryBuilder.andWhere('item.branchId = :branchId', { branchId });
    }

    if (status) {
      queryBuilder.andWhere('item.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    queryBuilder.orderBy('item.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<JewelryItem> {
    const jewelryItem = await this.jewelryItemRepository.findOne({
      where: { id },
      relations: [
        'category',
        'stoneType',
        'jewelryType',
        'designModel',
        'branch',
        'supplier',
        'parentItem',
        'children',
        'images',
      ],
    });
    if (!jewelryItem) {
      throw new NotFoundException(`JewelryItem with ID ${id} not found`);
    }
    return jewelryItem;
  }

  async update(id: number, updateJewelryItemDto: UpdateJewelryItemDto): Promise<JewelryItem> {
    const jewelryItem = await this.findOne(id);

    if (updateJewelryItemDto.parentItemId) {
      if (updateJewelryItemDto.parentItemId === id) {
        throw new BadRequestException('An item cannot be its own parent');
      }
      const parentItem = await this.jewelryItemRepository.findOne({
        where: { id: updateJewelryItemDto.parentItemId },
      });
      if (!parentItem) {
        throw new BadRequestException(
          `Parent item with ID ${updateJewelryItemDto.parentItemId} not found`,
        );
      }
    }

    Object.assign(jewelryItem, updateJewelryItemDto);
    return this.jewelryItemRepository.save(jewelryItem);
  }

  async bulkImport(items: CreateJewelryItemDto[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Skip if item code already exists
        const existing = await this.jewelryItemRepository.findOne({
          where: { itemCode: item.itemCode },
        });
        if (existing) {
          errors.push(`Item code "${item.itemCode}" already exists, skipped`);
          continue;
        }
        const jewelryItem = this.jewelryItemRepository.create(item);
        await this.jewelryItemRepository.save(jewelryItem);
        imported++;
      } catch (error) {
        errors.push(`Failed to import "${item.itemCode}": ${error.message}`);
      }
    }

    return { imported, errors };
  }

  async remove(id: number): Promise<void> {
    const jewelryItem = await this.findOne(id);
    jewelryItem.isActive = false;
    await this.jewelryItemRepository.save(jewelryItem);
  }
}
