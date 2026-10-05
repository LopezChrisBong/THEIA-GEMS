import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserDetailsModule } from './user-details/user-details.module';
import { UserTypeModule } from './user-type/user-type.module';

// import config from '../ormconfig';
import entities from './entities';
// import { PDFModule } from '@t00nday/nestjs-pdf';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UserRoleModule } from './user-role/user-role.module';
import { SysModulesModule } from './sys-modules/sys-modules.module';
import { AssignedModulesModule } from './assigned-modules/assigned-modules.module';
import { SmsModule } from './sms/sms.module';
import { BranchesModule } from './branches/branches.module';
import { CategoriesModule } from './categories/categories.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ConsignmentItemsModule } from './consignment-items/consignment-items.module';
import { TransfersModule } from './transfers/transfers.module';
import { TransferItemsModule } from './transfer-items/transfer-items.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { SaleItemsModule } from './sale-items/sale-items.module';
import { SaleAdditionalPaymentsModule } from './sale-additional-payments/sale-additional-payments.module';
import { PaymentsModule } from './payments/payments.module';
import { LayawayPlansModule } from './layaway-plans/layaway-plans.module';
import { LayawayPaymentsModule } from './layaway-payments/layaway-payments.module';
import { InstallmentPlansModule } from './installment-plans/installment-plans.module';
import { InstallmentPaymentsModule } from './installment-payments/installment-payments.module';
import { PaymentRemindersModule } from './payment-reminders/payment-reminders.module';
import { PromotionalMessagesModule } from './promotional-messages/promotional-messages.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { InventoryLogsModule } from './inventory-logs/inventory-logs.module';
import { TransactionLogsModule } from './transaction-logs/transaction-logs.module';
import { UserActivityLogsModule } from './user-activity-logs/user-activity-logs.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { StoneTypesModule } from './stone-types/stone-types.module';
import { JewelryTypesModule } from './jewelry-types/jewelry-types.module';
import { JewelryItemsModule } from './jewelry-items/jewelry-items.module';
import { JewelryItemImagesModule } from './jewelry-item-images/jewelry-item-images.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 120, // generous cap for normal authenticated CRUD/UI usage; sensitive routes override this
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: entities,
      synchronize: true, //for production this is set to be false
    }),
    // PDFModule.register({
    //   isGlobal: true,
    //   view: {
    //     root: '',
    //     engine: 'htmling',
    //   },
    // }),
    AuthModule,
    UserDetailsModule,
    UserTypeModule,
    PdfGeneratorModule,
    MailModule,
    NotificationsModule,
    UserRoleModule,
    SysModulesModule,
    AssignedModulesModule,
    SmsModule,
    BranchesModule,
    CategoriesModule,
    SuppliersModule,
    ConsignmentItemsModule,
    TransfersModule,
    TransferItemsModule,
    CustomersModule,
    SalesModule,
    SaleItemsModule,
    SaleAdditionalPaymentsModule,
    PaymentsModule,
    LayawayPlansModule,
    LayawayPaymentsModule,
    InstallmentPlansModule,
    InstallmentPaymentsModule,
    PaymentRemindersModule,
    PromotionalMessagesModule,
    ReceiptsModule,
    InventoryLogsModule,
    TransactionLogsModule,
    UserActivityLogsModule,
    SystemSettingsModule,
    StoneTypesModule,
    JewelryTypesModule,
    JewelryItemsModule,
    JewelryItemImagesModule,
    SchedulerModule,
  ],

  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  // constructor(private dataSource: DataSource) { }
}
