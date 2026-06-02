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
import { UserDetail } from 'src/entities';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { TransactionAction } from '../transaction-logs/entities/transaction-log.entity';

@Injectable()
export class JewelryItemsService {
  constructor(
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  private async attachAddedByNames(items: JewelryItem[]): Promise<JewelryItem[]> {
    const ids = [...new Set(items.map((i) => Number(i.addedBy)).filter((n) => n > 0))];
    if (!ids.length) return items;
    const details = await this.userDetailRepository
      .createQueryBuilder('ud')
      .select(['ud.userID', 'ud.fname', 'ud.lname'])
      .where('ud.userID IN (:...ids)', { ids })
      .getMany();
    const map = new Map(details.map((d) => [Number(d.userID), d]));
    for (const item of items) {
      if (item.addedBy) {
        const d = map.get(Number(item.addedBy));
        if (d) {
          (item as any).addedByName = `${d.fname} ${d.lname}`.trim();
        }
      }
    }
    return items;
  }

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
    const saved = await this.jewelryItemRepository.save(jewelryItem);
    if (createJewelryItemDto.addedBy) {
      this.transactionLogsService.log({
        transactionType: 'Item Added',
        transactionId: saved.id,
        tableName: 'jewelry_items',
        action: TransactionAction.CREATE,
        performedBy: createJewelryItemDto.addedBy,
        newValues: { itemCode: saved.itemCode, branchId: saved.branchId, status: saved.status },
      });
    }
    return saved;
  }

  async findAll(branchId?: number, status?: string, categoryId?: number, supplierId?: number): Promise<JewelryItem[]> {
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

    if (supplierId) {
      queryBuilder.andWhere('item.supplierId = :supplierId', { supplierId });
    }

    queryBuilder.orderBy('item.createdAt', 'DESC');

    const items = await queryBuilder.getMany();
    return this.attachAddedByNames(items);
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
    const [enriched] = await this.attachAddedByNames([jewelryItem]);
    return enriched;
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
