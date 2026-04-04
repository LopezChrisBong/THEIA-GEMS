import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod, PaymentType } from './entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: Repository<Payment>;

  const mockPayment: Payment = {
    id: 1,
    paymentNumber: 'PAY-20240101-0001',
    saleId: 1,
    sale: null,
    receivedBy: 1,
    receiver: null,
    amount: 500,
    paymentMethod: PaymentMethod.CASH,
    paymentType: PaymentType.FULL,
    referenceNumber: null,
    paymentDate: new Date(),
    notes: null,
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
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.create.mockReturnValue(mockPayment);
      mockRepository.save.mockResolvedValue(mockPayment);

      const result = await service.create({
        saleId: 1,
        receivedBy: 1,
        amount: 500,
      });

      expect(result).toEqual(mockPayment);
    });
  });

  describe('findOne', () => {
    it('should return a payment', async () => {
      mockRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySale', () => {
    it('should return payments for a sale', async () => {
      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findBySale(1);

      expect(result).toEqual([mockPayment]);
    });
  });

  describe('getSaleTotalPayments', () => {
    it('should return total payments for a sale', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '1500.00' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSaleTotalPayments(1);

      expect(result).toBe(1500);
    });
  });

  describe('findByPaymentMethod', () => {
    it('should return payments by method', async () => {
      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findByPaymentMethod(PaymentMethod.CASH);

      expect(result).toEqual([mockPayment]);
    });
  });

  describe('generatePaymentNumber', () => {
    it('should generate payment number', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.generatePaymentNumber();

      expect(result).toMatch(/^PAY-\d{8}-0001$/);
    });
  });

  describe('remove', () => {
    it('should remove a payment', async () => {
      mockRepository.findOne.mockResolvedValue(mockPayment);
      mockRepository.remove.mockResolvedValue(mockPayment);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockPayment);
    });
  });
});
