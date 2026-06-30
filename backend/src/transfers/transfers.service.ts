import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transfer, TransferStatus } from './entities/transfer.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferItem } from '../transfer-items/entities/transfer-item.entity';
import { JewelryItem, JewelryItemStatus } from '../jewelry-items/entities/jewelry-item.entity';
import { InventoryLog, ActionType } from '../inventory-logs/entities/inventory-log.entity';
import { UserDetail } from '../user-details/entities/user-detail.entity';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { TransactionAction } from '../transaction-logs/entities/transaction-log.entity';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { Users } from '../auth/entities/auth.entity';

const ALL_RELATIONS = ['fromBranch', 'toBranch', 'requester', 'approver', 'transferrer', 'receiver'];

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

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
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * The `Users` entity only holds login credentials (email/role) — display names
   * (fname/lname) live in `UserDetail`. Merge them onto the loaded requester/
   * approver/transferrer/receiver relations so the frontend can show real names.
   */
  private async attachUserNames(transfers: Transfer[]): Promise<Transfer[]> {
    const userIds = new Set<number>();
    for (const t of transfers) {
      if (t.requestedBy) userIds.add(t.requestedBy);
      if (t.approvedBy) userIds.add(t.approvedBy);
      if (t.transferredBy) userIds.add(t.transferredBy);
      if (t.receivedBy) userIds.add(t.receivedBy);
    }
    if (userIds.size === 0) return transfers;

    const details = await this.userDetailRepository.find({ where: { userID: In([...userIds]) } });
    const detailMap = new Map(details.map((d) => [d.userID, d]));

    const merge = (user?: Users) => {
      if (!user) return;
      const detail = detailMap.get(user.id);
      (user as any).fname = detail?.fname ?? null;
      (user as any).lname = detail?.lname ?? null;
    };

    for (const t of transfers) {
      merge(t.requester);
      merge(t.approver);
      merge(t.transferrer);
      merge(t.receiver);
    }
    return transfers;
  }

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
    const saved = await this.transferRepository.save(transfer);

    // Load branch info for notification
    const full = await this.findOne(saved.id);
    const fromBranch = full.fromBranch?.branchName || `Branch ${createTransferDto.fromBranchId}`;
    const toBranch = full.toBranch?.branchName || `Branch ${createTransferDto.toBranchId}`;
    const itemCount = createTransferDto['items']?.length ?? 0;

    const notifyParams = (recipientName: string, to: string) =>
      this.mailService.sendTransferNotification({
        to, recipientName, transferNumber: saved.transferNumber,
        fromBranch, toBranch, itemCount, notes: createTransferDto.notes,
      }).catch((e) => this.logger.error('Transfer email failed', e));

    // Notify users at the receiving branch
    const branchStaff = await this.userDetailRepository.find({ where: { branchId: createTransferDto.toBranchId } });
    for (const ud of branchStaff) {
      if (ud.email) notifyParams(`${ud.fname} ${ud.lname}`, ud.email);
      if (ud.mobile_no) {
        const sms = `[Theia Gems] New transfer ${saved.transferNumber} from ${fromBranch} to ${toBranch} (${itemCount} items) is incoming. Please prepare to receive.`;
        this.smsService.sendSmsSemaphore({ recipient: ud.mobile_no, message: sms })
          .catch((e) => this.logger.error('Transfer SMS failed', e));
      }
    }

    // Always notify the owner
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerPhone = process.env.OWNER_PHONE;
    if (ownerEmail) notifyParams("Ma'am Tin", ownerEmail);
    if (ownerPhone) {
      const sms = `[Theia Gems] Transfer ${saved.transferNumber}: ${fromBranch} → ${toBranch} (${itemCount} items) created.`;
      this.smsService.sendSmsSemaphore({ recipient: ownerPhone, message: sms })
        .catch((e) => this.logger.error('Owner transfer SMS failed', e));
    }

    return saved;
  }

  async findAll(): Promise<Transfer[]> {
    const transfers = await this.transferRepository.find({
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return this.attachUserNames(transfers);
  }

  async findOne(id: number): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ALL_RELATIONS,
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    await this.attachUserNames([transfer]);
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

    await this.attachUserNames([transfer]);
    return transfer;
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    const transfers = await this.transferRepository.find({
      where: { status },
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return this.attachUserNames(transfers);
  }

  async findByFromBranch(branchId: number): Promise<Transfer[]> {
    const transfers = await this.transferRepository.find({
      where: { fromBranchId: branchId },
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return this.attachUserNames(transfers);
  }

  async findByToBranch(branchId: number): Promise<Transfer[]> {
    const transfers = await this.transferRepository.find({
      where: { toBranchId: branchId },
      relations: ALL_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return this.attachUserNames(transfers);
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
