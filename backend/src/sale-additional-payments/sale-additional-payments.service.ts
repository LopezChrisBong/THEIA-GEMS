import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleAdditionalPayment } from './entities/sale-additional-payment.entity';
import { CreateSaleAdditionalPaymentDto } from './dto/create-sale-additional-payment.dto';
import { UpdateSaleAdditionalPaymentDto } from './dto/update-sale-additional-payment.dto';

@Injectable()
export class SaleAdditionalPaymentsService {
  constructor(
    @InjectRepository(SaleAdditionalPayment)
    private readonly repo: Repository<SaleAdditionalPayment>,
  ) {}

  async create(dto: CreateSaleAdditionalPaymentDto): Promise<SaleAdditionalPayment> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async createBulk(items: CreateSaleAdditionalPaymentDto[]): Promise<SaleAdditionalPayment[]> {
    const entities = items.map((item) => this.repo.create(item));
    return this.repo.save(entities);
  }

  async findAll(): Promise<SaleAdditionalPayment[]> {
    return this.repo.find({ relations: ['sale'] });
  }

  async findOne(id: number): Promise<SaleAdditionalPayment> {
    const item = await this.repo.findOne({ where: { id }, relations: ['sale'] });
    if (!item) {
      throw new NotFoundException(`Additional payment with ID ${id} not found`);
    }
    return item;
  }

  async findBySale(saleId: number): Promise<SaleAdditionalPayment[]> {
    return this.repo.find({ where: { saleId } });
  }

  async update(id: number, dto: UpdateSaleAdditionalPaymentDto): Promise<SaleAdditionalPayment> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  async removeBySale(saleId: number): Promise<void> {
    await this.repo.delete({ saleId });
  }
}
