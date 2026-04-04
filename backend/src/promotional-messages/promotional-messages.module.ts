import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionalMessagesService } from './promotional-messages.service';
import { PromotionalMessagesController } from './promotional-messages.controller';
import { PromotionalMessage } from './entities/promotional-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionalMessage])],
  controllers: [PromotionalMessagesController],
  providers: [PromotionalMessagesService],
  exports: [PromotionalMessagesService],
})
export class PromotionalMessagesModule {}
