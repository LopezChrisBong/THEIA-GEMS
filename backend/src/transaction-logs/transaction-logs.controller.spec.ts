import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogsController } from './transaction-logs.controller';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog, TransactionAction } from './entities/transaction-log.entity';

describe('TransactionLogsController', () => {
  let controller: TransactionLogsController;
  let service: TransactionLogsService;

  const mockLog: TransactionLog = {
    id: 1,
    transactionType: 'sale',
    transactionId: 1,
    tableName: 'sales',
    action: TransactionAction.CREATE,
    oldValues: null,
    newValues: { totalAmount: 1000 },
    performedBy: 1,
    performer: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByTransactionType: jest.fn(),
    findByTableName: jest.fn(),
    findByAction: jest.fn(),
    findByTransaction: jest.fn(),
    findByPerformer: jest.fn(),
    findByDateRange: jest.fn(),
    findByIpAddress: jest.fn(),
    getSummaryByAction: jest.fn(),
    getSummaryByTable: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionLogsController],
      providers: [{ provide: TransactionLogsService, useValue: mockService }],
    }).compile();

    controller = module.get<TransactionLogsController>(TransactionLogsController);
    service = module.get<TransactionLogsService>(TransactionLogsService);
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
        transactionType: 'sale',
        transactionId: 1,
        tableName: 'sales',
        action: TransactionAction.CREATE,
        performedBy: 1,
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('getSummaryByAction', () => {
    it('should return summary by action', async () => {
      const summary = { create: 10, update: 5 };
      mockService.getSummaryByAction.mockResolvedValue(summary);

      const result = await controller.getSummaryByAction();

      expect(result).toEqual(summary);
    });
  });

  describe('findByTransaction', () => {
    it('should return logs for a transaction', async () => {
      mockService.findByTransaction.mockResolvedValue([mockLog]);

      const result = await controller.findByTransaction('sales', 1);

      expect(result).toEqual([mockLog]);
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
