import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  const mockCustomer: Customer = {
    id: 1,
    customerCode: 'CUST-0001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
    dateOfBirth: new Date('1990-01-01'),
    isRepeatBuyer: false,
    totalPurchases: 0,
    purchaseCount: 0,
    registeredAt: new Date(),
    lastPurchaseAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '09171234567',
        address: '123 Sample St.',
      });

      expect(result).toEqual(mockCustomer);
    });

    it('should throw ConflictException if email exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockCustomer);

      await expect(
        service.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '09171234567',
          address: '123 Sample St.',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a customer', async () => {
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordPurchase', () => {
    it('should record a purchase and update stats', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockCustomer });
      mockRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.recordPurchase(1, 100);

      expect(result.totalPurchases).toBe(100);
      expect(result.purchaseCount).toBe(1);
      expect(result.lastPurchaseAt).toBeDefined();
    });

    it('should mark as repeat buyer on second purchase', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        purchaseCount: 1,
        totalPurchases: 100,
      });
      mockRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.recordPurchase(1, 200);

      expect(result.isRepeatBuyer).toBe(true);
      expect(result.purchaseCount).toBe(2);
    });
  });

  describe('findRepeatBuyers', () => {
    it('should return repeat buyers', async () => {
      mockRepository.find.mockResolvedValue([
        { ...mockCustomer, isRepeatBuyer: true },
      ]);

      const result = await service.findRepeatBuyers();

      expect(result[0].isRepeatBuyer).toBe(true);
    });
  });
});
