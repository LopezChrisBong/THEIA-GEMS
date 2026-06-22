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
import { PromotionalMessagesService } from './promotional-messages.service';
import { CreatePromotionalMessageDto } from './dto/create-promotional-message.dto';
import { CreateBulkPromotionalMessageDto } from './dto/create-bulk-promotional-message.dto';
import { UpdatePromotionalMessageDto } from './dto/update-promotional-message.dto';
import {
  PromotionalMessage,
  MessageStatus,
  MessageType,
} from './entities/promotional-message.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Promotional Messages')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('promotional-messages')
export class PromotionalMessagesController {
  constructor(
    private readonly promotionalMessagesService: PromotionalMessagesService,
  ) {}

  @Post()
  create(
    @Body() createPromotionalMessageDto: CreatePromotionalMessageDto,
  ): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.create(createPromotionalMessageDto);
  }

  @Post('bulk')
  createBulk(@Body() createBulkDto: CreateBulkPromotionalMessageDto) {
    return this.promotionalMessagesService.createBulk(createBulkDto);
  }

  @Get()
  findAll(): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findAll();
  }

  @Get('summary')
  getSummary(): Promise<{
    draft: number;
    scheduled: number;
    sent: number;
    failed: number;
  }> {
    return this.promotionalMessagesService.getSummary();
  }

  @Get('scheduled-to-send')
  findScheduledToSend(): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findScheduledToSend();
  }

  @Get('broadcasts')
  findBroadcasts(): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findBroadcasts();
  }

  @Get('status/:status')
  findByStatus(
    @Param('status') status: MessageStatus,
  ): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findByStatus(status);
  }

  @Get('type/:type')
  findByType(@Param('type') type: MessageType): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findByType(type);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<PromotionalMessage[]> {
    return this.promotionalMessagesService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.findOne(id);
  }

  @Post(':id/schedule')
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body('scheduledDate') scheduledDate: string,
  ): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.schedule(
      id,
      new Date(scheduledDate),
    );
  }

  @Post(':id/send')
  markAsSent(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.markAsSent(id);
  }

  @Post(':id/send-now')
  sendNow(@Param('id', ParseIntPipe) id: number): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.sendNow(id);
  }

  @Post(':id/fail')
  markAsFailed(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.markAsFailed(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionalMessageDto: UpdatePromotionalMessageDto,
  ): Promise<PromotionalMessage> {
    return this.promotionalMessagesService.update(
      id,
      updatePromotionalMessageDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promotionalMessagesService.remove(id);
  }
}
