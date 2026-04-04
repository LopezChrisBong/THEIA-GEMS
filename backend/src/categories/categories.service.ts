import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    if (createCategoryDto.parentCategoryId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentCategoryId },
      });
      if (!parentCategory) {
        throw new BadRequestException(
          `Parent category with ID ${createCategoryDto.parentCategoryId} not found`,
        );
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parentCategory', 'children'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parentCategory', 'children'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentCategoryId) {
      if (updateCategoryDto.parentCategoryId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentCategoryId },
      });
      if (!parentCategory) {
        throw new BadRequestException(
          `Parent category with ID ${updateCategoryDto.parentCategoryId} not found`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
