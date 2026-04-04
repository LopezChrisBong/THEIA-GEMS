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
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { Receipt } from './entities/receipt.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Receipts')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  create(@Body() createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    return this.receiptsService.create(createReceiptDto);
  }

  @Get()
  findAll(): Promise<Receipt[]> {
    return this.receiptsService.findAll();
  }

  @Get('generate-number')
  generateReceiptNumber(): Promise<string> {
    return this.receiptsService.generateReceiptNumber();
  }

  @Get('sale/:saleId')
  findBySale(@Param('saleId', ParseIntPipe) saleId: number): Promise<Receipt> {
    return this.receiptsService.findBySale(saleId);
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
  ): Promise<Receipt[]> {
    return this.receiptsService.findByBranch(branchId);
  }

  @Get('number/:receiptNumber')
  findByReceiptNumber(
    @Param('receiptNumber') receiptNumber: string,
  ): Promise<Receipt> {
    return this.receiptsService.findByReceiptNumber(receiptNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Receipt> {
    return this.receiptsService.findOne(id);
  }

  @Post(':id/print')
  print(
    @Param('id', ParseIntPipe) id: number,
    @Body('printedBy') printedBy: number,
  ): Promise<Receipt> {
    return this.receiptsService.print(id, printedBy);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReceiptDto: UpdateReceiptDto,
  ): Promise<Receipt> {
    return this.receiptsService.update(id, updateReceiptDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.receiptsService.remove(id);
  }
}
