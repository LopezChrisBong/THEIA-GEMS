import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer, TransferStatus } from './entities/transfer.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
  ) {}

  async create(createTransferDto: CreateTransferDto): Promise<Transfer> {
    const existing = await this.transferRepository.findOne({
      where: { transferNumber: createTransferDto.transferNumber },
    });

    if (existing) {
      throw new ConflictException('Transfer number already exists');
    }

    if (createTransferDto.fromBranchId === createTransferDto.toBranchId) {
      throw new BadRequestException('Cannot transfer to the same branch');
    }

    const transfer = this.transferRepository.create(createTransferDto);
    return this.transferRepository.save(transfer);
  }

  async findAll(): Promise<Transfer[]> {
    return this.transferRepository.find({
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    return transfer;
  }

  async findByTransferNumber(transferNumber: string): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { transferNumber },
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferNumber} not found`);
    }

    return transfer;
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { status },
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByFromBranch(branchId: number): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { fromBranchId: branchId },
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByToBranch(branchId: number): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { toBranchId: branchId },
      relations: ['fromBranch', 'toBranch', 'requester', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Transfer[]> {
    return this.findByStatus(TransferStatus.PENDING);
  }

  async update(id: number, updateTransferDto: UpdateTransferDto): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (updateTransferDto.transferNumber && updateTransferDto.transferNumber !== transfer.transferNumber) {
      const existing = await this.transferRepository.findOne({
        where: { transferNumber: updateTransferDto.transferNumber },
      });

      if (existing) {
        throw new ConflictException('Transfer number already exists');
      }
    }

    Object.assign(transfer, updateTransferDto);
    return this.transferRepository.save(transfer);
  }

  async approve(id: number, approvedBy: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be approved');
    }

    transfer.status = TransferStatus.APPROVED;
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date();

    return this.transferRepository.save(transfer);
  }

  async reject(id: number, approvedBy: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be rejected');
    }

    transfer.status = TransferStatus.REJECTED;
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date();

    return this.transferRepository.save(transfer);
  }

  async markInTransit(id: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException('Only approved transfers can be marked in transit');
    }

    transfer.status = TransferStatus.IN_TRANSIT;
    return this.transferRepository.save(transfer);
  }

  async complete(id: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('Only in-transit transfers can be completed');
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.receivedDate = new Date();

    return this.transferRepository.save(transfer);
  }

  async remove(id: number): Promise<void> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be deleted');
    }

    await this.transferRepository.remove(transfer);
  }
}
