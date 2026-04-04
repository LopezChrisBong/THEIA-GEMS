import { Test, TestingModule } from '@nestjs/testing';
import { LayawayPaymentsController } from './layaway-payments.controller';
import { LayawayPaymentsService } from './layaway-payments.service';
import { LayawayPayment } from './entities/layaway-payment.entity';
import { PaymentMethod } from '../payments/entities/payment.entity';

describe('LayawayPaymentsController', () => {
  let controller: LayawayPaymentsController;
  let service: LayawayPaymentsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByReceiptNumber: jest.fn(),
    findByLayawayPlan: jest.fn(),
    findByDateRange: jest.fn(),
    getTotalPaymentsForPlan: jest.fn(),
    getDailySummary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generateReceiptNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LayawayPaymentsController],
      providers: [{ provide: LayawayPaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get<LayawayPaymentsController>(LayawayPaymentsController);
    service = module.get<LayawayPaymentsService>(LayawayPaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a layaway payment', async () => {
      mockService.create.mockResolvedValue(mockLayawayPayment);

      const result = await controller.create({
        layawayPlanId: 1,
        receivedBy: 1,
        amount: 2000,
      });

      expect(result).toEqual(mockLayawayPayment);
    });
  });

  describe('findByLayawayPlan', () => {
    it('should return payments for a plan', async () => {
      mockService.findByLayawayPlan.mockResolvedValue([mockLayawayPayment]);

      const result = await controller.findByLayawayPlan(1);

      expect(result).toEqual([mockLayawayPayment]);
    });
  });

  describe('getTotalPaymentsForPlan', () => {
    it('should return total payments', async () => {
      mockService.getTotalPaymentsForPlan.mockResolvedValue(6000);

      const result = await controller.getTotalPaymentsForPlan(1);

      expect(result).toBe(6000);
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary', async () => {
      const summary = {
        totalPayments: 5,
        totalAmount: 10000,
        paymentCount: 5,
      };
      mockService.getDailySummary.mockResolvedValue(summary);

      const result = await controller.getDailySummary('2024-01-01');

      expect(result).toEqual(summary);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number', async () => {
      mockService.generateReceiptNumber.mockResolvedValue('LPR-20240101-0002');

      const result = await controller.generateReceiptNumber();

      expect(result).toBe('LPR-20240101-0002');
    });
  });

  describe('remove', () => {
    it('should remove a layaway payment', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
