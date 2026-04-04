import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivityLogsService } from './user-activity-logs.service';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserActivityLogsService', () => {
  let service: UserActivityLogsService;
  let repository: Repository<UserActivityLog>;

  const mockLog: UserActivityLog = {
    id: 1,
    userId: 1,
    user: null,
    activityType: 'login',
    activityDescription: 'User logged in',
    module: 'Auth',
    ipAddress: '192.168.1.1',
    sessionId: 'session123',
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
        UserActivityLogsService,
        {
          provide: getRepositoryToken(UserActivityLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserActivityLogsService>(UserActivityLogsService);
    repository = module.get<Repository<UserActivityLog>>(
      getRepositoryToken(UserActivityLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user activity log', async () => {
      mockRepository.create.mockReturnValue(mockLog);
      mockRepository.save.mockResolvedValue(mockLog);

      const result = await service.create({
        userId: 1,
        activityType: 'login',
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

  describe('findByUser', () => {
    it('should return logs for a user', async () => {
      mockRepository.find.mockResolvedValue([mockLog]);

      const result = await service.findByUser(1);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('getSummaryByActivityType', () => {
    it('should return summary by activity type', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { activityType: 'login', count: '50' },
          { activityType: 'logout', count: '45' },
        ]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSummaryByActivityType();

      expect(result.login).toBe(50);
      expect(result.logout).toBe(45);
    });
  });

  describe('getActiveUsers', () => {
    it('should return active user count', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '25' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getActiveUsers(new Date());

      expect(result).toBe(25);
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
