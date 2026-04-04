import { Test, TestingModule } from '@nestjs/testing';
import { LayawayPlansController } from './layaway-plans.controller';
import { LayawayPlansService } from './layaway-plans.service';
import { LayawayPlan, LayawayStatus } from './entities/layaway-plan.entity';

describe('LayawayPlansController', () => {
  let controller: LayawayPlansController;
  let service: LayawayPlansService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPlanNumber: jest.fn(),
    findByCustomer: jest.fn(),
    findByBranch: jest.fn(),
    findByStatus: jest.fn(),
    findOverdue: jest.fn(),
    findUpcoming: jest.fn(),
    recordPayment: jest.fn(),
    updateStatus: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generatePlanNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LayawayPlansController],
      providers: [{ provide: LayawayPlansService, useValue: mockService }],
    }).compile();

    controller = module.get<LayawayPlansController>(LayawayPlansController);
    service = module.get<LayawayPlansService>(LayawayPlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a layaway plan', async () => {
      mockService.create.mockResolvedValue(mockLayawayPlan);

      const result = await controller.create({
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

  describe('findByCustomer', () => {
    it('should return plans for a customer', async () => {
      mockService.findByCustomer.mockResolvedValue([mockLayawayPlan]);

      const result = await controller.findByCustomer(1);

      expect(result).toEqual([mockLayawayPlan]);
    });
  });

  describe('findOverdue', () => {
    it('should return overdue plans', async () => {
      mockService.findOverdue.mockResolvedValue([mockLayawayPlan]);

      const result = await controller.findOverdue();

      expect(result).toEqual([mockLayawayPlan]);
    });
  });

  describe('recordPayment', () => {
    it('should record a payment', async () => {
      const updatedPlan = { ...mockLayawayPlan, remainingBalance: 6000 };
      mockService.recordPayment.mockResolvedValue(updatedPlan);

      const result = await controller.recordPayment(1, 2000);

      expect(result.remainingBalance).toBe(6000);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      const updatedPlan = { ...mockLayawayPlan, status: LayawayStatus.CANCELLED };
      mockService.updateStatus.mockResolvedValue(updatedPlan);

      const result = await controller.updateStatus(1, LayawayStatus.CANCELLED);

      expect(result.status).toBe(LayawayStatus.CANCELLED);
    });
  });

  describe('generatePlanNumber', () => {
    it('should generate plan number', async () => {
      mockService.generatePlanNumber.mockResolvedValue('LAY-20240101-0002');

      const result = await controller.generatePlanNumber();

      expect(result).toBe('LAY-20240101-0002');
    });
  });

  describe('remove', () => {
    it('should remove a layaway plan', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
