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
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { Transfer, TransferStatus } from './entities/transfer.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Transfers')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  create(@Body() createTransferDto: CreateTransferDto): Promise<Transfer> {
    return this.transfersService.create(createTransferDto);
  }

  @Get()
  findAll(): Promise<Transfer[]> {
    return this.transfersService.findAll();
  }

  @Get('pending')
  findPending(): Promise<Transfer[]> {
    return this.transfersService.findPending();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: TransferStatus): Promise<Transfer[]> {
    return this.transfersService.findByStatus(status);
  }

  @Get('from-branch/:branchId')
  findByFromBranch(@Param('branchId', ParseIntPipe) branchId: number): Promise<Transfer[]> {
    return this.transfersService.findByFromBranch(branchId);
  }

  @Get('to-branch/:branchId')
  findByToBranch(@Param('branchId', ParseIntPipe) branchId: number): Promise<Transfer[]> {
    return this.transfersService.findByToBranch(branchId);
  }

  @Get('number/:transferNumber')
  findByTransferNumber(@Param('transferNumber') transferNumber: string): Promise<Transfer> {
    return this.transfersService.findByTransferNumber(transferNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Transfer> {
    return this.transfersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransferDto: UpdateTransferDto,
  ): Promise<Transfer> {
    return this.transfersService.update(id, updateTransferDto);
  }

  @Patch(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body('approvedBy') approvedBy: number,
  ): Promise<Transfer> {
    return this.transfersService.approve(id, approvedBy);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('approvedBy') approvedBy: number,
  ): Promise<Transfer> {
    return this.transfersService.reject(id, approvedBy);
  }

  @Patch(':id/in-transit')
  markInTransit(@Param('id', ParseIntPipe) id: number): Promise<Transfer> {
    return this.transfersService.markInTransit(id);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number): Promise<Transfer> {
    return this.transfersService.complete(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.transfersService.remove(id);
  }
}
