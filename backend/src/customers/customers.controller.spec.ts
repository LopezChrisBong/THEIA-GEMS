import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomer: Customer = {
    id: 1,
    customerCode: 'CUST-0001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
    dateOfBirth: new Date('1990-01-01'),
    isRepeatBuyer: false,
    totalPurchases: 0,
    purchaseCount: 0,
    registeredAt: new Date(),
    lastPurchaseAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    findByEmail: jest.fn(),
    search: jest.fn(),
    findRepeatBuyers: jest.fn(),
    findTopCustomers: jest.fn(),
    update: jest.fn(),
    recordPurchase: jest.fn(),
    remove: jest.fn(),
    generateCustomerCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      mockService.create.mockResolvedValue(mockCustomer);

      const result = await controller.create({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      mockService.findAll.mockResolvedValue([mockCustomer]);

      const result = await controller.findAll();

      expect(result).toEqual([mockCustomer]);
    });
  });

  describe('search', () => {
    it('should search customers', async () => {
      mockService.search.mockResolvedValue([mockCustomer]);

      const result = await controller.search('John');

      expect(result).toEqual([mockCustomer]);
    });
  });

  describe('findRepeatBuyers', () => {
    it('should return repeat buyers', async () => {
      mockService.findRepeatBuyers.mockResolvedValue([mockCustomer]);

      const result = await controller.findRepeatBuyers();

      expect(result).toEqual([mockCustomer]);
    });
  });

  describe('generateCustomerCode', () => {
    it('should generate customer code', async () => {
      mockService.generateCustomerCode.mockResolvedValue('CUST-0002');

      const result = await controller.generateCustomerCode();

      expect(result).toBe('CUST-0002');
    });
  });

  describe('recordPurchase', () => {
    it('should record a purchase', async () => {
      const updatedCustomer = {
        ...mockCustomer,
        totalPurchases: 100,
        purchaseCount: 1,
      };
      mockService.recordPurchase.mockResolvedValue(updatedCustomer);

      const result = await controller.recordPurchase(1, 100);

      expect(result.totalPurchases).toBe(100);
    });
  });

  describe('remove', () => {
    it('should remove a customer', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
