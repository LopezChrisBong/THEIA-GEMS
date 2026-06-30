import { AssignedModule } from 'src/assigned-modules/entities/assigned-module.entity';
import { Users } from 'src/auth/entities/auth.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { Category } from 'src/categories/entities/category.entity';
import { ConsignmentItem } from 'src/consignment-items/entities/consignment-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Notifications } from 'src/notifications/entities/notification.entity';
import { Sms } from 'src/sms/entities/sms.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { SysModule } from 'src/sys-modules/entities/sys-module.entity';
import { Transfer } from 'src/transfers/entities/transfer.entity';
import { TransferItem } from 'src/transfer-items/entities/transfer-item.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserType } from 'src/user-type/entities/user-type.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { SaleItem } from 'src/sale-items/entities/sale-item.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { LayawayPlan } from 'src/layaway-plans/entities/layaway-plan.entity';
import { LayawayPayment } from 'src/layaway-payments/entities/layaway-payment.entity';
import { PaymentReminder } from 'src/payment-reminders/entities/payment-reminder.entity';
import { PromotionalMessage } from 'src/promotional-messages/entities/promotional-message.entity';
import { Receipt } from 'src/receipts/entities/receipt.entity';
import { InventoryLog } from 'src/inventory-logs/entities/inventory-log.entity';
import { TransactionLog } from 'src/transaction-logs/entities/transaction-log.entity';
import { UserActivityLog } from 'src/user-activity-logs/entities/user-activity-log.entity';
import { SystemSetting } from 'src/system-settings/entities/system-setting.entity';
import { StoneType } from 'src/stone-types/entities/stone-type.entity';
import { JewelryType } from 'src/jewelry-types/entities/jewelry-type.entity';
import { JewelryItem } from 'src/jewelry-items/entities/jewelry-item.entity';
import { JewelryItemImage } from 'src/jewelry-item-images/entities/jewelry-item-image.entity';

const entities = [
  Users,
  UserDetail,
  UserType,
  UserRole,
  SysModule,
  AssignedModule,
  Notifications,
  Sms,
  Branch,
  Category,
  Supplier,
  ConsignmentItem,
  Transfer,
  TransferItem,
  Customer,
  Sale,
  SaleItem,
  Payment,
  LayawayPlan,
  LayawayPayment,
  PaymentReminder,
  PromotionalMessage,
  Receipt,
  InventoryLog,
  TransactionLog,
  UserActivityLog,
  SystemSetting,
  StoneType,
  JewelryType,
  JewelryItem,
  JewelryItemImage,
];

export {
  Users,
  UserDetail,
  UserType,
  UserRole,
  SysModule,
  AssignedModule,
  Notifications,
  Sms,
  Branch,
  Category,
  Supplier,
  ConsignmentItem,
  Transfer,
  TransferItem,
  Customer,
  Sale,
  SaleItem,
  Payment,
  LayawayPlan,
  LayawayPayment,
  PaymentReminder,
  PromotionalMessage,
  Receipt,
  InventoryLog,
  TransactionLog,
  UserActivityLog,
  SystemSetting,
  StoneType,
  JewelryType,
  JewelryItem,
  JewelryItemImage,
};

export default entities;
