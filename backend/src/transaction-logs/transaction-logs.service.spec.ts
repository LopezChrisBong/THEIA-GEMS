import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog, TransactionAction } from './entities/transaction-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('TransactionLogsService', () => {
  let service: TransactionLogsService;
  let repository: Repository<TransactionLog>;

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
        TransactionLogsService,
        {
          provide: getRepositoryToken(TransactionLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionLogsService>(TransactionLogsService);
    repository = module.get<Repository<TransactionLog>>(
      getRepositoryToken(TransactionLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction log', async () => {
      mockRepository.create.mockReturnValue(mockLog);
      mockRepository.save.mockResolvedValue(mockLog);

      const result = await service.create({
        transactionType: 'sale',
        transactionId: 1,
        tableName: 'sales',
        action: TransactionAction.CREATE,
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

  describe('findByAction', () => {
    it('should return logs by action', async () => {
      mockRepository.find.mockResolvedValue([mockLog]);

      const result = await service.findByAction(TransactionAction.CREATE);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('getSummaryByAction', () => {
    it('should return summary by action', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'create', count: '10' },
          { action: 'update', count: '5' },
        ]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSummaryByAction();

      expect(result.create).toBe(10);
      expect(result.update).toBe(5);
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
