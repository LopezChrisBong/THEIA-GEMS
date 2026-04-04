import { Test, TestingModule } from '@nestjs/testing';
import { TransferItemsController } from './transfer-items.controller';
import { TransferItemsService } from './transfer-items.service';
import { TransferItem } from './entities/transfer-item.entity';

describe('TransferItemsController', () => {
  let controller: TransferItemsController;
  let service: TransferItemsService;

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

  const mockService = {
    create: jest.fn(),
    createBulk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByTransfer: jest.fn(),
    findByProduct: jest.fn(),
    update: jest.fn(),
    updateReceivedQuantity: jest.fn(),
    markFullyReceived: jest.fn(),
    remove: jest.fn(),
    getTransferSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferItemsController],
      providers: [
        {
          provide: TransferItemsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransferItemsController>(TransferItemsController);
    service = module.get<TransferItemsService>(TransferItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transfer item', async () => {
      mockService.create.mockResolvedValue(mockTransferItem);

      const result = await controller.create({
        transferId: 1,
        productId: 1,
        quantity: 10,
      });

      expect(result).toEqual(mockTransferItem);
    });
  });

  describe('findByTransfer', () => {
    it('should return items for a transfer', async () => {
      mockService.findByTransfer.mockResolvedValue([mockTransferItem]);

      const result = await controller.findByTransfer(1);

      expect(result).toEqual([mockTransferItem]);
    });
  });

  describe('getTransferSummary', () => {
    it('should return transfer summary', async () => {
      mockService.getTransferSummary.mockResolvedValue({
        totalItems: 2,
        totalQuantity: 30,
        totalReceived: 25,
        isFullyReceived: false,
      });

      const result = await controller.getTransferSummary(1);

      expect(result.totalItems).toBe(2);
      expect(result.isFullyReceived).toBe(false);
    });
  });

  describe('markFullyReceived', () => {
    it('should mark item as fully received', async () => {
      const receivedItem = { ...mockTransferItem, receivedQuantity: 10 };
      mockService.markFullyReceived.mockResolvedValue(receivedItem);

      const result = await controller.markFullyReceived(1);

      expect(result.receivedQuantity).toBe(10);
    });
  });

  describe('remove', () => {
    it('should remove a transfer item', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
