import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';

@Injectable()
export class SaleItemsService {
  constructor(
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
  ) {}

  async create(createSaleItemDto: CreateSaleItemDto): Promise<SaleItem> {
    const saleItem = this.saleItemRepository.create(createSaleItemDto);
    return this.saleItemRepository.save(saleItem);
  }

  async createBulk(items: CreateSaleItemDto[]): Promise<SaleItem[]> {
    const saleItems = items.map((item) => this.saleItemRepository.create(item));
    return this.saleItemRepository.save(saleItems);
  }

  async findAll(): Promise<SaleItem[]> {
    return this.saleItemRepository.find({
      relations: ['sale', 'jewelryItem'],
    });
  }

  async findOne(id: number): Promise<SaleItem> {
    const saleItem = await this.saleItemRepository.findOne({
      where: { id },
      relations: ['sale', 'jewelryItem'],
    });

    if (!saleItem) {
      throw new NotFoundException(`Sale item with ID ${id} not found`);
    }

    return saleItem;
  }

  async findBySale(saleId: number): Promise<SaleItem[]> {
    return this.saleItemRepository.find({
      where: { saleId },
      relations: ['sale', 'jewelryItem', 'jewelryItem.stoneType'],
    });
  }

  async findByJewelryItem(jewelryItemId: number): Promise<SaleItem[]> {
    return this.saleItemRepository.find({
      where: { jewelryItemId },
      relations: ['sale', 'jewelryItem'],
    });
  }

  async update(id: number, updateSaleItemDto: UpdateSaleItemDto): Promise<SaleItem> {
    const saleItem = await this.findOne(id);
    Object.assign(saleItem, updateSaleItemDto);
    return this.saleItemRepository.save(saleItem);
  }

  async remove(id: number): Promise<void> {
    const saleItem = await this.findOne(id);
    await this.saleItemRepository.remove(saleItem);
  }

  async removeBySale(saleId: number): Promise<void> {
    await this.saleItemRepository.delete({ saleId });
  }

  async getSaleSummary(saleId: number): Promise<{
    itemCount: number;
    subtotal: number;
    totalDiscount: number;
  }> {
    const items = await this.findBySale(saleId);

    return {
      itemCount: items.length,
      subtotal: items.reduce((sum, item) => sum + Number(item.lineTotal), 0),
      totalDiscount: items.reduce((sum, item) => sum + Number(item.discountAmount), 0),
    };
  }
}
