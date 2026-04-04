import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptsService } from './receipts.service';
import { Receipt } from './entities/receipt.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let repository: Repository<Receipt>;

  const mockReceipt: Receipt = {
    id: 1,
    saleId: 1,
    sale: null,
    receiptNumber: 'RCP-20240101-0001',
    branchId: 1,
    branch: null,
    headerText: 'Welcome to Theia Gems',
    footerText: 'Thank you for shopping!',
    logoUrl: null,
    printedAt: null,
    printedBy: null,
    printer: null,
    reprintCount: 0,
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
        ReceiptsService,
        {
          provide: getRepositoryToken(Receipt),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    repository = module.get<Repository<Receipt>>(getRepositoryToken(Receipt));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a receipt', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.create.mockReturnValue(mockReceipt);
      mockRepository.save.mockResolvedValue(mockReceipt);

      const result = await service.create({
        saleId: 1,
        branchId: 1,
      });

      expect(result).toEqual(mockReceipt);
    });

    it('should throw ConflictException if receipt exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockReceipt);

      await expect(
        service.create({ saleId: 1, branchId: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a receipt', async () => {
      mockRepository.findOne.mockResolvedValue(mockReceipt);

      const result = await service.findOne(1);

      expect(result).toEqual(mockReceipt);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('print', () => {
    it('should print a receipt for first time', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockReceipt });
      mockRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.print(1, 5);

      expect(result.printedAt).toBeDefined();
      expect(result.printedBy).toBe(5);
      expect(result.reprintCount).toBe(0);
    });

    it('should increment reprint count on reprint', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockReceipt,
        printedAt: new Date(),
        reprintCount: 0,
      });
      mockRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.print(1, 5);

      expect(result.reprintCount).toBe(1);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.generateReceiptNumber();

      expect(result).toMatch(/^RCP-\d{8}-0001$/);
    });
  });

  describe('remove', () => {
    it('should remove a receipt', async () => {
      mockRepository.findOne.mockResolvedValue(mockReceipt);
      mockRepository.remove.mockResolvedValue(mockReceipt);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockReceipt);
    });
  });
});
