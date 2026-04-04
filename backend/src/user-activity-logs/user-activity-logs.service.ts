import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { CreateUserActivityLogDto } from './dto/create-user-activity-log.dto';
import { UpdateUserActivityLogDto } from './dto/update-user-activity-log.dto';

@Injectable()
export class UserActivityLogsService {
  constructor(
    @InjectRepository(UserActivityLog)
    private readonly userActivityLogRepository: Repository<UserActivityLog>,
  ) {}

  async create(
    createUserActivityLogDto: CreateUserActivityLogDto,
  ): Promise<UserActivityLog> {
    const log = this.userActivityLogRepository.create(createUserActivityLogDto);
    return this.userActivityLogRepository.save(log);
  }

  async findAll(): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserActivityLog> {
    const log = await this.userActivityLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!log) {
      throw new NotFoundException(`User activity log with ID ${id} not found`);
    }
    return log;
  }

  async findByUser(userId: number): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByActivityType(activityType: string): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { activityType },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByModule(module: string): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { module },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySession(sessionId: string): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { sessionId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIpAddress(ipAddress: string): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { ipAddress },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserLastActivity(userId: number): Promise<UserActivityLog | null> {
    return this.userActivityLogRepository.findOne({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSummaryByActivityType(): Promise<Record<string, number>> {
    const results = await this.userActivityLogRepository
      .createQueryBuilder('log')
      .select('log.activity_type', 'activityType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.activity_type')
      .getRawMany();

    const summary: Record<string, number> = {};
    for (const row of results) {
      summary[row.activityType] = parseInt(row.count, 10);
    }

    return summary;
  }

  async getSummaryByModule(): Promise<Record<string, number>> {
    const results = await this.userActivityLogRepository
      .createQueryBuilder('log')
      .select('log.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('log.module IS NOT NULL')
      .groupBy('log.module')
      .getRawMany();

    const summary: Record<string, number> = {};
    for (const row of results) {
      summary[row.module] = parseInt(row.count, 10);
    }

    return summary;
  }

  async getActiveUsers(since: Date): Promise<number> {
    const result = await this.userActivityLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.user_id)', 'count')
      .where('log.created_at >= :since', { since })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  async update(
    id: number,
    updateUserActivityLogDto: UpdateUserActivityLogDto,
  ): Promise<UserActivityLog> {
    const log = await this.findOne(id);
    Object.assign(log, updateUserActivityLogDto);
    return this.userActivityLogRepository.save(log);
  }

  async remove(id: number): Promise<void> {
    const log = await this.findOne(id);
    await this.userActivityLogRepository.remove(log);
  }
}
