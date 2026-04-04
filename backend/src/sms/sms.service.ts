// import { Injectable } from '@nestjs/common';
// import { CreateSmDto } from './dto/create-sm.dto';
// import { UpdateSmDto } from './dto/update-sm.dto';
// import { SendSMSDTO } from './dto/send-sms.dto';
// import { DataSource } from 'typeorm';
// import axios from 'axios';
// import { Sms } from 'src/entities';
// @Injectable()
// export class SmsService {
//   constructor(private dataSource: DataSource) {}

//   create(createSmDto: CreateSmDto) {
//     return 'This action adds a new sm';
//   }

//   private readonly apiKey = process.env.SEMAPHORE_API_KEY!;
//   private readonly baseUrl = process.env.SEMAPHORE_BASE_URL!;

//   async sendSmsSemaphore(dto: SendSMSDTO) {
//     try {
//       let mobile = dto.recipient.trim().replace(/[\s-]/g, '');

//       if (mobile.startsWith('09')) {
//         mobile = '639' + mobile.substring(2);
//       } else if (mobile.startsWith('+639')) {
//         mobile = mobile.substring(1);
//       } else if (!mobile.startsWith('639')) {
//         throw new Error('Invalid Philippine mobile number format');
//       }

//       dto.recipient = mobile;
//       console.log(dto);
//       const response = await axios.post(
//         this.baseUrl,
//         {
//           apikey: this.apiKey,
//           number: dto.recipient,
//           message: dto.message,
//           sendername: process.env.SEMAPHORE_SENDER_NAME,
//         },
//         {
//           headers: { 'Content-Type': 'application/json' },
//         },
//       );

//       const smsResponse = Array.isArray(response.data)
//         ? response.data[0]
//         : null;

//       const sms = this.dataSource.manager.create(Sms, {
//         message: dto.message,
//         recipient: dto.recipient,
//         is_sent: !!smsResponse,
//         // provider_message_id: smsResponse?.message_id || null,
//         // status: smsResponse?.status || 'FAILED',
//       });

//       await this.dataSource.manager.save(sms);

//       return response.data;
//     } catch (error: any) {
//       const errorMessage =
//         error?.response?.data?.message ||
//         error?.response?.data?.error ||
//         error?.message ||
//         'Unknown SMS error';

//       console.error('Semaphore Error:', errorMessage);

//       await this.dataSource.manager.save(
//         this.dataSource.manager.create(Sms, {
//           message: dto.message,
//           recipient: dto.recipient,
//           is_sent: false,
//           // status: 'FAILED',
//         }),
//       );

//       throw new Error(errorMessage);
//     }
//   }

//   findAll() {
//     return `This action returns all sms`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} sm`;
//   }

//   update(id: number, updateSmDto: UpdateSmDto) {
//     return `This action updates a #${id} sm`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} sm`;
//   }
// }

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
