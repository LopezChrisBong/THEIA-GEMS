import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayawayPaymentsService } from './layaway-payments.service';
import { LayawayPayment } from './entities/layaway-payment.entity';
import { LayawayPlansService } from '../layaway-plans/layaway-plans.service';
import { PaymentMethod } from '../payments/entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

describe('LayawayPaymentsService', () => {
  let service: LayawayPaymentsService;
  let repository: Repository<LayawayPayment>;
  let layawayPlansService: LayawayPlansService;

  const mockLayawayPayment: LayawayPayment = {
    id: 1,
    receiptNumber: 'LPR-20240101-0001',
    layawayPlanId: 1,
    layawayPlan: null,
    receivedBy: 1,
    receiver: null,
    amount: 2000,
    paymentMethod: PaymentMethod.CASH,
    referenceNumber: null,
    paymentDate: new Date(),
    paymentNumber: 1,
    balanceBefore: 8000,
    balanceAfter: 6000,
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

  const mockLayawayPlansService = {
    findOne: jest.fn(),
    recordPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayawayPaymentsService,
        {
          provide: getRepositoryToken(LayawayPayment),
          useValue: mockRepository,
        },
        {
          provide: LayawayPlansService,
          useValue: mockLayawayPlansService,
        },
      ],
    }).compile();

    service = module.get<LayawayPaymentsService>(LayawayPaymentsService);
    repository = module.get<Repository<LayawayPayment>>(
      getRepositoryToken(LayawayPayment),
    );
    layawayPlansService = module.get<LayawayPlansService>(LayawayPlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a layaway payment', async () => {
      mockLayawayPlansService.findOne.mockResolvedValue({
        id: 1,
        remainingBalance: 8000,
        paymentsMade: 0,
      });
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.create.mockReturnValue(mockLayawayPayment);
      mockRepository.save.mockResolvedValue(mockLayawayPayment);
      mockLayawayPlansService.recordPayment.mockResolvedValue({});

      const result = await service.create({
        layawayPlanId: 1,
        receivedBy: 1,
        amount: 2000,
      });

      expect(result).toEqual(mockLayawayPayment);
      expect(mockLayawayPlansService.recordPayment).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a layaway payment', async () => {
      mockRepository.findOne.mockResolvedValue(mockLayawayPayment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLayawayPayment);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByLayawayPlan', () => {
    it('should return payments for a plan', async () => {
      mockRepository.find.mockResolvedValue([mockLayawayPayment]);

      const result = await service.findByLayawayPlan(1);

      expect(result).toEqual([mockLayawayPayment]);
    });
  });

  describe('getTotalPaymentsForPlan', () => {
    it('should return total payments', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '6000.00' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalPaymentsForPlan(1);

      expect(result).toBe(6000);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.generateReceiptNumber();

      expect(result).toMatch(/^LPR-\d{8}-0001$/);
    });
  });

  describe('remove', () => {
    it('should remove a layaway payment', async () => {
      mockRepository.findOne.mockResolvedValue(mockLayawayPayment);
      mockRepository.remove.mockResolvedValue(mockLayawayPayment);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockLayawayPayment);
    });
  });
});
