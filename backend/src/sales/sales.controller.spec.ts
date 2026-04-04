import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale, PaymentStatus, SaleType } from './entities/sale.entity';

describe('SalesController', () => {
  let controller: SalesController;
  let service: SalesService;

  const mockSale: Sale = {
    id: 1,
    saleNumber: 'SL-20240101-0001',
    branchId: 1,
    branch: null,
    customerId: 1,
    customer: null,
    cashierId: 1,
    cashier: null,
    saleDate: new Date(),
    subtotal: 100,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 100,
    amountPaid: 100,
    changeAmount: 0,
    paymentStatus: PaymentStatus.PAID,
    saleType: SaleType.REGULAR,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySaleNumber: jest.fn(),
    findByBranch: jest.fn(),
    findByCustomer: jest.fn(),
    findByDateRange: jest.fn(),
    findByPaymentStatus: jest.fn(),
    findBySaleType: jest.fn(),
    update: jest.fn(),
    updatePaymentStatus: jest.fn(),
    recordPayment: jest.fn(),
    remove: jest.fn(),
    generateSaleNumber: jest.fn(),
    getDailySummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [{ provide: SalesService, useValue: mockService }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale', async () => {
      mockService.create.mockResolvedValue(mockSale);
      const result = await controller.create({
        saleNumber: 'SL-20240101-0001',
        branchId: 1,
        cashierId: 1,
        subtotal: 100,
        totalAmount: 100,
      });
      expect(result).toEqual(mockSale);
    });
  });

  describe('generateSaleNumber', () => {
    it('should generate sale number', async () => {
      mockService.generateSaleNumber.mockResolvedValue('SL-20240101-0002');
      const result = await controller.generateSaleNumber();
      expect(result).toBe('SL-20240101-0002');
    });
  });
});
