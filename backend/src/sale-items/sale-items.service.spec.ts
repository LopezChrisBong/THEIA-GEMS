import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItemsService } from './sale-items.service';
import { SaleItem } from './entities/sale-item.entity';
import { NotFoundException } from '@nestjs/common';

describe('SaleItemsService', () => {
  let service: SaleItemsService;
  let repository: Repository<SaleItem>;

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
        SaleItemsService,
        {
          provide: getRepositoryToken(SaleItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SaleItemsService>(SaleItemsService);
    repository = module.get<Repository<SaleItem>>(getRepositoryToken(SaleItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale item', async () => {
      mockRepository.create.mockReturnValue(mockSaleItem);
      mockRepository.save.mockResolvedValue(mockSaleItem);

      const result = await service.create({
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
      mockRepository.create.mockReturnValue(mockSaleItem);
      mockRepository.save.mockResolvedValue(items);

      const result = await service.createBulk([
        { saleId: 1, productId: 1, quantity: 2, unitPrice: 500, lineTotal: 1000 },
        { saleId: 1, productId: 2, quantity: 1, unitPrice: 300, lineTotal: 300 },
      ]);

      expect(result).toEqual(items);
    });
  });

  describe('findOne', () => {
    it('should return a sale item', async () => {
      mockRepository.findOne.mockResolvedValue(mockSaleItem);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSaleItem);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySale', () => {
    it('should return items for a sale', async () => {
      mockRepository.find.mockResolvedValue([mockSaleItem]);

      const result = await service.findBySale(1);

      expect(result).toEqual([mockSaleItem]);
    });
  });

  describe('getSaleSummary', () => {
    it('should return sale summary', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          itemCount: '2',
          totalQuantity: '5',
          subtotal: '1000.00',
          totalDiscount: '50.00',
          totalMargin: '200.00',
        }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSaleSummary(1);

      expect(result.itemCount).toBe(2);
      expect(result.subtotal).toBe(1000);
    });
  });

  describe('remove', () => {
    it('should remove a sale item', async () => {
      mockRepository.findOne.mockResolvedValue(mockSaleItem);
      mockRepository.remove.mockResolvedValue(mockSaleItem);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockSaleItem);
    });
  });
});
