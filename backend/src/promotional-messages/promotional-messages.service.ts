import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import {
  PromotionalMessage,
  MessageStatus,
  MessageType,
  SendMethod,
} from './entities/promotional-message.entity';
import { CreatePromotionalMessageDto } from './dto/create-promotional-message.dto';
import { UpdatePromotionalMessageDto } from './dto/update-promotional-message.dto';

@Injectable()
export class PromotionalMessagesService {
  constructor(
    @InjectRepository(PromotionalMessage)
    private readonly promotionalMessageRepository: Repository<PromotionalMessage>,
  ) {}

  async create(
    createPromotionalMessageDto: CreatePromotionalMessageDto,
  ): Promise<PromotionalMessage> {
    const { scheduledDate, ...rest } = createPromotionalMessageDto;
    const message = this.promotionalMessageRepository.create({
      ...rest,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    });
    return this.promotionalMessageRepository.save(message);
  }

  async findAll(): Promise<PromotionalMessage[]> {
    return this.promotionalMessageRepository.find({
      relations: ['customer', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PromotionalMessage> {
    const message = await this.promotionalMessageRepository.findOne({
      where: { id },
      relations: ['customer', 'creator'],
    });
    if (!message) {
      throw new NotFoundException(`Promotional message with ID ${id} not found`);
    }
    return message;
  }

  async findByStatus(status: MessageStatus): Promise<PromotionalMessage[]> {
    return this.promotionalMessageRepository.find({
      where: { status },
      relations: ['customer', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: MessageType): Promise<PromotionalMessage[]> {
    return this.promotionalMessageRepository.find({
      where: { messageType: type },
      relations: ['customer', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: number): Promise<PromotionalMessage[]> {
    return this.promotionalMessageRepository.find({
      where: { customerId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBroadcasts(): Promise<PromotionalMessage[]> {
    return this.promotionalMessageRepository.find({
      where: { customerId: IsNull() },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findScheduledToSend(): Promise<PromotionalMessage[]> {
    const now = new Date();
    return this.promotionalMessageRepository.find({
      where: {
        status: MessageStatus.SCHEDULED,
        scheduledDate: LessThanOrEqual(now),
      },
      relations: ['customer', 'creator'],
    });
  }

  async schedule(id: number, scheduledDate: Date): Promise<PromotionalMessage> {
    const message = await this.findOne(id);
    message.status = MessageStatus.SCHEDULED;
    message.scheduledDate = scheduledDate;
    return this.promotionalMessageRepository.save(message);
  }

  async markAsSent(id: number): Promise<PromotionalMessage> {
    const message = await this.findOne(id);
    message.status = MessageStatus.SENT;
    message.sentAt = new Date();
    return this.promotionalMessageRepository.save(message);
  }

  async markAsFailed(id: number): Promise<PromotionalMessage> {
    const message = await this.findOne(id);
    message.status = MessageStatus.FAILED;
    return this.promotionalMessageRepository.save(message);
  }

  async update(
    id: number,
    updatePromotionalMessageDto: UpdatePromotionalMessageDto,
  ): Promise<PromotionalMessage> {
    const message = await this.findOne(id);
    Object.assign(message, updatePromotionalMessageDto);
    if (updatePromotionalMessageDto.scheduledDate) {
      message.scheduledDate = new Date(updatePromotionalMessageDto.scheduledDate);
    }
    return this.promotionalMessageRepository.save(message);
  }

  async remove(id: number): Promise<void> {
    const message = await this.findOne(id);
    await this.promotionalMessageRepository.remove(message);
  }

  async getSummary(): Promise<{
    draft: number;
    scheduled: number;
    sent: number;
    failed: number;
  }> {
    const [draft, scheduled, sent, failed] = await Promise.all([
      this.promotionalMessageRepository.count({
        where: { status: MessageStatus.DRAFT },
      }),
      this.promotionalMessageRepository.count({
        where: { status: MessageStatus.SCHEDULED },
      }),
      this.promotionalMessageRepository.count({
        where: { status: MessageStatus.SENT },
      }),
      this.promotionalMessageRepository.count({
        where: { status: MessageStatus.FAILED },
      }),
    ]);

    return { draft, scheduled, sent, failed };
  }
}
