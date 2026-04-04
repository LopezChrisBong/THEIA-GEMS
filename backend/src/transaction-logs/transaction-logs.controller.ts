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
import { TransactionLogsService } from './transaction-logs.service';
import { CreateTransactionLogDto } from './dto/create-transaction-log.dto';
import { UpdateTransactionLogDto } from './dto/update-transaction-log.dto';
import { TransactionLog, TransactionAction } from './entities/transaction-log.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Transaction Logs')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('transaction-logs')
export class TransactionLogsController {
  constructor(
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  @Post()
  create(
    @Body() createTransactionLogDto: CreateTransactionLogDto,
  ): Promise<TransactionLog> {
    return this.transactionLogsService.create(createTransactionLogDto);
  }

  @Get()
  findAll(): Promise<TransactionLog[]> {
    return this.transactionLogsService.findAll();
  }

  @Get('summary/action')
  getSummaryByAction(): Promise<Record<string, number>> {
    return this.transactionLogsService.getSummaryByAction();
  }

  @Get('summary/table')
  getSummaryByTable(): Promise<Record<string, number>> {
    return this.transactionLogsService.getSummaryByTable();
  }

  @Get('type/:transactionType')
  findByTransactionType(
    @Param('transactionType') transactionType: string,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByTransactionType(transactionType);
  }

  @Get('table/:tableName')
  findByTableName(
    @Param('tableName') tableName: string,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByTableName(tableName);
  }

  @Get('action/:action')
  findByAction(
    @Param('action') action: TransactionAction,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByAction(action);
  }

  @Get('transaction/:tableName/:transactionId')
  findByTransaction(
    @Param('tableName') tableName: string,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByTransaction(tableName, transactionId);
  }

  @Get('performer/:performedBy')
  findByPerformer(
    @Param('performedBy', ParseIntPipe) performedBy: number,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByPerformer(performedBy);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('ip/:ipAddress')
  findByIpAddress(
    @Param('ipAddress') ipAddress: string,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByIpAddress(ipAddress);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TransactionLog> {
    return this.transactionLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionLogDto: UpdateTransactionLogDto,
  ): Promise<TransactionLog> {
    return this.transactionLogsService.update(id, updateTransactionLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.transactionLogsService.remove(id);
  }
}
