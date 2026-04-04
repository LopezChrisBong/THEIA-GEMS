import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { LayawayPlan, LayawayStatus } from './entities/layaway-plan.entity';
import { CreateLayawayPlanDto } from './dto/create-layaway-plan.dto';
import { UpdateLayawayPlanDto } from './dto/update-layaway-plan.dto';

@Injectable()
export class LayawayPlansService {
  constructor(
    @InjectRepository(LayawayPlan)
    private readonly layawayPlanRepository: Repository<LayawayPlan>,
  ) {}

  async create(createLayawayPlanDto: CreateLayawayPlanDto): Promise<LayawayPlan> {
    const startDate = new Date(createLayawayPlanDto.startDate);
    const remainingBalance =
      createLayawayPlanDto.totalAmount - createLayawayPlanDto.downPayment;
    const monthlyPayment =
      remainingBalance / createLayawayPlanDto.numberOfPayments;

    // Calculate end date (number of months from start)
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + createLayawayPlanDto.numberOfPayments);

    // Next payment is one month from start
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const layawayPlan = this.layawayPlanRepository.create({
      ...createLayawayPlanDto,
      planNumber:
        createLayawayPlanDto.planNumber || (await this.generatePlanNumber()),
      startDate,
      endDate: createLayawayPlanDto.endDate
        ? new Date(createLayawayPlanDto.endDate)
        : endDate,
      nextPaymentDate: createLayawayPlanDto.nextPaymentDate
        ? new Date(createLayawayPlanDto.nextPaymentDate)
        : nextPaymentDate,
      remainingBalance,
      monthlyPayment,
    });
    return this.layawayPlanRepository.save(layawayPlan);
  }

  async findAll(): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LayawayPlan> {
    const layawayPlan = await this.layawayPlanRepository.findOne({
      where: { id },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!layawayPlan) {
      throw new NotFoundException(`Layaway plan with ID ${id} not found`);
    }
    return layawayPlan;
  }

  async findByPlanNumber(planNumber: string): Promise<LayawayPlan> {
    const layawayPlan = await this.layawayPlanRepository.findOne({
      where: { planNumber },
      relations: ['sale', 'customer', 'branch'],
    });
    if (!layawayPlan) {
      throw new NotFoundException(
        `Layaway plan with number ${planNumber} not found`,
      );
    }
    return layawayPlan;
  }

  async findByCustomer(customerId: number): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { customerId },
      relations: ['sale', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBranch(branchId: number): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { branchId },
      relations: ['sale', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: LayawayStatus): Promise<LayawayPlan[]> {
    return this.layawayPlanRepository.find({
      where: { status },
      relations: ['sale', 'customer', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOverdue(): Promise<LayawayPlan[]> {
    const today = new Date();
    return this.layawayPlanRepository.find({
      where: {
        status: LayawayStatus.ACTIVE,
        nextPaymentDate: LessThanOrEqual(today),
      },
      relations: ['sale', 'customer', 'branch'],
      order: { nextPaymentDate: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<LayawayPlan[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.layawayPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.sale', 'sale')
      .leftJoinAndSelect('plan.customer', 'customer')
      .leftJoinAndSelect('plan.branch', 'branch')
      .where('plan.status = :status', { status: LayawayStatus.ACTIVE })
      .andWhere('plan.next_payment_date > :today', { today })
      .andWhere('plan.next_payment_date <= :futureDate', { futureDate })
      .orderBy('plan.next_payment_date', 'ASC')
      .getMany();
  }

  async recordPayment(
    id: number,
    amount: number,
  ): Promise<LayawayPlan> {
    const plan = await this.findOne(id);

    plan.remainingBalance = Number(plan.remainingBalance) - amount;
    plan.paymentsMade += 1;

    // Update next payment date
    if (plan.remainingBalance <= 0) {
      plan.status = LayawayStatus.COMPLETED;
      plan.remainingBalance = 0;
      plan.nextPaymentDate = null;
    } else {
      const nextDate = new Date(plan.nextPaymentDate!);
      nextDate.setMonth(nextDate.getMonth() + 1);
      plan.nextPaymentDate = nextDate;
    }

    return this.layawayPlanRepository.save(plan);
  }

  async updateStatus(id: number, status: LayawayStatus): Promise<LayawayPlan> {
    const plan = await this.findOne(id);
    plan.status = status;
    return this.layawayPlanRepository.save(plan);
  }

  async update(
    id: number,
    updateLayawayPlanDto: UpdateLayawayPlanDto,
  ): Promise<LayawayPlan> {
    const layawayPlan = await this.findOne(id);
    Object.assign(layawayPlan, updateLayawayPlanDto);
    if (updateLayawayPlanDto.startDate) {
      layawayPlan.startDate = new Date(updateLayawayPlanDto.startDate);
    }
    if (updateLayawayPlanDto.endDate) {
      layawayPlan.endDate = new Date(updateLayawayPlanDto.endDate);
    }
    if (updateLayawayPlanDto.nextPaymentDate) {
      layawayPlan.nextPaymentDate = new Date(updateLayawayPlanDto.nextPaymentDate);
    }
    return this.layawayPlanRepository.save(layawayPlan);
  }

  async remove(id: number): Promise<void> {
    const layawayPlan = await this.findOne(id);
    await this.layawayPlanRepository.remove(layawayPlan);
  }

  async generatePlanNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LAY-${datePrefix}-`;

    const lastPlan = await this.layawayPlanRepository
      .createQueryBuilder('plan')
      .where('plan.plan_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('plan.plan_number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPlan) {
      const lastNumber = parseInt(lastPlan.planNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
