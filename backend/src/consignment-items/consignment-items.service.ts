import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentItem, ConsignmentStatus } from './entities/consignment-item.entity';
import { CreateConsignmentItemDto } from './dto/create-consignment-item.dto';
import { UpdateConsignmentItemDto } from './dto/update-consignment-item.dto';
import { JewelryItem, JewelryItemStatus } from '../jewelry-items/entities/jewelry-item.entity';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

const CONSIGNMENT_TO_JEWELRY_STATUS: Record<ConsignmentStatus, JewelryItemStatus> = {
  [ConsignmentStatus.ACTIVE]: JewelryItemStatus.CONSIGNMENT,
  [ConsignmentStatus.SOLD]: JewelryItemStatus.SOLD,
  [ConsignmentStatus.RETURNED]: JewelryItemStatus.PULLED_OUT,
  [ConsignmentStatus.PULLOUT]: JewelryItemStatus.PULLED_OUT,
  [ConsignmentStatus.BUYOUT]: JewelryItemStatus.IN_STOCK,
};

@Injectable()
export class ConsignmentItemsService {
  private readonly logger = new Logger(ConsignmentItemsService.name);

  constructor(
    @InjectRepository(ConsignmentItem)
    private readonly consignmentItemRepository: Repository<ConsignmentItem>,
    @InjectRepository(JewelryItem)
    private readonly jewelryItemRepository: Repository<JewelryItem>,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  /** Keeps the linked jewelry item's status in step with the consignment lifecycle (mirrors Transfers' pattern). */
  private async syncJewelryItemStatus(jewelryItemId: number, consignmentStatus: ConsignmentStatus): Promise<void> {
    const newStatus = CONSIGNMENT_TO_JEWELRY_STATUS[consignmentStatus];
    if (!newStatus) return;
    await this.jewelryItemRepository.update(jewelryItemId, { status: newStatus });
  }

  async create(createConsignmentItemDto: CreateConsignmentItemDto): Promise<ConsignmentItem> {
    const consignmentItem = this.consignmentItemRepository.create(createConsignmentItemDto);
    const saved = await this.consignmentItemRepository.save(consignmentItem);
    await this.syncJewelryItemStatus(saved.jewelryItemId, saved.status ?? ConsignmentStatus.ACTIVE);
    return saved;
  }

  async findAll(): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      relations: ['jewelryItem', 'jewelryItem.category', 'jewelryItem.stoneType', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ConsignmentItem> {
    const consignmentItem = await this.consignmentItemRepository.findOne({
      where: { id },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
    });

    if (!consignmentItem) {
      throw new NotFoundException(`Consignment item with ID ${id} not found`);
    }

    return consignmentItem;
  }

  async findByStatus(status: ConsignmentStatus): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      where: { status },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository.find({
      where: { branchId },
      relations: ['jewelryItem', 'jewelryItem.category', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByConsignor(consignorName: string): Promise<ConsignmentItem[]> {
    return this.consignmentItemRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.jewelryItem', 'jewelryItem')
      .leftJoinAndSelect('consignment.branch', 'branch')
      .where('consignment.consignorName LIKE :name', { name: `%${consignorName}%` })
      .orderBy('consignment.createdAt', 'DESC')
      .getMany();
  }

  async findActive(): Promise<ConsignmentItem[]> {
    return this.findByStatus(ConsignmentStatus.ACTIVE);
  }

  /** Active consignment items that have been held for `days` or more without being sold. */
  async findAgedActive(days: number): Promise<ConsignmentItem[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(23, 59, 59, 999);

    return this.consignmentItemRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.jewelryItem', 'jewelryItem')
      .leftJoinAndSelect('consignment.branch', 'branch')
      .where('consignment.status = :status', { status: ConsignmentStatus.ACTIVE })
      .andWhere('consignment.consignmentDate <= :cutoff', { cutoff })
      .orderBy('consignment.consignmentDate', 'ASC')
      .getMany();
  }

  async update(id: number, updateConsignmentItemDto: UpdateConsignmentItemDto): Promise<ConsignmentItem> {
    const consignmentItem = await this.findOne(id);
    const prevAuthentic = consignmentItem.isAuthentic;
    Object.assign(consignmentItem, updateConsignmentItemDto);
    const saved = await this.consignmentItemRepository.save(consignmentItem);

    // Notify consignor when isAuthentic changes
    if (
      updateConsignmentItemDto.isAuthentic !== undefined &&
      updateConsignmentItemDto.isAuthentic !== prevAuthentic
    ) {
      const itemCode = saved.jewelryItem?.itemCode || `#${saved.id}`;
      const branch = saved.branch?.branchName || 'Theia Gems';
      if (saved.consignorEmail) {
        this.mailService.sendConsignmentAuthNotification({
          to: saved.consignorEmail,
          consignorName: saved.consignorName,
          itemCode,
          isAuthentic: !!saved.isAuthentic,
          branch,
        }).catch((e) => this.logger.error('Consignment auth email failed', e));
      }
      if (saved.consignorPhone) {
        const verb = saved.isAuthentic ? 'ACCEPTED as Genuine' : 'REJECTED';
        const sms = `Hi ${saved.consignorName}, your consignment item (${itemCode}) at Theia Gems ${branch} has been ${verb}. ${saved.isAuthentic ? 'It is now listed for sale.' : 'Please contact us to arrange pick-up.'}`;
        this.smsService.sendSmsSemaphore({ recipient: saved.consignorPhone, message: sms })
          .catch((e) => this.logger.error('Consignment auth SMS failed', e));
      }
    }

    return saved;
  }

  async updateStatus(id: number, status: ConsignmentStatus): Promise<ConsignmentItem> {
    const consignmentItem = await this.findOne(id);
    consignmentItem.status = status;
    const saved = await this.consignmentItemRepository.save(consignmentItem);
    await this.syncJewelryItemStatus(saved.jewelryItemId, status);
    return saved;
  }

  async markAsSold(id: number): Promise<ConsignmentItem> {
    const item = await this.findOne(id);
    item.status = ConsignmentStatus.SOLD;
    const saved = await this.consignmentItemRepository.save(item);
    await this.syncJewelryItemStatus(saved.jewelryItemId, ConsignmentStatus.SOLD);

    // Notify consignor with payout details
    const { commission, netToConsignor } = await this.calculateCommission(id);
    const itemCode = saved.jewelryItem?.itemCode || `#${saved.id}`;
    const branch = saved.branch?.branchName || 'Theia Gems';
    if (saved.consignorEmail) {
      this.mailService.sendConsignmentSoldNotification({
        to: saved.consignorEmail,
        consignorName: saved.consignorName,
        itemCode,
        sellingPrice: Number(saved.sellingPrice),
        commission: Number(commission),
        netPayout: Number(netToConsignor),
        branch,
      }).catch((e) => this.logger.error('Consignment sold email failed', e));
    }
    if (saved.consignorPhone) {
      const sms = `Hi ${saved.consignorName}, your consignment item (${itemCode}) at Theia Gems ${branch} has been SOLD. Your payout is ₱${Number(netToConsignor).toFixed(2)} after commission. Please visit us to claim. Thank you!`;
      this.smsService.sendSmsSemaphore({ recipient: saved.consignorPhone, message: sms })
        .catch((e) => this.logger.error('Consignment sold SMS failed', e));
    }

    return saved;
  }

  async markAsReturned(id: number): Promise<ConsignmentItem> {
    return this.updateStatus(id, ConsignmentStatus.PULLOUT);
  }

  async markAsBuyout(id: number): Promise<ConsignmentItem> {
    return this.updateStatus(id, ConsignmentStatus.BUYOUT);
  }

  async remove(id: number): Promise<void> {
    const consignmentItem = await this.findOne(id);
    await this.consignmentItemRepository.remove(consignmentItem);
  }

  async calculateCommission(id: number): Promise<{ commission: number; netToConsignor: number }> {
    const item = await this.findOne(id);
    const commission = item.commissionRate
      ? (item.sellingPrice * item.commissionRate) / 100
      : 0;
    const netToConsignor = item.sellingPrice - commission;
    return { commission, netToConsignor };
  }
}
