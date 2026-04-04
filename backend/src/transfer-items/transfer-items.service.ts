import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferItem } from './entities/transfer-item.entity';
import { CreateTransferItemDto } from './dto/create-transfer-item.dto';
import { UpdateTransferItemDto } from './dto/update-transfer-item.dto';

@Injectable()
export class TransferItemsService {
  constructor(
    @InjectRepository(TransferItem)
    private readonly transferItemRepository: Repository<TransferItem>,
  ) {}

  async create(createTransferItemDto: CreateTransferItemDto): Promise<TransferItem> {
    const transferItem = this.transferItemRepository.create(createTransferItemDto);
    return this.transferItemRepository.save(transferItem);
  }

  async createBulk(items: CreateTransferItemDto[]): Promise<TransferItem[]> {
    const transferItems = this.transferItemRepository.create(items);
    return this.transferItemRepository.save(transferItems);
  }

  async findAll(): Promise<TransferItem[]> {
    return this.transferItemRepository.find({
      relations: ['transfer', 'jewelryItem'],
    });
  }

  async findOne(id: number): Promise<TransferItem> {
    const transferItem = await this.transferItemRepository.findOne({
      where: { id },
      relations: ['transfer', 'jewelryItem'],
    });

    if (!transferItem) {
      throw new NotFoundException(`Transfer item with ID ${id} not found`);
    }

    return transferItem;
  }

  async findByTransfer(transferId: number): Promise<TransferItem[]> {
    return this.transferItemRepository.find({
      where: { transferId },
      relations: ['transfer', 'jewelryItem'],
    });
  }

  async findByJewelryItem(jewelryItemId: number): Promise<TransferItem[]> {
    return this.transferItemRepository.find({
      where: { jewelryItemId },
      relations: ['transfer', 'jewelryItem'],
    });
  }

  async update(id: number, updateTransferItemDto: UpdateTransferItemDto): Promise<TransferItem> {
    const transferItem = await this.findOne(id);
    Object.assign(transferItem, updateTransferItemDto);
    return this.transferItemRepository.save(transferItem);
  }

  async remove(id: number): Promise<void> {
    const transferItem = await this.findOne(id);
    await this.transferItemRepository.remove(transferItem);
  }

  async removeByTransfer(transferId: number): Promise<void> {
    await this.transferItemRepository.delete({ transferId });
  }

  async getTransferSummary(transferId: number): Promise<{
    totalItems: number;
  }> {
    const items = await this.findByTransfer(transferId);
    return { totalItems: items.length };
  }
}
