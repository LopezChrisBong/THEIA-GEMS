import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DataSource } from 'typeorm';
import { Sms } from 'src/entities';
import { SendSMSDTO } from './dto/send-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly senderName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('SEMAPHORE_API_KEY');
    this.baseUrl = this.configService.getOrThrow<string>('SEMAPHORE_BASE_URL');
    this.senderName =
      this.configService.get<string>('SEMAPHORE_SENDER_NAME') || 'SEMAPHORE';
  }

  private normalizeMobile(mobile: string): string {
    mobile = mobile.trim().replace(/[\s-]/g, '');

    if (mobile.startsWith('09')) {
      return '639' + mobile.substring(2);
    }

    if (mobile.startsWith('+639')) {
      return mobile.substring(1);
    }

    if (mobile.startsWith('639')) {
      return mobile;
    }

    throw new Error('Invalid Philippine mobile number format');
  }

  async sendSmsSemaphore(dto: SendSMSDTO) {
    try {
      const mobile = this.normalizeMobile(dto.recipient);

      const payload = {
        apikey: this.apiKey,
        number: mobile,
        message: dto.message,
        sendername: this.senderName,
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      const smsResponse = Array.isArray(response.data)
        ? response.data[0]
        : null;

      const sms = this.dataSource.manager.create(Sms, {
        message: dto.message,
        recipient: mobile,
        is_sent: !!smsResponse,
      });

      await this.dataSource.manager.save(sms);

      this.logger.log(`SMS sent to ${mobile}`);

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unknown SMS error';

      this.logger.error(`Semaphore SMS Error: ${errorMessage}`);

      await this.dataSource.manager.save(
        this.dataSource.manager.create(Sms, {
          message: dto.message,
          recipient: dto.recipient,
          is_sent: false,
        }),
      );

      throw new Error(errorMessage);
    }
  }
}
