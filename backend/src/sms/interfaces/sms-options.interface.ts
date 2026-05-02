import { ApiProperty } from '@nestjs/swagger';

export interface SmsModuleOptions {
  apiToken: string;
  defaultSenderId?: string;
  apiUrl?: string;
}

export interface SendSmsDto {
  recipient: string;
  message: string;
  senderId?: string;
  type?: 'plain' | 'unicode';
}

export interface SendMmsDto {
  recipient: string;
  message: string;
  senderId?: string;
  mediaUrl: string;
}

export interface SendVoiceDto {
  recipient: string;
  message: string;
  language?: 'en-gb' | 'en-us' | 'fil-ph';
  gender?: 'male' | 'female';
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  data?: any;
}

export interface BulkSmsDto {
  recipients: string[];
  message: string;
  senderId?: string;
  type?: 'plain' | 'unicode';
}
