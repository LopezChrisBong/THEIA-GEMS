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
import { UserDetail } from 'src/entities';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { TransactionAction } from '../transaction-logs/entities/transaction-log.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  /** Attaches fname/lname from user_details onto each sale's cashier object. */
  private async withCashierNames(sales: Sale[]): Promise<Sale[]> {
    // Normalize to Number — MySQL bigint columns come back as strings from TypeORM
    const ids = [
      ...new Set(sales.map((s) => Number(s.cashierId)).filter((n) => n > 0)),
    ];
    if (!ids.length) return sales;

    const details = await this.userDetailRepository
      .createQueryBuilder('ud')
      .select(['ud.userID', 'ud.fname', 'ud.lname'])
      .where('ud.userID IN (:...ids)', { ids })
      .getMany();

    const map = new Map(details.map(d => [Number(d.userID), d]));
    for (const sale of sales) {
      if (sale.cashier && sale.cashierId) {
        const d = map.get(Number(sale.cashierId));
        if (d) {
          (sale.cashier as any).firstName = d.fname;
          (sale.cashier as any).lastName = d.lname;
        }
      }
    }
    return sales;
  }

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const existing = await this.saleRepository.findOne({
      where: { saleNumber: createSaleDto.saleNumber },
    });

    if (existing) {
      throw new ConflictException('Sale number already exists');
    }

    const sale = this.saleRepository.create(createSaleDto);
    const saved = await this.saleRepository.save(sale);
    this.transactionLogsService.log({
      transactionType: 'Sale Created',
      transactionId: saved.id,
      tableName: 'sales',
      action: TransactionAction.CREATE,
      performedBy: createSaleDto.cashierId,
      newValues: {
        saleNumber: saved.saleNumber,
        totalAmount: Number(saved.totalAmount),
        paymentStatus: saved.paymentStatus,
        saleType: saved.saleType,
        branchId: saved.branchId,
      },
    });
    return saved;
  }

  async findAll(): Promise<Sale[]> {
    const sales = await this.saleRepository.find({
      relations: ['branch', 'customer', 'cashier'],
      order: { saleDate: 'DESC' },
    });
    return this.withCashierNames(sales);
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['branch', 'customer', 'cashier'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    const [enriched] = await this.withCashierNames([sale]);
    return enriched;
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

  async getSalesReport(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
  ) {
    endDate.setHours(23, 59, 59, 999);

    const sales = await this.saleRepository.find({
      where: { saleDate: Between(startDate, endDate) },
      relations: ['branch', 'customer'],
      order: { saleDate: 'ASC' },
    });

    const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const summary = {
      totalOrders: sales.length,
      totalRevenue,
      totalDiscount: sales.reduce((s, r) => s + Number(r.discountAmount), 0),
      totalTax: sales.reduce((s, r) => s + Number(r.taxAmount), 0),
      avgOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      paidCount: sales.filter((s) => s.paymentStatus === PaymentStatus.PAID).length,
      partialCount: sales.filter((s) => s.paymentStatus === PaymentStatus.PARTIAL).length,
      layawayCount: sales.filter((s) => s.paymentStatus === PaymentStatus.LAYAWAY).length,
    };

    const groups: Record<string, { label: string; orders: number; revenue: number; discount: number }> = {};

    for (const sale of sales) {
      const d = new Date(sale.saleDate);
      let key: string;
      let label: string;

      if (period === 'daily') {
        key = d.toISOString().slice(0, 10);
        label = d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        const sow = new Date(d);
        sow.setDate(d.getDate() - d.getDay());
        key = sow.toISOString().slice(0, 10);
        const eow = new Date(sow);
        eow.setDate(sow.getDate() + 6);
        label = `${sow.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${eow.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' });
      }

      if (!groups[key]) groups[key] = { label, orders: 0, revenue: 0, discount: 0 };
      groups[key].orders += 1;
      groups[key].revenue += Number(sale.totalAmount);
      groups[key].discount += Number(sale.discountAmount);
    }

    const grouped = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return { summary, grouped, sales };
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
