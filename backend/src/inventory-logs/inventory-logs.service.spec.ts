import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryLogsService } from './inventory-logs.service';
import { InventoryLog, ActionType } from './entities/inventory-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('InventoryLogsService', () => {
  let service: InventoryLogsService;
  let repository: Repository<InventoryLog>;

  const mockLog: InventoryLog = {
    id: 1,
    productId: 1,
    product: null,
    variantId: null,
    variant: null,
    branchId: 1,
    branch: null,
    actionType: ActionType.ADD,
    quantityChange: 10,
    previousQuantity: 0,
    newQuantity: 10,
    referenceId: null,
    referenceType: null,
    notes: 'Initial stock',
    performedBy: 1,
    performer: null,
    createdAt: new Date(),
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
        InventoryLogsService,
        {
          provide: getRepositoryToken(InventoryLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryLogsService>(InventoryLogsService);
    repository = module.get<Repository<InventoryLog>>(
      getRepositoryToken(InventoryLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an inventory log', async () => {
      mockRepository.create.mockReturnValue(mockLog);
      mockRepository.save.mockResolvedValue(mockLog);

      const result = await service.create({
        productId: 1,
        branchId: 1,
        actionType: ActionType.ADD,
        quantityChange: 10,
        previousQuantity: 0,
        newQuantity: 10,
        performedBy: 1,
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('findOne', () => {
    it('should return a log', async () => {
      mockRepository.findOne.mockResolvedValue(mockLog);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should return logs for a product', async () => {
      mockRepository.find.mockResolvedValue([mockLog]);

      const result = await service.findByProduct(1);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('findByActionType', () => {
    it('should return logs by action type', async () => {
      mockRepository.find.mockResolvedValue([mockLog]);

      const result = await service.findByActionType(ActionType.ADD);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('getSummaryByAction', () => {
    it('should return summary by action', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { actionType: 'add', count: '5', totalChange: '50' },
          { actionType: 'sale', count: '3', totalChange: '-15' },
        ]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSummaryByAction();

      expect(result.add.count).toBe(5);
      expect(result.sale.totalChange).toBe(-15);
    });
  });

  describe('remove', () => {
    it('should remove a log', async () => {
      mockRepository.findOne.mockResolvedValue(mockLog);
      mockRepository.remove.mockResolvedValue(mockLog);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockLog);
    });
  });
});
