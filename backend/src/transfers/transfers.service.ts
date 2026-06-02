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
import { TransferItem } from '../transfer-items/entities/transfer-item.entity';
import { JewelryItem, JewelryItemStatus } from '../jewelry-items/entities/jewelry-item.entity';
import { InventoryLog, ActionType } from '../inventory-logs/entities/inventory-log.entity';
import { UserDetail } from '../user-details/entities/user-detail.entity';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { TransactionAction } from '../transaction-logs/entities/transaction-log.entity';

const ALL_RELATIONS = ['fromBranch', 'toBranch', 'requester', 'approver', 'transferrer', 'receiver'];

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(TransferItem)
    private readonly transferItemRepository: Repository<TransferItem>,
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
    @InjectRepository(InventoryLog)
    private readonly inventoryLogRepository: Repository<InventoryLog>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
    private readonly transactionLogsService: TransactionLogsService,
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
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ALL_RELATIONS,
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    return transfer;
  }

  async findByTransferNumber(transferNumber: string): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { transferNumber },
      relations: ALL_RELATIONS,
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferNumber} not found`);
    }

    return transfer;
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { status },
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findByFromBranch(branchId: number): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { fromBranchId: branchId },
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findByToBranch(branchId: number): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { toBranchId: branchId },
      relations: ALL_RELATIONS,
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

    const saved = await this.transferRepository.save(transfer);
    this.transactionLogsService.log({
      transactionType: 'Transfer Approved',
      transactionId: saved.id,
      tableName: 'transfers',
      action: TransactionAction.UPDATE,
      performedBy: approvedBy,
      newValues: { transferNumber: saved.transferNumber, status: saved.status },
    });
    return saved;
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

  /** Mark as dispatched (in transit). Records who physically sent the items. */
  async markInTransit(id: number, transferredBy?: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException('Only approved transfers can be marked in transit');
    }

    // Branch validation: user must belong to the source branch (or have no branch = superadmin/owner)
    if (transferredBy) {
      const userDetail = await this.userDetailRepository.findOne({ where: { userID: transferredBy } });
      if (userDetail?.branchId && userDetail.branchId !== transfer.fromBranchId) {
        throw new BadRequestException(
          `Only users assigned to the source branch (${transfer.fromBranch?.branchName ?? transfer.fromBranchId}) can dispatch this transfer`,
        );
      }
      transfer.transferredBy = transferredBy;
    }

    transfer.status = TransferStatus.IN_TRANSIT;
    transfer.transferredAt = new Date();

    const saved = await this.transferRepository.save(transfer);
    this.transactionLogsService.log({
      transactionType: 'Transfer Dispatched',
      transactionId: saved.id,
      tableName: 'transfers',
      action: TransactionAction.UPDATE,
      performedBy: transferredBy,
      newValues: { transferNumber: saved.transferNumber, status: saved.status, fromBranchId: saved.fromBranchId, toBranchId: saved.toBranchId },
    });
    return saved;
  }

  /** Receive a transfer: records who received, moves items to destination branch, creates inventory logs. */
  async receive(id: number, receivedBy: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('Only in-transit transfers can be received');
    }

    // Branch validation: receiver must belong to the destination branch (or have no branch = superadmin/owner)
    const userDetail = await this.userDetailRepository.findOne({ where: { userID: receivedBy } });
    if (userDetail?.branchId && userDetail.branchId !== transfer.toBranchId) {
      throw new BadRequestException(
        `Only users assigned to the destination branch (${transfer.toBranch?.branchName ?? transfer.toBranchId}) can receive this transfer`,
      );
    }

    // Load all items for this transfer with their jewelry item relations
    const transferItems = await this.transferItemRepository.find({
      where: { transferId: id },
      relations: ['jewelryItem'],
    });

    for (const item of transferItems) {
      const jewelryItem = item.jewelryItem;
      if (!jewelryItem) continue;

      const previousStatus = jewelryItem.status;

      // Log TRANSFER_OUT from source branch
      await this.inventoryLogRepository.save(
        this.inventoryLogRepository.create({
          jewelryItemId: jewelryItem.id,
          branchId: transfer.fromBranchId,
          actionType: ActionType.TRANSFER_OUT,
          previousStatus: previousStatus,
          newStatus: JewelryItemStatus.TRANSFERRED,
          referenceId: transfer.id,
          referenceType: 'transfer',
          performedBy: receivedBy,
        }),
      );

      // Move item to destination branch and mark as IN_STOCK
      jewelryItem.branchId = transfer.toBranchId;
      jewelryItem.status = JewelryItemStatus.IN_STOCK;
      await this.jewelryItemRepository.save(jewelryItem);

      // Log TRANSFER_IN at destination branch
      await this.inventoryLogRepository.save(
        this.inventoryLogRepository.create({
          jewelryItemId: jewelryItem.id,
          branchId: transfer.toBranchId,
          actionType: ActionType.TRANSFER_IN,
          previousStatus: JewelryItemStatus.TRANSFERRED,
          newStatus: JewelryItemStatus.IN_STOCK,
          referenceId: transfer.id,
          referenceType: 'transfer',
          performedBy: receivedBy,
        }),
      );
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.receivedBy = receivedBy;
    transfer.receivedAt = new Date();
    transfer.receivedDate = new Date();

    const saved = await this.transferRepository.save(transfer);
    this.transactionLogsService.log({
      transactionType: 'Transfer Received',
      transactionId: saved.id,
      tableName: 'transfers',
      action: TransactionAction.UPDATE,
      performedBy: receivedBy,
      newValues: { transferNumber: saved.transferNumber, status: saved.status, itemCount: transferItems.length },
    });
    return saved;
  }

  /** Legacy complete — kept for backward compat; delegates to receive with the requester as performer. */
  async complete(id: number): Promise<Transfer> {
    const transfer = await this.findOne(id);
    return this.receive(id, transfer.requestedBy);
  }

  async remove(id: number): Promise<void> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be deleted');
    }

    await this.transferRepository.remove(transfer);
  }
}
