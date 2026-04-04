import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityLogsController } from './user-activity-logs.controller';
import { UserActivityLogsService } from './user-activity-logs.service';
import { UserActivityLog } from './entities/user-activity-log.entity';

describe('UserActivityLogsController', () => {
  let controller: UserActivityLogsController;
  let service: UserActivityLogsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    findByActivityType: jest.fn(),
    findByModule: jest.fn(),
    findBySession: jest.fn(),
    findByDateRange: jest.fn(),
    findByIpAddress: jest.fn(),
    getUserLastActivity: jest.fn(),
    getSummaryByActivityType: jest.fn(),
    getSummaryByModule: jest.fn(),
    getActiveUsers: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserActivityLogsController],
      providers: [{ provide: UserActivityLogsService, useValue: mockService }],
    }).compile();

    controller = module.get<UserActivityLogsController>(UserActivityLogsController);
    service = module.get<UserActivityLogsService>(UserActivityLogsService);
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
        userId: 1,
        activityType: 'login',
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('findByUser', () => {
    it('should return logs for a user', async () => {
      mockService.findByUser.mockResolvedValue([mockLog]);

      const result = await controller.findByUser(1);

      expect(result).toEqual([mockLog]);
    });
  });

  describe('getActiveUsers', () => {
    it('should return active user count', async () => {
      mockService.getActiveUsers.mockResolvedValue(25);

      const result = await controller.getActiveUsers('2024-01-01');

      expect(result).toBe(25);
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
