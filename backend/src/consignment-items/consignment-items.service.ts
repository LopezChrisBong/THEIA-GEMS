import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentItem, ConsignmentStatus } from './entities/consignment-item.entity';
import { CreateConsignmentItemDto } from './dto/create-consignment-item.dto';
import { UpdateConsignmentItemDto } from './dto/update-consignment-item.dto';

@Injectable()
export class ConsignmentItemsService {
  constructor(
    @InjectRepository(ConsignmentItem)
    private readonly consignmentItemRepository: Repository<ConsignmentItem>,
  ) {}

  async create(createConsignmentItemDto: CreateConsignmentItemDto): Promise<ConsignmentItem> {
    const consignmentItem = this.consignmentItemRepository.create(createConsignmentItemDto);
    return this.consignmentItemRepository.save(consignmentItem);
  }

  async findAll(): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ConsignmentItem> {
    const consignmentItem = await this.consignmentItemRepository.findOne({
      where: { id },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
    });

    if (!consignmentItem) {
      throw new NotFoundException(`Consignment item with ID ${id} not found`);
    }

    return consignmentItem;
  }

  async findByStatus(status: ConsignmentStatus): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      where: { status },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      where: { branchId },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByConsignor(consignorName: string): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.jewelryItem', 'jewelryItem')
      .leftJoinAndSelect('consignment.branch', 'branch')
      .where('consignment.consignorName LIKE :name', { name: `%${consignorName}%` })
      .orderBy('consignment.createdAt', 'DESC')
      .getMany();
  }

  async findActive(): Promise<ConsignmentItem[]> {
    return this.findByStatus(ConsignmentStatus.ACTIVE);
  }

  async update(id: number, updateConsignmentItemDto: UpdateConsignmentItemDto): Promise<ConsignmentItem> {
    const consignmentItem = await this.findOne(id);
    Object.assign(consignmentItem, updateConsignmentItemDto);
    return this.consignmentItemRepository.save(consignmentItem);
  }

  async updateStatus(id: number, status: ConsignmentStatus): Promise<ConsignmentItem> {
    const consignmentItem = await this.findOne(id);
    consignmentItem.status = status;
    return this.consignmentItemRepository.save(consignmentItem);
  }

  async markAsSold(id: number): Promise<ConsignmentItem> {
    return this.updateStatus(id, ConsignmentStatus.SOLD);
  }

  async markAsReturned(id: number): Promise<ConsignmentItem> {
    return this.updateStatus(id, ConsignmentStatus.RETURNED);
  }

  async remove(id: number): Promise<void> {
    const consignmentItem = await this.findOne(id);
    await this.consignmentItemRepository.remove(consignmentItem);
  }

  async calculateCommission(id: number): Promise<{ commission: number; netToConsignor: number }> {
    const item = await this.findOne(id);
    const commission = item.commissionRate
      ? (item.sellingPrice * item.commissionRate) / 100
      : 0;
    const netToConsignor = item.sellingPrice - commission;
    return { commission, netToConsignor };
  }
}
