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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserActivityLogsService } from './user-activity-logs.service';
import { CreateUserActivityLogDto } from './dto/create-user-activity-log.dto';
import { UpdateUserActivityLogDto } from './dto/update-user-activity-log.dto';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('User Activity Logs')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('user-activity-logs')
export class UserActivityLogsController {
  constructor(
    private readonly userActivityLogsService: UserActivityLogsService,
  ) {}

  @Post()
  create(
    @Body() createUserActivityLogDto: CreateUserActivityLogDto,
  ): Promise<UserActivityLog> {
    return this.userActivityLogsService.create(createUserActivityLogDto);
  }

  @Get()
  findAll(): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findAll();
  }

  @Get('summary/activity-type')
  getSummaryByActivityType(): Promise<Record<string, number>> {
    return this.userActivityLogsService.getSummaryByActivityType();
  }

  @Get('summary/module')
  getSummaryByModule(): Promise<Record<string, number>> {
    return this.userActivityLogsService.getSummaryByModule();
  }

  @Get('active-users')
  getActiveUsers(@Query('since') since: string): Promise<number> {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.userActivityLogsService.getActiveUsers(sinceDate);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByUser(userId);
  }

  @Get('user/:userId/last')
  getUserLastActivity(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserActivityLog | null> {
    return this.userActivityLogsService.getUserLastActivity(userId);
  }

  @Get('activity-type/:activityType')
  findByActivityType(
    @Param('activityType') activityType: string,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByActivityType(activityType);
  }

  @Get('module/:module')
  findByModule(@Param('module') module: string): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByModule(module);
  }

  @Get('session/:sessionId')
  findBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findBySession(sessionId);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('ip/:ipAddress')
  findByIpAddress(
    @Param('ipAddress') ipAddress: string,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByIpAddress(ipAddress);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserActivityLog> {
    return this.userActivityLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserActivityLogDto: UpdateUserActivityLogDto,
  ): Promise<UserActivityLog> {
    return this.userActivityLogsService.update(id, updateUserActivityLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userActivityLogsService.remove(id);
  }
}
