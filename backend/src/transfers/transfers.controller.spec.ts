import { Test, TestingModule } from '@nestjs/testing';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { Transfer, TransferStatus } from './entities/transfer.entity';

describe('TransfersController', () => {
  let controller: TransfersController;
  let service: TransfersService;

  const mockTransfer: Transfer = {
    id: 1,
    transferNumber: 'TRF-001',
    fromBranchId: 1,
    fromBranch: null,
    toBranchId: 2,
    toBranch: null,
    status: TransferStatus.PENDING,
    requestedBy: 1,
    requester: null,
    approvedBy: null,
    approver: null,
    approvedAt: null,
    transferDate: new Date(),
    receivedDate: null,
    notes: 'Test transfer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByTransferNumber: jest.fn(),
    findByStatus: jest.fn(),
    findByFromBranch: jest.fn(),
    findByToBranch: jest.fn(),
    findPending: jest.fn(),
    update: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    markInTransit: jest.fn(),
    complete: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransfersController],
      providers: [
        {
          provide: TransfersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransfersController>(TransfersController);
    service = module.get<TransfersService>(TransfersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transfer', async () => {
      mockService.create.mockResolvedValue(mockTransfer);

      const result = await controller.create({
        transferNumber: 'TRF-001',
        fromBranchId: 1,
        toBranchId: 2,
        requestedBy: 1,
        transferDate: '2024-01-01',
      });

      expect(result).toEqual(mockTransfer);
    });
  });

  describe('findAll', () => {
    it('should return all transfers', async () => {
      mockService.findAll.mockResolvedValue([mockTransfer]);

      const result = await controller.findAll();

      expect(result).toEqual([mockTransfer]);
    });
  });

  describe('findPending', () => {
    it('should return pending transfers', async () => {
      mockService.findPending.mockResolvedValue([mockTransfer]);

      const result = await controller.findPending();

      expect(result).toEqual([mockTransfer]);
    });
  });

  describe('approve', () => {
    it('should approve a transfer', async () => {
      const approvedTransfer = { ...mockTransfer, status: TransferStatus.APPROVED };
      mockService.approve.mockResolvedValue(approvedTransfer);

      const result = await controller.approve(1, 2);

      expect(result.status).toBe(TransferStatus.APPROVED);
    });
  });

  describe('complete', () => {
    it('should complete a transfer', async () => {
      const completedTransfer = { ...mockTransfer, status: TransferStatus.COMPLETED };
      mockService.complete.mockResolvedValue(completedTransfer);

      const result = await controller.complete(1);

      expect(result.status).toBe(TransferStatus.COMPLETED);
    });
  });

  describe('remove', () => {
    it('should remove a transfer', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
