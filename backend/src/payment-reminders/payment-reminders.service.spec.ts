import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRemindersService } from './payment-reminders.service';
import {
  PaymentReminder,
  ReminderStatus,
  ReminderType,
  ReminderChannel,
} from './entities/payment-reminder.entity';
import { NotFoundException } from '@nestjs/common';

describe('PaymentRemindersService', () => {
  let service: PaymentRemindersService;
  let repository: Repository<PaymentReminder>;

  const mockReminder: PaymentReminder = {
    id: 1,
    layawayPlanId: 1,
    layawayPlan: null,
    customerId: 1,
    customer: null,
    reminderType: ReminderType.UPCOMING,
    status: ReminderStatus.PENDING,
    channel: ReminderChannel.SMS,
    scheduledDate: new Date(),
    sentDate: null,
    message: 'Your payment is due soon',
    sentBy: null,
    sender: null,
    paymentDueDate: new Date(),
    amountDue: 2000,
    daysBeforeDue: 3,
    daysOverdue: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRemindersService,
        {
          provide: getRepositoryToken(PaymentReminder),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentRemindersService>(PaymentRemindersService);
    repository = module.get<Repository<PaymentReminder>>(
      getRepositoryToken(PaymentReminder),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment reminder', async () => {
      mockRepository.create.mockReturnValue(mockReminder);
      mockRepository.save.mockResolvedValue(mockReminder);

      const result = await service.create({
        layawayPlanId: 1,
        customerId: 1,
        scheduledDate: '2024-01-01',
        paymentDueDate: '2024-01-04',
        amountDue: 2000,
      });

      expect(result).toEqual(mockReminder);
    });
  });

  describe('findOne', () => {
    it('should return a reminder', async () => {
      mockRepository.findOne.mockResolvedValue(mockReminder);

      const result = await service.findOne(1);

      expect(result).toEqual(mockReminder);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStatus', () => {
    it('should return reminders by status', async () => {
      mockRepository.find.mockResolvedValue([mockReminder]);

      const result = await service.findByStatus(ReminderStatus.PENDING);

      expect(result).toEqual([mockReminder]);
    });
  });

  describe('findPending', () => {
    it('should return pending reminders', async () => {
      mockRepository.find.mockResolvedValue([mockReminder]);

      const result = await service.findPending();

      expect(result).toEqual([mockReminder]);
    });
  });

  describe('markAsSent', () => {
    it('should mark reminder as sent', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockReminder });
      mockRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.markAsSent(1, 5);

      expect(result.status).toBe(ReminderStatus.SENT);
      expect(result.sentBy).toBe(5);
    });
  });

  describe('markAsFailed', () => {
    it('should mark reminder as failed', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockReminder });
      mockRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.markAsFailed(1, 'Connection failed');

      expect(result.status).toBe(ReminderStatus.FAILED);
      expect(result.notes).toBe('Connection failed');
    });
  });

  describe('cancel', () => {
    it('should cancel a reminder', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockReminder });
      mockRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.cancel(1);

      expect(result.status).toBe(ReminderStatus.CANCELLED);
    });
  });

  describe('getSummary', () => {
    it('should return summary counts', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(25) // sent
        .mockResolvedValueOnce(2) // failed
        .mockResolvedValueOnce(3); // cancelled

      const result = await service.getSummary();

      expect(result).toEqual({
        pending: 10,
        sent: 25,
        failed: 2,
        cancelled: 3,
      });
    });
  });

  describe('remove', () => {
    it('should remove a reminder', async () => {
      mockRepository.findOne.mockResolvedValue(mockReminder);
      mockRepository.remove.mockResolvedValue(mockReminder);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockReminder);
    });
  });
});
