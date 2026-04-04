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
import { LayawayPlansService } from './layaway-plans.service';
import { CreateLayawayPlanDto } from './dto/create-layaway-plan.dto';
import { UpdateLayawayPlanDto } from './dto/update-layaway-plan.dto';
import { LayawayPlan, LayawayStatus } from './entities/layaway-plan.entity';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';

@ApiTags('Layaway Plans')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard)
@Controller('layaway-plans')
export class LayawayPlansController {
  constructor(private readonly layawayPlansService: LayawayPlansService) {}

  @Post()
  create(@Body() createLayawayPlanDto: CreateLayawayPlanDto): Promise<LayawayPlan> {
    return this.layawayPlansService.create(createLayawayPlanDto);
  }

  @Get()
  findAll(): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findAll();
  }

  @Get('generate-number')
  generatePlanNumber(): Promise<string> {
    return this.layawayPlansService.generatePlanNumber();
  }

  @Get('overdue')
  findOverdue(): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findOverdue();
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: string): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findUpcoming(days ? parseInt(days, 10) : 7);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findByCustomer(customerId);
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
  ): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findByBranch(branchId);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: LayawayStatus): Promise<LayawayPlan[]> {
    return this.layawayPlansService.findByStatus(status);
  }

  @Get('number/:planNumber')
  findByPlanNumber(@Param('planNumber') planNumber: string): Promise<LayawayPlan> {
    return this.layawayPlansService.findByPlanNumber(planNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LayawayPlan> {
    return this.layawayPlansService.findOne(id);
  }

  @Post(':id/payment')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ): Promise<LayawayPlan> {
    return this.layawayPlansService.recordPayment(id, amount);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: LayawayStatus,
  ): Promise<LayawayPlan> {
    return this.layawayPlansService.updateStatus(id, status);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLayawayPlanDto: UpdateLayawayPlanDto,
  ): Promise<LayawayPlan> {
    return this.layawayPlansService.update(id, updateLayawayPlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.layawayPlansService.remove(id);
  }
}
