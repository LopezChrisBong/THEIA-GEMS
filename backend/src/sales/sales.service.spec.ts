import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale, PaymentStatus, SaleType } from './entities/sale.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let repository: Repository<Sale>;

  const mockSale: Sale = {
    id: 1,
    saleNumber: 'SL-20240101-0001',
    branchId: 1,
    branch: null,
    customerId: 1,
    customer: null,
    cashierId: 1,
    cashier: null,
    saleDate: new Date(),
    subtotal: 100,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 100,
    amountPaid: 100,
    changeAmount: 0,
    paymentStatus: PaymentStatus.PAID,
    saleType: SaleType.REGULAR,
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
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    repository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockSale);
      mockRepository.save.mockResolvedValue(mockSale);

      const result = await service.create({
        saleNumber: 'SL-20240101-0001',
        branchId: 1,
        cashierId: 1,
        subtotal: 100,
        totalAmount: 100,
      });

      expect(result).toEqual(mockSale);
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update status', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockSale, amountPaid: 0, paymentStatus: PaymentStatus.PARTIAL });
      mockRepository.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.recordPayment(1, 100);

      expect(result.amountPaid).toBe(100);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });
});
