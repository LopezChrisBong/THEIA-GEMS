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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InstallmentPlansService } from './installment-plans.service';
import { CreateInstallmentPlanDto } from './dto/create-installment-plan.dto';
import { UpdateInstallmentPlanDto } from './dto/update-installment-plan.dto';
import { InstallmentPlan, InstallmentStatus } from './entities/installment-plan.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Installment Plans')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('installment-plans')
export class InstallmentPlansController {
  constructor(private readonly installmentPlansService: InstallmentPlansService) {}

  @Post()
  create(@Body() createInstallmentPlanDto: CreateInstallmentPlanDto): Promise<InstallmentPlan> {
    return this.installmentPlansService.create(createInstallmentPlanDto);
  }

  @Get()
  findAll(): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findAll();
  }

  @Get('generate-number')
  generatePlanNumber(): Promise<string> {
    return this.installmentPlansService.generatePlanNumber();
  }

  @Get('overdue')
  findOverdue(): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findOverdue();
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: string): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findUpcoming(days ? parseInt(days, 10) : 7);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findByCustomer(customerId);
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
  ): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findByBranch(branchId);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: InstallmentStatus): Promise<InstallmentPlan[]> {
    return this.installmentPlansService.findByStatus(status);
  }

  @Get('number/:planNumber')
  findByPlanNumber(@Param('planNumber') planNumber: string): Promise<InstallmentPlan> {
    return this.installmentPlansService.findByPlanNumber(planNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InstallmentPlan> {
    return this.installmentPlansService.findOne(id);
  }

  @Post(':id/payment')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ): Promise<InstallmentPlan> {
    return this.installmentPlansService.recordPayment(id, amount);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: InstallmentStatus,
  ): Promise<InstallmentPlan> {
    return this.installmentPlansService.updateStatus(id, status);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstallmentPlanDto: UpdateInstallmentPlanDto,
  ): Promise<InstallmentPlan> {
    return this.installmentPlansService.update(id, updateInstallmentPlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.installmentPlansService.remove(id);
  }
}
