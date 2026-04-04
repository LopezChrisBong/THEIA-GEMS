import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

describe('BranchesController', () => {
  let controller: BranchesController;
  let service: BranchesService;

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

  const mockBranchesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
    service = module.get<BranchesService>(BranchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new branch', async () => {
      const createBranchDto: CreateBranchDto = {
        branchName: 'Main Branch',
        branchCode: 'MAIN001',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'main@example.com',
      };

      mockBranchesService.create.mockResolvedValue(mockBranch);

      const result = await controller.create(createBranchDto);

      expect(result).toEqual(mockBranch);
      expect(service.create).toHaveBeenCalledWith(createBranchDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of branches', async () => {
      mockBranchesService.findAll.mockResolvedValue([mockBranch]);

      const result = await controller.findAll();

      expect(result).toEqual([mockBranch]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a branch by id', async () => {
      mockBranchesService.findOne.mockResolvedValue(mockBranch);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockBranch);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a branch', async () => {
      const updateBranchDto: UpdateBranchDto = {
        branchName: 'Updated Branch',
      };
      const updatedBranch = { ...mockBranch, ...updateBranchDto };

      mockBranchesService.update.mockResolvedValue(updatedBranch);

      const result = await controller.update(1, updateBranchDto);

      expect(result).toEqual(updatedBranch);
      expect(service.update).toHaveBeenCalledWith(1, updateBranchDto);
    });
  });

  describe('remove', () => {
    it('should remove a branch', async () => {
      mockBranchesService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
