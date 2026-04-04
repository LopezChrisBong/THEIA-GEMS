import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { Receipt } from './entities/receipt.entity';

describe('ReceiptsController', () => {
  let controller: ReceiptsController;
  let service: ReceiptsService;

  const mockReceipt: Receipt = {
    id: 1,
    saleId: 1,
    sale: null,
    receiptNumber: 'RCP-20240101-0001',
    branchId: 1,
    branch: null,
    headerText: 'Welcome to Theia Gems',
    footerText: 'Thank you for shopping!',
    logoUrl: null,
    printedAt: null,
    printedBy: null,
    printer: null,
    reprintCount: 0,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByReceiptNumber: jest.fn(),
    findBySale: jest.fn(),
    findByBranch: jest.fn(),
    print: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generateReceiptNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiptsController],
      providers: [{ provide: ReceiptsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReceiptsController>(ReceiptsController);
    service = module.get<ReceiptsService>(ReceiptsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a receipt', async () => {
      mockService.create.mockResolvedValue(mockReceipt);

      const result = await controller.create({
        saleId: 1,
        branchId: 1,
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe('findBySale', () => {
    it('should return receipt for a sale', async () => {
      mockService.findBySale.mockResolvedValue(mockReceipt);

      const result = await controller.findBySale(1);

      expect(result).toEqual(mockReceipt);
    });
  });

  describe('print', () => {
    it('should print a receipt', async () => {
      const printedReceipt = { ...mockReceipt, printedAt: new Date() };
      mockService.print.mockResolvedValue(printedReceipt);

      const result = await controller.print(1, 5);

      expect(result.printedAt).toBeDefined();
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number', async () => {
      mockService.generateReceiptNumber.mockResolvedValue('RCP-20240101-0002');

      const result = await controller.generateReceiptNumber();

      expect(result).toBe('RCP-20240101-0002');
    });
  });

  describe('remove', () => {
    it('should remove a receipt', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
