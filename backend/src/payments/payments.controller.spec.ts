import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod, PaymentType } from './entities/payment.entity';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPaymentNumber: jest.fn(),
    findBySale: jest.fn(),
    findByDateRange: jest.fn(),
    findByPaymentMethod: jest.fn(),
    findByPaymentType: jest.fn(),
    getSaleTotalPayments: jest.fn(),
    getDailySummary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generatePaymentNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment', async () => {
      mockService.create.mockResolvedValue(mockPayment);

      const result = await controller.create({
        saleId: 1,
        receivedBy: 1,
        amount: 500,
      });

      expect(result).toEqual(mockPayment);
    });
  });

  describe('findBySale', () => {
    it('should return payments for a sale', async () => {
      mockService.findBySale.mockResolvedValue([mockPayment]);

      const result = await controller.findBySale(1);

      expect(result).toEqual([mockPayment]);
    });
  });

  describe('getSaleTotalPayments', () => {
    it('should return total payments', async () => {
      mockService.getSaleTotalPayments.mockResolvedValue(1500);

      const result = await controller.getSaleTotalPayments(1);

      expect(result).toBe(1500);
    });
  });

  describe('generatePaymentNumber', () => {
    it('should generate payment number', async () => {
      mockService.generatePaymentNumber.mockResolvedValue('PAY-20240101-0002');

      const result = await controller.generatePaymentNumber();

      expect(result).toBe('PAY-20240101-0002');
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary', async () => {
      const summary = {
        totalPayments: 10,
        totalAmount: 5000,
        byMethod: { cash: { count: 5, amount: 2500 } },
      };
      mockService.getDailySummary.mockResolvedValue(summary);

      const result = await controller.getDailySummary('2024-01-01');

      expect(result).toEqual(summary);
    });
  });

  describe('remove', () => {
    it('should remove a payment', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
