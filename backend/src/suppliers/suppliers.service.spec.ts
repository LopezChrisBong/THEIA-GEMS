import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierType } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: Repository<Supplier>;

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
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const createDto: CreateSupplierDto = {
        supplierName: 'Gold Supplier Co.',
        supplierType: SupplierType.EXTERNAL,
        contactPerson: 'John Doe',
        email: 'john@goldsupplier.com',
      };

      mockRepository.create.mockReturnValue(mockSupplier);
      mockRepository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('findAll', () => {
    it('should return an array of suppliers', async () => {
      mockRepository.find.mockResolvedValue([mockSupplier]);

      const result = await service.findAll();

      expect(result).toEqual([mockSupplier]);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto: UpdateSupplierDto = { supplierName: 'New Supplier Name' };
      const updatedSupplier = { ...mockSupplier, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedSupplier);
    });
  });

  describe('remove', () => {
    it('should remove a supplier', async () => {
      mockRepository.findOne.mockResolvedValue(mockSupplier);
      mockRepository.remove.mockResolvedValue(mockSupplier);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockSupplier);
    });
  });
});
