import { Test, TestingModule } from '@nestjs/testing';
import { PromotionalMessagesController } from './promotional-messages.controller';
import { PromotionalMessagesService } from './promotional-messages.service';
import {
  PromotionalMessage,
  MessageStatus,
  MessageType,
  SendMethod,
} from './entities/promotional-message.entity';

describe('PromotionalMessagesController', () => {
  let controller: PromotionalMessagesController;
  let service: PromotionalMessagesService;

  const mockMessage: PromotionalMessage = {
    id: 1,
    messageType: MessageType.PROMOTIONAL,
    customerId: null,
    customer: null,
    sendMethod: SendMethod.EMAIL,
    subject: 'New Arrivals!',
    messageContent: 'Check out our new collection',
    scheduledDate: new Date(),
    status: MessageStatus.DRAFT,
    sentAt: null,
    createdBy: 1,
    creator: null,
    createdAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByStatus: jest.fn(),
    findByType: jest.fn(),
    findByCustomer: jest.fn(),
    findBroadcasts: jest.fn(),
    findScheduledToSend: jest.fn(),
    schedule: jest.fn(),
    markAsSent: jest.fn(),
    markAsFailed: jest.fn(),
    getSummary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionalMessagesController],
      providers: [{ provide: PromotionalMessagesService, useValue: mockService }],
    }).compile();

    controller = module.get<PromotionalMessagesController>(
      PromotionalMessagesController,
    );
    service = module.get<PromotionalMessagesService>(PromotionalMessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a message', async () => {
      mockService.create.mockResolvedValue(mockMessage);

      const result = await controller.create({
        sendMethod: SendMethod.EMAIL,
        messageContent: 'Check out our new collection',
        createdBy: 1,
      });

      expect(result).toEqual(mockMessage);
    });
  });

  describe('getSummary', () => {
    it('should return summary', async () => {
      const summary = { draft: 5, scheduled: 3, sent: 10, failed: 2 };
      mockService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary();

      expect(result).toEqual(summary);
    });
  });

  describe('markAsSent', () => {
    it('should mark as sent', async () => {
      const sentMessage = { ...mockMessage, status: MessageStatus.SENT };
      mockService.markAsSent.mockResolvedValue(sentMessage);

      const result = await controller.markAsSent(1);

      expect(result.status).toBe(MessageStatus.SENT);
    });
  });

  describe('remove', () => {
    it('should remove a message', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
