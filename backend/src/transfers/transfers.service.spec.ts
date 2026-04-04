import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransfersService } from './transfers.service';
import { Transfer, TransferStatus } from './entities/transfer.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('TransfersService', () => {
  let service: TransfersService;
  let repository: Repository<Transfer>;

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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        {
          provide: getRepositoryToken(Transfer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    repository = module.get<Repository<Transfer>>(getRepositoryToken(Transfer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transfer', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockTransfer);
      mockRepository.save.mockResolvedValue(mockTransfer);

      const result = await service.create({
        transferNumber: 'TRF-001',
        fromBranchId: 1,
        toBranchId: 2,
        requestedBy: 1,
        transferDate: '2024-01-01',
      });

      expect(result).toEqual(mockTransfer);
    });

    it('should throw ConflictException if transfer number exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransfer);

      await expect(
        service.create({
          transferNumber: 'TRF-001',
          fromBranchId: 1,
          toBranchId: 2,
          requestedBy: 1,
          transferDate: '2024-01-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if same branch', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          transferNumber: 'TRF-002',
          fromBranchId: 1,
          toBranchId: 1,
          requestedBy: 1,
          transferDate: '2024-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve a pending transfer', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockTransfer });
      mockRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.approve(1, 2);

      expect(result.status).toBe(TransferStatus.APPROVED);
      expect(result.approvedBy).toBe(2);
    });

    it('should throw if not pending', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockTransfer,
        status: TransferStatus.APPROVED,
      });

      await expect(service.approve(1, 2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete an in-transit transfer', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockTransfer,
        status: TransferStatus.IN_TRANSIT,
      });
      mockRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.complete(1);

      expect(result.status).toBe(TransferStatus.COMPLETED);
    });
  });
});
