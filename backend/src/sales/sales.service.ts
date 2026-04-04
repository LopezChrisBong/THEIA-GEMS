import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, PaymentStatus, SaleType } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const existing = await this.saleRepository.findOne({
      where: { saleNumber: createSaleDto.saleNumber },
    });

    if (existing) {
      throw new ConflictException('Sale number already exists');
    }

    const sale = this.saleRepository.create(createSaleDto);
    return this.saleRepository.save(sale);
  }

  async findAll(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['branch', 'customer', 'cashier'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async findBySaleNumber(saleNumber: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { saleNumber },
      relations: ['branch', 'customer', 'cashier'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleNumber} not found`);
    }

    return sale;
  }

  async findByBranch(branchId: number): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { branchId },
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async findByCustomer(customerId: number): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { customerId },
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { saleDate: Between(startDate, endDate) },
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async findByPaymentStatus(status: PaymentStatus): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { paymentStatus: status },
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async findBySaleType(type: SaleType): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { saleType: type },
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
  }

  async update(id: number, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    const sale = await this.findOne(id);

    if (updateSaleDto.saleNumber && updateSaleDto.saleNumber !== sale.saleNumber) {
      const existing = await this.saleRepository.findOne({
        where: { saleNumber: updateSaleDto.saleNumber },
      });

      if (existing) {
        throw new ConflictException('Sale number already exists');
      }
    }

    Object.assign(sale, updateSaleDto);
    return this.saleRepository.save(sale);
  }

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Sale> {
    const sale = await this.findOne(id);
    sale.paymentStatus = status;
    return this.saleRepository.save(sale);
  }

  async recordPayment(id: number, amount: number): Promise<Sale> {
    const sale = await this.findOne(id);
    sale.amountPaid = Number(sale.amountPaid) + amount;

    if (sale.amountPaid >= sale.totalAmount) {
      sale.paymentStatus = PaymentStatus.PAID;
      sale.changeAmount = sale.amountPaid - sale.totalAmount;
    } else {
      sale.paymentStatus = PaymentStatus.PARTIAL;
    }

    return this.saleRepository.save(sale);
  }

  async remove(id: number): Promise<void> {
    const sale = await this.findOne(id);
    await this.saleRepository.remove(sale);
  }

  async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastSale = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.saleNumber LIKE :pattern', { pattern: `SL-${dateStr}%` })
      .orderBy('sale.id', 'DESC')
      .getOne();

    if (!lastSale) {
      return `SL-${dateStr}-0001`;
    }

    const lastNumber = parseInt(lastSale.saleNumber.split('-')[2] || '0', 10);
    const newNumber = lastNumber + 1;
    return `SL-${dateStr}-${newNumber.toString().padStart(4, '0')}`;
  }

  async getDailySummary(date: Date, branchId?: number): Promise<{
    totalSales: number;
    totalAmount: number;
    totalDiscount: number;
    saleCount: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = this.saleRepository
      .createQueryBuilder('sale')
      .select('COUNT(*)', 'saleCount')
      .addSelect('SUM(sale.totalAmount)', 'totalAmount')
      .addSelect('SUM(sale.discountAmount)', 'totalDiscount')
      .where('sale.saleDate BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      });

    if (branchId) {
      query.andWhere('sale.branchId = :branchId', { branchId });
    }

    const result = await query.getRawOne();

    return {
      totalSales: parseInt(result.saleCount, 10) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalDiscount: parseFloat(result.totalDiscount) || 0,
      saleCount: parseInt(result.saleCount, 10) || 0,
    };
  }
}
