import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentItemsService } from './consignment-items.service';
import { ConsignmentItem, ConsignmentStatus } from './entities/consignment-item.entity';
import { NotFoundException } from '@nestjs/common';

describe('ConsignmentItemsService', () => {
  let service: ConsignmentItemsService;
  let repository: Repository<ConsignmentItem>;

  const mockConsignmentItem: ConsignmentItem = {
    id: 1,
    productId: 1,
    product: null,
    variantId: null,
    variant: null,
    serialNumberId: null,
    serialNumber: null,
    consignorName: 'John Doe',
    consignorContact: '123-456-7890',
    consignedPrice: 500.00,
    sellingPrice: 750.00,
    commissionRate: 10.00,
    consignmentDate: new Date(),
    status: ConsignmentStatus.ACTIVE,
    branchId: 1,
    branch: null,
    notes: 'Test notes',
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
        ConsignmentItemsService,
        {
          provide: getRepositoryToken(ConsignmentItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConsignmentItemsService>(ConsignmentItemsService);
    repository = module.get<Repository<ConsignmentItem>>(getRepositoryToken(ConsignmentItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create consignment item', async () => {
      mockRepository.create.mockReturnValue(mockConsignmentItem);
      mockRepository.save.mockResolvedValue(mockConsignmentItem);

      const result = await service.create({
        productId: 1,
        consignorName: 'John Doe',
        consignedPrice: 500,
        sellingPrice: 750,
        consignmentDate: '2024-01-01',
        branchId: 1,
      });

      expect(result).toEqual(mockConsignmentItem);
    });
  });

  describe('findOne', () => {
    it('should return consignment item', async () => {
      mockRepository.findOne.mockResolvedValue(mockConsignmentItem);

      const result = await service.findOne(1);

      expect(result).toEqual(mockConsignmentItem);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsSold', () => {
    it('should mark item as sold', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockConsignmentItem });
      mockRepository.save.mockImplementation((item) =>
        Promise.resolve({ ...item, status: ConsignmentStatus.SOLD }),
      );

      const result = await service.markAsSold(1);

      expect(result.status).toBe(ConsignmentStatus.SOLD);
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission correctly', async () => {
      mockRepository.findOne.mockResolvedValue(mockConsignmentItem);

      const result = await service.calculateCommission(1);

      expect(result.commission).toBe(75); // 750 * 10%
      expect(result.netToConsignor).toBe(675); // 750 - 75
    });
  });
});
