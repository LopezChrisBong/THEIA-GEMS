import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockCategory: Category = {
    id: 1,
    categoryName: 'Electronics',
    parentCategoryId: null,
    parentCategory: null,
    children: [],
    description: 'Electronic devices and accessories',
    createdAt: new Date(),
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
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      categoryName: 'Electronics',
      description: 'Electronic devices and accessories',
    };

    it('should create a new category', async () => {
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(mockRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if parent category not found', async () => {
      const dtoWithParent: CreateCategoryDto = {
        categoryName: 'Phones',
        parentCategoryId: 999,
      };
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      mockRepository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toEqual([mockCategory]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['parentCategory', 'children'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['parentCategory', 'children'],
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateCategoryDto = {
      categoryName: 'Updated Electronics',
    };

    it('should update a category', async () => {
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(1, updateCategoryDto);

      expect(result).toEqual(updatedCategory);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateCategoryDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if category is its own parent', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      await expect(
        service.update(1, { parentCategoryId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.remove.mockResolvedValue(mockCategory);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
