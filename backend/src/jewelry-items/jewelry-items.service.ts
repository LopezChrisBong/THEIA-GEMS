import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JewelryItem } from './entities/jewelry-item.entity';
import { CreateJewelryItemDto } from './dto/create-jewelry-item.dto';
import { UpdateJewelryItemDto } from './dto/update-jewelry-item.dto';
import { BulkImportJewelryItemDto } from './dto/bulk-import-jewelry-item.dto';
import { UserDetail, Category, JewelryType, StoneType } from 'src/entities';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { TransactionAction } from '../transaction-logs/entities/transaction-log.entity';

@Injectable()
export class JewelryItemsService {
  constructor(
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(JewelryType)
    private readonly jewelryTypeRepository: Repository<JewelryType>,
    @InjectRepository(StoneType)
    private readonly stoneTypeRepository: Repository<StoneType>,
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  private async findOrCreateLookupId(
    repository: Repository<any>,
    nameColumn: string,
    rawName: string,
    cache: Map<string, number>,
  ): Promise<number> {
    const name = rawName.trim();
    if (cache.has(name)) return cache.get(name) as number;
    const existing = await repository.findOne({ where: { [nameColumn]: name } });
    if (existing) {
      cache.set(name, existing.id);
      return existing.id;
    }
    const created = await repository.save(repository.create({ [nameColumn]: name }));
    cache.set(name, created.id);
    return created.id;
  }

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
    const existing = await this.jewelryItemRepository.findOne({
      where: { itemCode: createJewelryItemDto.itemCode },
    });
    if (existing) {
      throw new ConflictException(
        `Item code "${createJewelryItemDto.itemCode}" already exists in this branch or any other branch.`,
      );
    }

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

  async findAll(branchId?: number, status?: string, categoryId?: number, supplierId?: number, jewelryTypeId?: number): Promise<JewelryItem[]> {
    const queryBuilder = this.jewelryItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.stoneType', 'stoneType')
      .leftJoinAndSelect('item.jewelryType', 'jewelryType')
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
      const statuses = status.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (statuses.length > 1) {
        queryBuilder.andWhere('item.status IN (:...statuses)', { statuses });
      } else {
        queryBuilder.andWhere('item.status = :status', { status: statuses[0] });
      }
    }

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (jewelryTypeId) {
      queryBuilder.andWhere('item.jewelryTypeId = :jewelryTypeId', { jewelryTypeId });
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
    // Loaded without relations on purpose: if a relation (e.g. jewelryType) is eagerly
    // attached here, TypeORM derives the FK column from that stale relation object on
    // save() and silently discards the new *Id value from the DTO.
    const jewelryItem = await this.jewelryItemRepository.findOne({ where: { id } });
    if (!jewelryItem) {
      throw new NotFoundException(`JewelryItem with ID ${id} not found`);
    }

    if (updateJewelryItemDto.itemCode && updateJewelryItemDto.itemCode !== jewelryItem.itemCode) {
      const existing = await this.jewelryItemRepository.findOne({
        where: { itemCode: updateJewelryItemDto.itemCode },
      });
      if (existing) {
        throw new ConflictException(
          `Item code "${updateJewelryItemDto.itemCode}" already exists in this branch or any other branch.`,
        );
      }
    }

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
    await this.jewelryItemRepository.save(jewelryItem);
    return this.findOne(id);
  }

  async bulkImport(items: BulkImportJewelryItemDto[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];
    const categoryCache = new Map<string, number>();
    const jewelryTypeCache = new Map<string, number>();
    const stoneTypeCache = new Map<string, number>();

    for (const item of items) {
      try {
        let categoryId = item.categoryId;
        if (!categoryId && item.categoryName) {
          categoryId = await this.findOrCreateLookupId(
            this.categoryRepository,
            'categoryName',
            item.categoryName,
            categoryCache,
          );
        }
        if (!categoryId) {
          errors.push(`Item "${item.itemCode}" skipped: no category provided`);
          continue;
        }

        let jewelryTypeId = item.jewelryTypeId || null;
        if (!jewelryTypeId && item.jewelryTypeName) {
          jewelryTypeId = await this.findOrCreateLookupId(
            this.jewelryTypeRepository,
            'name',
            item.jewelryTypeName,
            jewelryTypeCache,
          );
        }

        let stoneTypeId = item.stoneTypeId || null;
        if (!stoneTypeId && item.stoneTypeName) {
          stoneTypeId = await this.findOrCreateLookupId(
            this.stoneTypeRepository,
            'name',
            item.stoneTypeName,
            stoneTypeCache,
          );
        }

        // Skip if item code already exists
        const existing = await this.jewelryItemRepository.findOne({
          where: { itemCode: item.itemCode },
        });
        if (existing) {
          errors.push(`Item code "${item.itemCode}" already exists, skipped`);
          continue;
        }

        const jewelryItem = this.jewelryItemRepository.create({
          itemCode: item.itemCode,
          categoryId,
          name: item.name,
          color: item.color,
          material: item.material,
          stoneTypeId: stoneTypeId ?? undefined,
          jewelryTypeId: jewelryTypeId ?? undefined,
          goldType: item.goldType,
          carat: item.carat,
          karat: item.karat,
          size: item.size,
          bandWidth: item.bandWidth,
          price: item.price,
          status: item.status,
          branchId: item.branchId,
          barcode: item.barcode,
          description: item.description,
          addedBy: item.addedBy,
        });
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
