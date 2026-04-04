import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferItemsService } from './transfer-items.service';
import { TransferItem } from './entities/transfer-item.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransferItemsService', () => {
  let service: TransferItemsService;
  let repository: Repository<TransferItem>;

  const mockTransferItem: TransferItem = {
    id: 1,
    transferId: 1,
    transfer: null,
    productId: 1,
    product: null,
    variantId: null,
    variant: null,
    serialNumberId: null,
    serialNumber: null,
    quantity: 10,
    receivedQuantity: 0,
    notes: 'Test item',
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferItemsService,
        {
          provide: getRepositoryToken(TransferItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransferItemsService>(TransferItemsService);
    repository = module.get<Repository<TransferItem>>(getRepositoryToken(TransferItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transfer item', async () => {
      mockRepository.create.mockReturnValue(mockTransferItem);
      mockRepository.save.mockResolvedValue(mockTransferItem);

      const result = await service.create({
        transferId: 1,
        productId: 1,
        quantity: 10,
      });

      expect(result).toEqual(mockTransferItem);
    });
  });

  describe('findOne', () => {
    it('should return a transfer item', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransferItem);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTransferItem);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReceivedQuantity', () => {
    it('should update received quantity', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockTransferItem });
      mockRepository.save.mockImplementation((item) => Promise.resolve(item));

      const result = await service.updateReceivedQuantity(1, 5);

      expect(result.receivedQuantity).toBe(5);
    });

    it('should throw if received > quantity', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockTransferItem });

      await expect(service.updateReceivedQuantity(1, 20)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransferSummary', () => {
    it('should return correct summary', async () => {
      mockRepository.find.mockResolvedValue([
        { ...mockTransferItem, quantity: 10, receivedQuantity: 5 },
        { ...mockTransferItem, id: 2, quantity: 20, receivedQuantity: 20 },
      ]);

      const result = await service.getTransferSummary(1);

      expect(result.totalItems).toBe(2);
      expect(result.totalQuantity).toBe(30);
      expect(result.totalReceived).toBe(25);
      expect(result.isFullyReceived).toBe(false);
    });
  });
});
