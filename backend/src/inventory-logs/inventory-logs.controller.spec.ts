import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLogsController } from './inventory-logs.controller';
import { InventoryLogsService } from './inventory-logs.service';
import { InventoryLog, ActionType } from './entities/inventory-log.entity';

describe('InventoryLogsController', () => {
  let controller: InventoryLogsController;
  let service: InventoryLogsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByProduct: jest.fn(),
    findByBranch: jest.fn(),
    findByActionType: jest.fn(),
    findByReference: jest.fn(),
    findByDateRange: jest.fn(),
    findByPerformer: jest.fn(),
    getProductHistory: jest.fn(),
    getSummaryByAction: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryLogsController],
      providers: [{ provide: InventoryLogsService, useValue: mockService }],
    }).compile();

    controller = module.get<InventoryLogsController>(InventoryLogsController);
    service = module.get<InventoryLogsService>(InventoryLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a log', async () => {
      mockService.create.mockResolvedValue(mockLog);

      const result = await controller.create({
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

  describe('findByProduct', () => {
    it('should return logs for a product', async () => {
      mockService.findByProduct.mockResolvedValue([mockLog]);

      const result = await controller.findByProduct(1);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('getSummaryByAction', () => {
    it('should return summary', async () => {
      const summary = {
        add: { count: 5, totalChange: 50 },
        sale: { count: 3, totalChange: -15 },
      };
      mockService.getSummaryByAction.mockResolvedValue(summary);

      const result = await controller.getSummaryByAction();

      expect(result).toEqual(summary);
    });
  });

  describe('remove', () => {
    it('should remove a log', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
