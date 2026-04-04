import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayawayPlansService } from './layaway-plans.service';
import { LayawayPlan, LayawayStatus } from './entities/layaway-plan.entity';
import { NotFoundException } from '@nestjs/common';

describe('LayawayPlansService', () => {
  let service: LayawayPlansService;
  let repository: Repository<LayawayPlan>;

  const mockLayawayPlan: LayawayPlan = {
    id: 1,
    planNumber: 'LAY-20240101-0001',
    saleId: 1,
    sale: null,
    customerId: 1,
    customer: null,
    branchId: 1,
    branch: null,
    totalAmount: 10000,
    downPayment: 2000,
    remainingBalance: 8000,
    monthlyPayment: 2000,
    numberOfPayments: 4,
    paymentsMade: 0,
    startDate: new Date(),
    endDate: new Date(),
    nextPaymentDate: new Date(),
    status: LayawayStatus.ACTIVE,
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
        LayawayPlansService,
        {
          provide: getRepositoryToken(LayawayPlan),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LayawayPlansService>(LayawayPlansService);
    repository = module.get<Repository<LayawayPlan>>(
      getRepositoryToken(LayawayPlan),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a layaway plan', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.create.mockReturnValue(mockLayawayPlan);
      mockRepository.save.mockResolvedValue(mockLayawayPlan);

      const result = await service.create({
        saleId: 1,
        customerId: 1,
        branchId: 1,
        totalAmount: 10000,
        downPayment: 2000,
        numberOfPayments: 4,
        startDate: '2024-01-01',
      });

      expect(result).toEqual(mockLayawayPlan);
    });
  });

  describe('findOne', () => {
    it('should return a layaway plan', async () => {
      mockRepository.findOne.mockResolvedValue(mockLayawayPlan);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLayawayPlan);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCustomer', () => {
    it('should return plans for a customer', async () => {
      mockRepository.find.mockResolvedValue([mockLayawayPlan]);

      const result = await service.findByCustomer(1);

      expect(result).toEqual([mockLayawayPlan]);
    });
  });

  describe('findByStatus', () => {
    it('should return plans by status', async () => {
      mockRepository.find.mockResolvedValue([mockLayawayPlan]);

      const result = await service.findByStatus(LayawayStatus.ACTIVE);

      expect(result).toEqual([mockLayawayPlan]);
    });
  });

  describe('recordPayment', () => {
    it('should record a payment and update balance', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockLayawayPlan });
      mockRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.recordPayment(1, 2000);

      expect(result.remainingBalance).toBe(6000);
      expect(result.paymentsMade).toBe(1);
    });

    it('should mark as completed when fully paid', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockLayawayPlan,
        remainingBalance: 2000,
        paymentsMade: 3,
      });
      mockRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.recordPayment(1, 2000);

      expect(result.status).toBe(LayawayStatus.COMPLETED);
      expect(result.remainingBalance).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockLayawayPlan });
      mockRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.updateStatus(1, LayawayStatus.CANCELLED);

      expect(result.status).toBe(LayawayStatus.CANCELLED);
    });
  });

  describe('generatePlanNumber', () => {
    it('should generate plan number', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.generatePlanNumber();

      expect(result).toMatch(/^LAY-\d{8}-0001$/);
    });
  });

  describe('remove', () => {
    it('should remove a layaway plan', async () => {
      mockRepository.findOne.mockResolvedValue(mockLayawayPlan);
      mockRepository.remove.mockResolvedValue(mockLayawayPlan);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockLayawayPlan);
    });
  });
});
