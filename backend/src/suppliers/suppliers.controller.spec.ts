import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierType } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSupplier: Supplier = {
    id: 1,
    supplierName: 'Gold Supplier Co.',
    supplierType: SupplierType.EXTERNAL,
    contactPerson: 'John Doe',
    phone: '+1234567890',
    email: 'john@goldsupplier.com',
    address: '123 Gold Street',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuppliersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const createDto: CreateSupplierDto = {
        supplierName: 'Gold Supplier Co.',
        supplierType: SupplierType.EXTERNAL,
      };

      mockSuppliersService.create.mockResolvedValue(mockSupplier);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('findAll', () => {
    it('should return an array of suppliers', async () => {
      mockSuppliersService.findAll.mockResolvedValue([mockSupplier]);

      const result = await controller.findAll();

      expect(result).toEqual([mockSupplier]);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto: UpdateSupplierDto = { supplierName: 'New Supplier Name' };
      const updatedSupplier = { ...mockSupplier, ...updateDto };

      mockSuppliersService.update.mockResolvedValue(updatedSupplier);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedSupplier);
    });
  });

  describe('remove', () => {
    it('should remove a supplier', async () => {
      mockSuppliersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
