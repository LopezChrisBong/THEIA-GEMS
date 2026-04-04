import { Test, TestingModule } from '@nestjs/testing';
import { ConsignmentItemsController } from './consignment-items.controller';
import { ConsignmentItemsService } from './consignment-items.service';
import { ConsignmentItem, ConsignmentStatus } from './entities/consignment-item.entity';

describe('ConsignmentItemsController', () => {
  let controller: ConsignmentItemsController;
  let service: ConsignmentItemsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByStatus: jest.fn(),
    findByBranch: jest.fn(),
    findByConsignor: jest.fn(),
    findActive: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    markAsSold: jest.fn(),
    markAsReturned: jest.fn(),
    remove: jest.fn(),
    calculateCommission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsignmentItemsController],
      providers: [
        {
          provide: ConsignmentItemsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ConsignmentItemsController>(ConsignmentItemsController);
    service = module.get<ConsignmentItemsService>(ConsignmentItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create consignment item', async () => {
      mockService.create.mockResolvedValue(mockConsignmentItem);

      const result = await controller.create({
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

  describe('findAll', () => {
    it('should return all consignment items', async () => {
      mockService.findAll.mockResolvedValue([mockConsignmentItem]);

      const result = await controller.findAll();

      expect(result).toEqual([mockConsignmentItem]);
    });
  });

  describe('findActive', () => {
    it('should return active items', async () => {
      mockService.findActive.mockResolvedValue([mockConsignmentItem]);

      const result = await controller.findActive();

      expect(result).toEqual([mockConsignmentItem]);
    });
  });

  describe('markAsSold', () => {
    it('should mark item as sold', async () => {
      const soldItem = { ...mockConsignmentItem, status: ConsignmentStatus.SOLD };
      mockService.markAsSold.mockResolvedValue(soldItem);

      const result = await controller.markAsSold(1);

      expect(result.status).toBe(ConsignmentStatus.SOLD);
    });
  });

  describe('calculateCommission', () => {
    it('should return commission calculation', async () => {
      mockService.calculateCommission.mockResolvedValue({
        commission: 75,
        netToConsignor: 675,
      });

      const result = await controller.calculateCommission(1);

      expect(result.commission).toBe(75);
      expect(result.netToConsignor).toBe(675);
    });
  });

  describe('remove', () => {
    it('should remove consignment item', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
