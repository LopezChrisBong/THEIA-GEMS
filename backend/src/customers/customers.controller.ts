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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string): Promise<Customer[]> {
    return this.customersService.search(query);
  }

  @Get('repeat-buyers')
  findRepeatBuyers(): Promise<Customer[]> {
    return this.customersService.findRepeatBuyers();
  }

  @Get('top')
  findTopCustomers(@Query('limit') limit?: number): Promise<Customer[]> {
    return this.customersService.findTopCustomers(limit || 10);
  }

  @Get('generate-code')
  generateCustomerCode(): Promise<string> {
    return this.customersService.generateCustomerCode();
  }

  @Get('code/:customerCode')
  findByCode(@Param('customerCode') customerCode: string): Promise<Customer> {
    return this.customersService.findByCode(customerCode);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): Promise<Customer> {
    return this.customersService.findByEmail(email);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Patch(':id/purchase')
  recordPurchase(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ): Promise<Customer> {
    return this.customersService.recordPurchase(id, amount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.customersService.remove(id);
  }
}
