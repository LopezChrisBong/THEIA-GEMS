import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionalMessagesService } from './promotional-messages.service';
import {
  PromotionalMessage,
  MessageStatus,
  MessageType,
  SendMethod,
} from './entities/promotional-message.entity';
import { NotFoundException } from '@nestjs/common';

describe('PromotionalMessagesService', () => {
  let service: PromotionalMessagesService;
  let repository: Repository<PromotionalMessage>;

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
        PromotionalMessagesService,
        {
          provide: getRepositoryToken(PromotionalMessage),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PromotionalMessagesService>(PromotionalMessagesService);
    repository = module.get<Repository<PromotionalMessage>>(
      getRepositoryToken(PromotionalMessage),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a promotional message', async () => {
      mockRepository.create.mockReturnValue(mockMessage);
      mockRepository.save.mockResolvedValue(mockMessage);

      const result = await service.create({
        sendMethod: SendMethod.EMAIL,
        messageContent: 'Check out our new collection',
        createdBy: 1,
      });

      expect(result).toEqual(mockMessage);
    });
  });

  describe('findOne', () => {
    it('should return a message', async () => {
      mockRepository.findOne.mockResolvedValue(mockMessage);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStatus', () => {
    it('should return messages by status', async () => {
      mockRepository.find.mockResolvedValue([mockMessage]);

      const result = await service.findByStatus(MessageStatus.DRAFT);

      expect(result).toEqual([mockMessage]);
    });
  });

  describe('markAsSent', () => {
    it('should mark message as sent', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockMessage });
      mockRepository.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.markAsSent(1);

      expect(result.status).toBe(MessageStatus.SENT);
      expect(result.sentAt).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('should return summary counts', async () => {
      mockRepository.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2);

      const result = await service.getSummary();

      expect(result).toEqual({
        draft: 5,
        scheduled: 3,
        sent: 10,
        failed: 2,
      });
    });
  });

  describe('remove', () => {
    it('should remove a message', async () => {
      mockRepository.findOne.mockResolvedValue(mockMessage);
      mockRepository.remove.mockResolvedValue(mockMessage);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockMessage);
    });
  });
});
