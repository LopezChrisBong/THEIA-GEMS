import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './entities/receipt.entity';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async create(createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    // Check if receipt already exists for this sale
    const existing = await this.receiptRepository.findOne({
      where: { saleId: createReceiptDto.saleId },
    });
    if (existing) {
      throw new ConflictException(
        `Receipt already exists for sale ID ${createReceiptDto.saleId}`,
      );
    }

    const receipt = this.receiptRepository.create({
      ...createReceiptDto,
      receiptNumber:
        createReceiptDto.receiptNumber || (await this.generateReceiptNumber()),
    });
    return this.receiptRepository.save(receipt);
  }

  async findAll(): Promise<Receipt[]> {
    return this.receiptRepository.find({
      relations: ['sale', 'branch', 'printer'],
      order: { printedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
      relations: ['sale', 'branch', 'printer'],
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return receipt;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { receiptNumber },
      relations: ['sale', 'branch', 'printer'],
    });
    if (!receipt) {
      throw new NotFoundException(
        `Receipt with number ${receiptNumber} not found`,
      );
    }
    return receipt;
  }

  async findBySale(saleId: number): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { saleId },
      relations: ['sale', 'branch', 'printer'],
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt for sale ID ${saleId} not found`);
    }
    return receipt;
  }

  async findByBranch(branchId: number): Promise<Receipt[]> {
    return this.receiptRepository.find({
      where: { branchId },
      relations: ['sale', 'printer'],
      order: { printedAt: 'DESC' },
    });
  }

  async print(id: number, printedBy: number): Promise<Receipt> {
    const receipt = await this.findOne(id);
    if (receipt.printedAt) {
      // This is a reprint
      receipt.reprintCount += 1;
    }
    receipt.printedAt = new Date();
    receipt.printedBy = printedBy;
    return this.receiptRepository.save(receipt);
  }

  async update(
    id: number,
    updateReceiptDto: UpdateReceiptDto,
  ): Promise<Receipt> {
    const receipt = await this.findOne(id);
    Object.assign(receipt, updateReceiptDto);
    return this.receiptRepository.save(receipt);
  }

  async remove(id: number): Promise<void> {
    const receipt = await this.findOne(id);
    await this.receiptRepository.remove(receipt);
  }

  async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RCP-${datePrefix}-`;

    const lastReceipt = await this.receiptRepository
      .createQueryBuilder('receipt')
      .where('receipt.receipt_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('receipt.receipt_number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastReceipt) {
      const lastNumber = parseInt(
        lastReceipt.receiptNumber.replace(prefix, ''),
        10,
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
