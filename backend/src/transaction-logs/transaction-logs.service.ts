import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TransactionLog, TransactionAction } from './entities/transaction-log.entity';
import { CreateTransactionLogDto } from './dto/create-transaction-log.dto';
import { UpdateTransactionLogDto } from './dto/update-transaction-log.dto';
import { UserDetail } from 'src/entities';

@Injectable()
export class TransactionLogsService {
  constructor(
    @InjectRepository(TransactionLog)
    private readonly transactionLogRepository: Repository<TransactionLog>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
  ) {}

  /** Convenience method for other services to fire-and-forget a log entry. */
  log(data: {
    transactionType: string;
    transactionId: number;
    tableName: string;
    action: TransactionAction;
    performedBy?: number;
    newValues?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
  }): void {
    const entity = this.transactionLogRepository.create(data);
    this.transactionLogRepository.save(entity).catch(() => {});
  }

  private async withPerformerNames(logs: TransactionLog[]): Promise<TransactionLog[]> {
    const ids = [...new Set(logs.map((l) => Number(l.performedBy)).filter((n) => n > 0))];
    if (!ids.length) return logs;
    const details = await this.userDetailRepository
      .createQueryBuilder('ud')
      .select(['ud.userID', 'ud.fname', 'ud.lname'])
      .where('ud.userID IN (:...ids)', { ids })
      .getMany();
    const map = new Map(details.map((d) => [Number(d.userID), d]));
    for (const log of logs) {
      if (log.performedBy) {
        const d = map.get(Number(log.performedBy));
        if (d) (log as any).performerName = `${d.fname} ${d.lname}`.trim();
      }
    }
    return logs;
  }

  async create(
    createTransactionLogDto: CreateTransactionLogDto,
  ): Promise<TransactionLog> {
    const log = this.transactionLogRepository.create(createTransactionLogDto);
    return this.transactionLogRepository.save(log);
  }

  async findAll(): Promise<TransactionLog[]> {
    const logs = await this.transactionLogRepository.find({
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
    return this.withPerformerNames(logs);
  }

  async findOne(id: number): Promise<TransactionLog> {
    const log = await this.transactionLogRepository.findOne({
      where: { id },
      relations: ['performer'],
    });
    if (!log) {
      throw new NotFoundException(`Transaction log with ID ${id} not found`);
    }
    return log;
  }

  async findByTransactionType(transactionType: string): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { transactionType },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTableName(tableName: string): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { tableName },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAction(action: TransactionAction): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { action },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTransaction(
    tableName: string,
    transactionId: number,
  ): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { tableName, transactionId },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPerformer(performedBy: number): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { performedBy },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIpAddress(ipAddress: string): Promise<TransactionLog[]> {
    return this.transactionLogRepository.find({
      where: { ipAddress },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSummaryByAction(): Promise<Record<string, number>> {
    const results = await this.transactionLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const summary: Record<string, number> = {};
    for (const row of results) {
      summary[row.action] = parseInt(row.count, 10);
    }

    return summary;
  }

  async getSummaryByTable(): Promise<Record<string, number>> {
    const results = await this.transactionLogRepository
      .createQueryBuilder('log')
      .select('log.table_name', 'tableName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.table_name')
      .getRawMany();

    const summary: Record<string, number> = {};
    for (const row of results) {
      summary[row.tableName] = parseInt(row.count, 10);
    }

    return summary;
  }

  async update(
    id: number,
    updateTransactionLogDto: UpdateTransactionLogDto,
  ): Promise<TransactionLog> {
    const log = await this.findOne(id);
    Object.assign(log, updateTransactionLogDto);
    return this.transactionLogRepository.save(log);
  }

  async remove(id: number): Promise<void> {
    const log = await this.findOne(id);
    await this.transactionLogRepository.remove(log);
  }
}
