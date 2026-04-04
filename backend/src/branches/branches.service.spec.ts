import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

describe('BranchesService', () => {
  let service: BranchesService;
  let repository: Repository<Branch>;

  const mockBranch: Branch = {
    branchId: 1,
    branchName: 'Main Branch',
    branchCode: 'MAIN001',
    address: '123 Main St',
    phone: '+1234567890',
    email: 'main@example.com',
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
        BranchesService,
        {
          provide: getRepositoryToken(Branch),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    repository = module.get<Repository<Branch>>(getRepositoryToken(Branch));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBranchDto: CreateBranchDto = {
      branchName: 'Main Branch',
      branchCode: 'MAIN001',
      address: '123 Main St',
      phone: '+1234567890',
      email: 'main@example.com',
    };

    it('should create a new branch', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockBranch);
      mockRepository.save.mockResolvedValue(mockBranch);

      const result = await service.create(createBranchDto);

      expect(result).toEqual(mockBranch);
      expect(mockRepository.create).toHaveBeenCalledWith(createBranchDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if branch code already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockBranch);

      await expect(service.create(createBranchDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of branches', async () => {
      mockRepository.find.mockResolvedValue([mockBranch]);

      const result = await service.findAll();

      expect(result).toEqual([mockBranch]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a branch by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockBranch);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBranch);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { branchId: 1 },
      });
    });

    it('should throw NotFoundException if branch not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateBranchDto: UpdateBranchDto = {
      branchName: 'Updated Branch',
    };

    it('should update a branch', async () => {
      const updatedBranch = { ...mockBranch, ...updateBranchDto };
      mockRepository.findOne.mockResolvedValue(mockBranch);
      mockRepository.save.mockResolvedValue(updatedBranch);

      const result = await service.update(1, updateBranchDto);

      expect(result).toEqual(updatedBranch);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if branch not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateBranchDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a branch', async () => {
      mockRepository.findOne.mockResolvedValue(mockBranch);
      mockRepository.remove.mockResolvedValue(mockBranch);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockBranch);
    });

    it('should throw NotFoundException if branch not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
