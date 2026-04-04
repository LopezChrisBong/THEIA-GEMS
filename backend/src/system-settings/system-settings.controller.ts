import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSetting } from './entities/system-setting.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('System Settings')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Post()
  create(
    @Body() createSystemSettingDto: CreateSystemSettingDto,
  ): Promise<SystemSetting> {
    return this.systemSettingsService.create(createSystemSettingDto);
  }

  @Get()
  findAll(): Promise<SystemSetting[]> {
    return this.systemSettingsService.findAll();
  }

  @Get('all')
  getAll(): Promise<Record<string, any>> {
    return this.systemSettingsService.getAll();
  }

  @Get('type/:settingType')
  findByType(@Param('settingType') settingType: string): Promise<SystemSetting[]> {
    return this.systemSettingsService.findByType(settingType);
  }

  @Get('key/:settingKey')
  findByKey(@Param('settingKey') settingKey: string): Promise<SystemSetting> {
    return this.systemSettingsService.findByKey(settingKey);
  }

  @Get('value/:settingKey')
  getValue(@Param('settingKey') settingKey: string): Promise<any> {
    return this.systemSettingsService.getValue(settingKey);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SystemSetting> {
    return this.systemSettingsService.findOne(id);
  }

  @Post('set/:settingKey')
  setValue(
    @Param('settingKey') settingKey: string,
    @Body('value') value: any,
    @Body('updatedBy') updatedBy: number,
  ): Promise<SystemSetting> {
    return this.systemSettingsService.setValue(settingKey, value, updatedBy);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSystemSettingDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    return this.systemSettingsService.update(id, updateSystemSettingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.systemSettingsService.remove(id);
  }

  @Delete('key/:settingKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByKey(@Param('settingKey') settingKey: string): Promise<void> {
    return this.systemSettingsService.removeByKey(settingKey);
  }
}
