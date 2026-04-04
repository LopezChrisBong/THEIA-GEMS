import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async create(
    createSystemSettingDto: CreateSystemSettingDto,
  ): Promise<SystemSetting> {
    // Check if key already exists
    const existing = await this.systemSettingRepository.findOne({
      where: { settingKey: createSystemSettingDto.settingKey },
    });
    if (existing) {
      throw new ConflictException(
        `Setting with key '${createSystemSettingDto.settingKey}' already exists`,
      );
    }

    const setting = this.systemSettingRepository.create(createSystemSettingDto);
    return this.systemSettingRepository.save(setting);
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({
      relations: ['updater'],
      order: { settingKey: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
      where: { id },
      relations: ['updater'],
    });
    if (!setting) {
      throw new NotFoundException(`System setting with ID ${id} not found`);
    }
    return setting;
  }

  async findByKey(settingKey: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
      where: { settingKey },
      relations: ['updater'],
    });
    if (!setting) {
      throw new NotFoundException(
        `System setting with key '${settingKey}' not found`,
      );
    }
    return setting;
  }

  async getValue(settingKey: string): Promise<any> {
    const setting = await this.findByKey(settingKey);
    return this.parseValue(setting.settingValue, setting.settingType);
  }

  async getValueOrDefault(settingKey: string, defaultValue: any): Promise<any> {
    try {
      return await this.getValue(settingKey);
    } catch {
      return defaultValue;
    }
  }

  async findByType(settingType: string): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({
      where: { settingType },
      relations: ['updater'],
      order: { settingKey: 'ASC' },
    });
  }

  async setValue(
    settingKey: string,
    value: any,
    updatedBy: number,
  ): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({
      where: { settingKey },
    });

    if (!setting) {
      setting = this.systemSettingRepository.create({
        settingKey,
        settingValue: this.stringifyValue(value),
        settingType: typeof value,
        updatedBy,
      });
    } else {
      setting.settingValue = this.stringifyValue(value);
      setting.updatedBy = updatedBy;
    }

    return this.systemSettingRepository.save(setting);
  }

  async update(
    id: number,
    updateSystemSettingDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    const setting = await this.findOne(id);

    // Check for key conflict if key is being changed
    if (
      updateSystemSettingDto.settingKey &&
      updateSystemSettingDto.settingKey !== setting.settingKey
    ) {
      const existing = await this.systemSettingRepository.findOne({
        where: { settingKey: updateSystemSettingDto.settingKey },
      });
      if (existing) {
        throw new ConflictException(
          `Setting with key '${updateSystemSettingDto.settingKey}' already exists`,
        );
      }
    }

    Object.assign(setting, updateSystemSettingDto);
    return this.systemSettingRepository.save(setting);
  }

  async remove(id: number): Promise<void> {
    const setting = await this.findOne(id);
    await this.systemSettingRepository.remove(setting);
  }

  async removeByKey(settingKey: string): Promise<void> {
    const setting = await this.findByKey(settingKey);
    await this.systemSettingRepository.remove(setting);
  }

  async getAll(): Promise<Record<string, any>> {
    const settings = await this.findAll();
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.settingKey] = this.parseValue(
        setting.settingValue,
        setting.settingType,
      );
    }
    return result;
  }

  private parseValue(value: string | null, type: string | null): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private stringifyValue(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}
