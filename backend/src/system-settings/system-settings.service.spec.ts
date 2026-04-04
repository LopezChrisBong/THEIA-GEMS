import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingsService } from './system-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let repository: Repository<SystemSetting>;

  const mockSetting: SystemSetting = {
    id: 1,
    settingKey: 'store_name',
    settingValue: 'Theia Gems',
    settingType: 'string',
    description: 'Store name displayed in receipts',
    updatedBy: 1,
    updater: null,
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
        SystemSettingsService,
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SystemSettingsService>(SystemSettingsService);
    repository = module.get<Repository<SystemSetting>>(
      getRepositoryToken(SystemSetting),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a system setting', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockSetting);
      mockRepository.save.mockResolvedValue(mockSetting);

      const result = await service.create({
        settingKey: 'store_name',
        settingValue: 'Theia Gems',
      });

      expect(result).toEqual(mockSetting);
    });

    it('should throw ConflictException if key exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      await expect(
        service.create({ settingKey: 'store_name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a setting', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSetting);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByKey', () => {
    it('should return setting by key', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findByKey('store_name');

      expect(result).toEqual(mockSetting);
    });
  });

  describe('getValue', () => {
    it('should return parsed string value', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.getValue('store_name');

      expect(result).toBe('Theia Gems');
    });

    it('should return parsed number value', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockSetting,
        settingValue: '100',
        settingType: 'number',
      });

      const result = await service.getValue('tax_rate');

      expect(result).toBe(100);
    });

    it('should return parsed boolean value', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockSetting,
        settingValue: 'true',
        settingType: 'boolean',
      });

      const result = await service.getValue('enable_tax');

      expect(result).toBe(true);
    });
  });

  describe('setValue', () => {
    it('should create new setting if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockSetting);
      mockRepository.save.mockResolvedValue(mockSetting);

      const result = await service.setValue('store_name', 'Theia Gems', 1);

      expect(result).toEqual(mockSetting);
    });

    it('should update existing setting', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockSetting });
      mockRepository.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.setValue('store_name', 'New Name', 1);

      expect(result.settingValue).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should remove a setting', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);
      mockRepository.remove.mockResolvedValue(mockSetting);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockSetting);
    });
  });
});
