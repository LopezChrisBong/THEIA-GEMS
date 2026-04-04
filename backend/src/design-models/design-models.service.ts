import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignModel } from './entities/design-model.entity';
import { CreateDesignModelDto } from './dto/create-design-model.dto';
import { UpdateDesignModelDto } from './dto/update-design-model.dto';

@Injectable()
export class DesignModelsService {
  constructor(
    @InjectRepository(DesignModel)
    private readonly designModelRepository: Repository<DesignModel>,
  ) {}

  async create(createDesignModelDto: CreateDesignModelDto): Promise<DesignModel> {
    const designModel = this.designModelRepository.create(createDesignModelDto);
    return this.designModelRepository.save(designModel);
  }

  async findAll(): Promise<DesignModel[]> {
    return this.designModelRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<DesignModel> {
    const designModel = await this.designModelRepository.findOne({
      where: { id },
    });
    if (!designModel) {
      throw new NotFoundException(`DesignModel with ID ${id} not found`);
    }
    return designModel;
  }

  async update(id: number, updateDesignModelDto: UpdateDesignModelDto): Promise<DesignModel> {
    const designModel = await this.findOne(id);
    Object.assign(designModel, updateDesignModelDto);
    return this.designModelRepository.save(designModel);
  }

  async remove(id: number): Promise<void> {
    const designModel = await this.findOne(id);
    await this.designModelRepository.remove(designModel);
  }
}
