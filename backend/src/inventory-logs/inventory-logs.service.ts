import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryLog, ActionType } from './entities/inventory-log.entity';
import { CreateInventoryLogDto } from './dto/create-inventory-log.dto';
import { UpdateInventoryLogDto } from './dto/update-inventory-log.dto';

@Injectable()
export class InventoryLogsService {
  constructor(
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepository: Repository<InventoryLog>,
  ) {}

  async create(
    createInventoryLogDto: CreateInventoryLogDto,
  ): Promise<InventoryLog> {
    const log = this.inventoryLogRepository.create(createInventoryLogDto);
    return this.inventoryLogRepository.save(log);
  }

  async findAll(): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      relations: ['jewelryItem', 'branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<InventoryLog> {
    const log = await this.inventoryLogRepository.findOne({
      where: { id },
      relations: ['jewelryItem', 'branch', 'performer'],
    });
    if (!log) {
      throw new NotFoundException(`Inventory log with ID ${id} not found`);
    }
    return log;
  }

  async findByJewelryItem(jewelryItemId: number): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: { jewelryItemId },
      relations: ['branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: { branchId },
      relations: ['jewelryItem', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByActionType(actionType: ActionType): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: { actionType },
      relations: ['jewelryItem', 'branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByReference(
    referenceType: string,
    referenceId: number,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: { referenceType, referenceId },
      relations: ['jewelryItem', 'branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['jewelryItem', 'branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPerformer(performedBy: number): Promise<InventoryLog[]> {
    return this.inventoryLogRepository.find({
      where: { performedBy },
      relations: ['jewelryItem', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async getItemHistory(
    jewelryItemId: number,
    branchId?: number,
  ): Promise<InventoryLog[]> {
    const where: any = { jewelryItemId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.inventoryLogRepository.find({
      where,
      relations: ['branch', 'performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSummaryByAction(
    branchId?: number,
  ): Promise<Record<string, { count: number }>> {
    const query = this.inventoryLogRepository
      .createQueryBuilder('log')
      .select('log.action_type', 'actionType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action_type');

    if (branchId) {
      query.where('log.branch_id = :branchId', { branchId });
    }

    const results = await query.getRawMany();

    const summary: Record<string, { count: number }> = {};
    for (const row of results) {
      summary[row.actionType] = {
        count: parseInt(row.count, 10),
      };
    }

    return summary;
  }

  async update(
    id: number,
    updateInventoryLogDto: UpdateInventoryLogDto,
  ): Promise<InventoryLog> {
    const log = await this.findOne(id);
    Object.assign(log, updateInventoryLogDto);
    return this.inventoryLogRepository.save(log);
  }

  async remove(id: number): Promise<void> {
    const log = await this.findOne(id);
    await this.inventoryLogRepository.remove(log);
  }
}
