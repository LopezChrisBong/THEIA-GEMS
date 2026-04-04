import { Test, TestingModule } from '@nestjs/testing';
import { SaleItemsController } from './sale-items.controller';
import { SaleItemsService } from './sale-items.service';
import { SaleItem } from './entities/sale-item.entity';

describe('SaleItemsController', () => {
  let controller: SaleItemsController;
  let service: SaleItemsService;

  const mockSaleItem: SaleItem = {
    id: 1,
    saleId: 1,
    sale: null,
    productId: 1,
    product: null,
    variantId: null,
    variant: null,
    serialNumberId: null,
    serialNumber: null,
    quantity: 2,
    unitPrice: 500,
    unitCost: 300,
    discountPercent: 0,
    discountAmount: 0,
    lineTotal: 1000,
    grossMargin: 400,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    createBulk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySale: jest.fn(),
    findByProduct: jest.fn(),
    getSaleSummary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleItemsController],
      providers: [{ provide: SaleItemsService, useValue: mockService }],
    }).compile();

    controller = module.get<SaleItemsController>(SaleItemsController);
    service = module.get<SaleItemsService>(SaleItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale item', async () => {
      mockService.create.mockResolvedValue(mockSaleItem);

      const result = await controller.create({
        saleId: 1,
        productId: 1,
        quantity: 2,
        unitPrice: 500,
        lineTotal: 1000,
      });

      expect(result).toEqual(mockSaleItem);
    });
  });

  describe('createBulk', () => {
    it('should create multiple sale items', async () => {
      const items = [mockSaleItem, { ...mockSaleItem, id: 2 }];
      mockService.createBulk.mockResolvedValue(items);

      const result = await controller.createBulk([
        { saleId: 1, productId: 1, quantity: 2, unitPrice: 500, lineTotal: 1000 },
      ]);

      expect(result).toEqual(items);
    });
  });

  describe('findBySale', () => {
    it('should return items for a sale', async () => {
      mockService.findBySale.mockResolvedValue([mockSaleItem]);

      const result = await controller.findBySale(1);

      expect(result).toEqual([mockSaleItem]);
    });
  });

  describe('getSaleSummary', () => {
    it('should return sale summary', async () => {
      const summary = {
        itemCount: 2,
        totalQuantity: 5,
        subtotal: 1000,
        totalDiscount: 50,
        totalMargin: 200,
      };
      mockService.getSaleSummary.mockResolvedValue(summary);

      const result = await controller.getSaleSummary(1);

      expect(result).toEqual(summary);
    });
  });

  describe('remove', () => {
    it('should remove a sale item', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
