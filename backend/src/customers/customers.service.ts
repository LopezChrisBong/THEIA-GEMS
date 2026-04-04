import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    if (createCustomerDto.customerCode) {
      const existingCode = await this.customerRepository.findOne({
        where: { customerCode: createCustomerDto.customerCode },
      });

      if (existingCode) {
        throw new ConflictException('Customer code already exists');
      }
    }

    if (createCustomerDto.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: createCustomerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByCode(customerCode: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customerCode },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with code ${customerCode} not found`);
    }

    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with email ${email} not found`);
    }

    return customer;
  }

  async search(query: string): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.firstName LIKE :query', { query: `%${query}%` })
      .orWhere('customer.lastName LIKE :query', { query: `%${query}%` })
      .orWhere('customer.email LIKE :query', { query: `%${query}%` })
      .orWhere('customer.phone LIKE :query', { query: `%${query}%` })
      .orWhere('customer.customerCode LIKE :query', { query: `%${query}%` })
      .orderBy('customer.lastName', 'ASC')
      .getMany();
  }

  async findRepeatBuyers(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { isRepeatBuyer: true },
      order: { totalPurchases: 'DESC' },
    });
  }

  async findTopCustomers(limit: number = 10): Promise<Customer[]> {
    return this.customerRepository.find({
      order: { totalPurchases: 'DESC' },
      take: limit,
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (updateCustomerDto.customerCode && updateCustomerDto.customerCode !== customer.customerCode) {
      const existingCode = await this.customerRepository.findOne({
        where: { customerCode: updateCustomerDto.customerCode },
      });

      if (existingCode) {
        throw new ConflictException('Customer code already exists');
      }
    }

    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async recordPurchase(id: number, amount: number): Promise<Customer> {
    const customer = await this.findOne(id);

    customer.totalPurchases = Number(customer.totalPurchases) + amount;
    customer.purchaseCount += 1;
    customer.lastPurchaseAt = new Date();

    if (customer.purchaseCount > 1) {
      customer.isRepeatBuyer = true;
    }

    return this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async generateCustomerCode(): Promise<string> {
    const lastCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.customerCode IS NOT NULL')
      .orderBy('customer.id', 'DESC')
      .getOne();

    if (!lastCustomer || !lastCustomer.customerCode) {
      return 'CUST-0001';
    }

    const lastNumber = parseInt(lastCustomer.customerCode.split('-')[1] || '0', 10);
    const newNumber = lastNumber + 1;
    return `CUST-${newNumber.toString().padStart(4, '0')}`;
  }
}
