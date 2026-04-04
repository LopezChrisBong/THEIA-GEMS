import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { SystemSetting } from './entities/system-setting.entity';

describe('SystemSettingsController', () => {
  let controller: SystemSettingsController;
  let service: SystemSettingsService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByKey: jest.fn(),
    findByType: jest.fn(),
    getValue: jest.fn(),
    setValue: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeByKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemSettingsController],
      providers: [{ provide: SystemSettingsService, useValue: mockService }],
    }).compile();

    controller = module.get<SystemSettingsController>(SystemSettingsController);
    service = module.get<SystemSettingsService>(SystemSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a setting', async () => {
      mockService.create.mockResolvedValue(mockSetting);

      const result = await controller.create({
        settingKey: 'store_name',
        settingValue: 'Theia Gems',
      });

      expect(result).toEqual(mockSetting);
    });
  });

  describe('findByKey', () => {
    it('should return setting by key', async () => {
      mockService.findByKey.mockResolvedValue(mockSetting);

      const result = await controller.findByKey('store_name');

      expect(result).toEqual(mockSetting);
    });
  });

  describe('getValue', () => {
    it('should return value by key', async () => {
      mockService.getValue.mockResolvedValue('Theia Gems');

      const result = await controller.getValue('store_name');

      expect(result).toBe('Theia Gems');
    });
  });

  describe('setValue', () => {
    it('should set a value', async () => {
      mockService.setValue.mockResolvedValue(mockSetting);

      const result = await controller.setValue('store_name', 'New Name', 1);

      expect(result).toEqual(mockSetting);
    });
  });

  describe('getAll', () => {
    it('should return all settings as key-value', async () => {
      mockService.getAll.mockResolvedValue({ store_name: 'Theia Gems' });

      const result = await controller.getAll();

      expect(result.store_name).toBe('Theia Gems');
    });
  });

  describe('remove', () => {
    it('should remove a setting', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
