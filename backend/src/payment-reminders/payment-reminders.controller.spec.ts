import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRemindersController } from './payment-reminders.controller';
import { PaymentRemindersService } from './payment-reminders.service';
import {
  PaymentReminder,
  ReminderStatus,
  ReminderType,
  ReminderChannel,
} from './entities/payment-reminder.entity';

describe('PaymentRemindersController', () => {
  let controller: PaymentRemindersController;
  let service: PaymentRemindersService;

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

  const mockService = {
    create: jest.fn(),
    createBulk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByLayawayPlan: jest.fn(),
    findByCustomer: jest.fn(),
    findByStatus: jest.fn(),
    findByType: jest.fn(),
    findPending: jest.fn(),
    findScheduledForDate: jest.fn(),
    markAsSent: jest.fn(),
    markAsFailed: jest.fn(),
    cancel: jest.fn(),
    getSummary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRemindersController],
      providers: [{ provide: PaymentRemindersService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentRemindersController>(
      PaymentRemindersController,
    );
    service = module.get<PaymentRemindersService>(PaymentRemindersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a reminder', async () => {
      mockService.create.mockResolvedValue(mockReminder);

      const result = await controller.create({
        layawayPlanId: 1,
        customerId: 1,
        scheduledDate: '2024-01-01',
        paymentDueDate: '2024-01-04',
        amountDue: 2000,
      });

      expect(result).toEqual(mockReminder);
    });
  });

  describe('findPending', () => {
    it('should return pending reminders', async () => {
      mockService.findPending.mockResolvedValue([mockReminder]);

      const result = await controller.findPending();

      expect(result).toEqual([mockReminder]);
    });
  });

  describe('getSummary', () => {
    it('should return summary', async () => {
      const summary = { pending: 10, sent: 25, failed: 2, cancelled: 3 };
      mockService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary();

      expect(result).toEqual(summary);
    });
  });

  describe('markAsSent', () => {
    it('should mark reminder as sent', async () => {
      const sentReminder = { ...mockReminder, status: ReminderStatus.SENT };
      mockService.markAsSent.mockResolvedValue(sentReminder);

      const result = await controller.markAsSent(1, 5);

      expect(result.status).toBe(ReminderStatus.SENT);
    });
  });

  describe('cancel', () => {
    it('should cancel a reminder', async () => {
      const cancelledReminder = {
        ...mockReminder,
        status: ReminderStatus.CANCELLED,
      };
      mockService.cancel.mockResolvedValue(cancelledReminder);

      const result = await controller.cancel(1);

      expect(result.status).toBe(ReminderStatus.CANCELLED);
    });
  });

  describe('remove', () => {
    it('should remove a reminder', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
