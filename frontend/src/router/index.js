// import Vue from "vue";
// import VueRouter from "vue-router";
import { createRouter, createWebHistory } from 'vue-router'
import store from "../store";
import OuterLayout from "../layouts/OuterLayout.vue";
import MainLayout from "../layouts/MainLayout.vue";
import Register from "../views/Auth/Register.vue";
import Login from "../views/Auth/Login.vue";
import ResetPassword from "../views/Auth/ResetPassword.vue";
import Dashboard from "../views/Pages/Dashboard.vue";
import EmployeeDashboard from "../views/Pages/EmployeeDashboard.vue";
// import Otp from '../views/Auth/Otp.vue'
import Profile from "../views/Pages/Profile.vue";
import RegisterSuccess from "../views/Auth/RegisterSuccess.vue";
import UserType from "../views/Pages/UserType.vue";
import AccountVerification from "../views/Pages/AccountVerification.vue";
import Users from "../views/Pages/Users.vue";
import UserModules from "../views/Pages/UserModules.vue";
import ModulesList from "../views/Pages/ModulesList.vue";
import NotFound from "../views/Pages/NotFound.vue";
import PointOfSale from '../views/Pages/Cashier/PointOfSale.vue';
import Branches from '../views/Pages/Branches.vue';
import Categories from '../views/Pages/Categories.vue';
import Suppliers from '@/views/Pages/Suppliers.vue';
import JewelryItems from '@/views/Pages/JewelryItems.vue';
import StoneTypes from '@/views/Pages/StoneTypes.vue';
import JewelryTypes from '@/views/Pages/JewelryTypes.vue';
import ConsignmentItems from '@/views/Pages/ConsignmentItems.vue';
import Transfers from '@/views/Pages/Transfers.vue';
import TransferItems from '@/components/transfer-items/TransferItems.vue';
import Customers from '@/views/Pages/Customers.vue';
import Sales from '@/views/Pages/Sales.vue';
import SaleItems from '@/components/sale-items/SaleItems.vue';
import Payments from '@/views/Pages/Payments.vue';
import LayawayPlans from '@/views/Pages/LayawayPlans.vue';
import LayawayPayments from '@/components/layaway-payments/LayawayPayments.vue';
import PaymentReminders from '@/views/Pages/PaymentReminders.vue';
import PromotionalMessages from '@/views/Pages/PromotionalMessages.vue';
import InventoryLogs from '@/views/Pages/InventoryLogs.vue';
import Receipts from '@/views/Pages/Receipts.vue';
import TransactionHistory from '@/views/Pages/TransactionHistory.vue';
import SalesReport from '@/views/Pages/SalesReport.vue';
import NotificationsTest from '@/views/Pages/NotificationsTest.vue';
import AssignNotificationBell from '@/views/Pages/AssignNotificationBell.vue';
// import OPCR from "../views/Pages/OPCR.vue";
// Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    component: OuterLayout,
    redirect: "/login",
    meta: { authRequired: false },
    children: [
      {
        path: "login",
        alias: "/login",
        component: Login,
        meta: { authRequired: false },
      },
      {
        path: "register",
        component: Register,
        meta: { authRequired: false },
      },
      {
        path: "registration-success",
        component: RegisterSuccess,
        meta: { authRequired: false },
      },
      {
        path: "forgot-pw",
        component: ResetPassword,
        meta: { authRequired: false },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFound,
    meta: { authRequired: false },
  },
  //admin
  {
    path: "/admin",
    redirect: "/admin/dashboard",
    meta: { RouteForAdmin: true, authRequired: true },
    component: MainLayout,
    children: [
      {
        path: "dashboard",
        component: Dashboard,
        meta: { title: "Dashboard", authRequired: true },
      },
      {
        path: "user-type",
        component: UserType,
        meta: { title: "Utilities - Type of Users", authRequired: true },
      },
      {
        path: "acc_verify",
        component: AccountVerification,
        meta: { title: "Account Verification", authRequired: true },
      },
      {
        path: "user-modules",
        component: UserModules,
        meta: { title: "User Modules", authRequired: true },
      },
      {
        path: "modules-list",
        component: ModulesList,
        meta: { title: "List of Modules", authRequired: true },
      },
      {
        path: "assign-notification-bell",
        component: AssignNotificationBell,
        meta: { title: "Assign Notification Bell", authRequired: true },
      },
    ],
  },
  //superadmin]
  {
    path: "/superadmin",
    redirect: "/superadmin/dashboard",
    meta: { RouteForSuperAdmin: true, authRequired: true },
    component: MainLayout,
    children: [
      {
        path: "dashboard",
        component: Dashboard,
        meta: { title: "Dashboard", authRequired: true },
      },
      {
        path: "user-type",
        component: UserType,
        meta: { title: "Utilities - Type of Users", authRequired: true },
      },
      {
        path: "profile",
        component: Profile,
        meta: { title: "My Profile", authRequired: true },
      },
      {
        path: "acc_verify",
        component: AccountVerification,
        meta: { title: "Account Verification", authRequired: true },
      },
      {
        path: "users",
        component: Users,
        meta: { title: "Utilities - Users", authRequired: true },
      },
      {
        path: "user-modules",
        component: UserModules,
        meta: { title: "User Modules", authRequired: true },
      },
      {
        path: "modules-list",
        component: ModulesList,
        meta: { title: "List of Modules", authRequired: true },
      },
      {
        path: "assign-notification-bell",
        component: AssignNotificationBell,
        meta: { title: "Assign Notification Bell", authRequired: true },
      },
    ],
  },
  //employee
  {
    path: "/employee",
    meta: { RouteForEmployee: true, authRequired: true },
    component: MainLayout,
    children: [
      {
        path: "/employee",
        alias: "/employee/dashboard",
        component: EmployeeDashboard,
        meta: { title: "Dashboard", authRequired: true },
      },
      {
        path: "profile",
        component: Profile,
        meta: { title: "My Profile", authRequired: true },
      },
      {
        path: "acc_verify",
        component: AccountVerification,
        meta: { title: "Account Verification", authRequired: true },
      },
      {
        path: "point-of-sale",
        component: PointOfSale,
        meta: { title: "Point of Sale", authRequired: true },
      },
      {
        path: "items",
        component: JewelryItems,
        meta: { title: "Items", authRequired: true },
      },
      {
        path: "stone-types",
        component: StoneTypes,
        meta: { title: "Stone Types", authRequired: true },
      },
      {
        path: "jewelry-types",
        component: JewelryTypes,
        meta: { title: "Jewelry Types", authRequired: true },
      },
      {
        path: "branch",
        component: Branches,
        meta: { title: "Branches", authRequired: true },
      },
      {
        path: "categories",
        component: Categories,
        meta: { title: "Categories", authRequired: true },
      },
      {
        path: "suppliers",
        component: Suppliers,
        meta: { title: "Suppliers", authRequired: true },
      },
      {
        path: "consignment-items",
        component: ConsignmentItems,
        meta: { title: "Consignment Items", authRequired: true },
      },
      {
        path: "inventory-logs",
        component: InventoryLogs,
        meta: { title: "Inventory Logs", authRequired: true },
      },
      {
        path: "Transfers",
        component: Transfers,
        meta: { title: "Transfers", authRequired: true },
      },
      {
        path: "transfer-items",
        component: TransferItems,
        meta: { title: "Transfer Items", authRequired: true },
      },
      {
        path: "customers",
        component: Customers,
        meta: { title: "Customers", authRequired: true },
      },
      {
        path: "sales",
        component: Sales,
        meta: { title: "Sales", authRequired: true },
      },
      {
        path: "sale-items",
        component: SaleItems,
        meta: { title: "Sale Items", authRequired: true },
      },
      {
        path: "payments",
        component: Payments,
        meta: { title: "Payments", authRequired: true },
      },
      {
        path: "layaway-plans",
        component: LayawayPlans,
        meta: { title: "Layaway Plans", authRequired: true },
      },
      {
        path: "layaway-payments",
        component: LayawayPayments,
        meta: { title: "Layaway Payments", authRequired: true },
      },
      {
        path: "payment-reminders",
        component: PaymentReminders,
        meta: { title: "Payment Reminders", authRequired: true },
      },
      {
        path: "promotional-messages",
        component: PromotionalMessages,
        meta: { title: "Promotional Messages", authRequired: true },
      },
      {
        path: "receipts",
        component: Receipts,
        meta: { title: "Receipts", authRequired: true },
      },
      {
        path: "transaction-history",
        component: TransactionHistory,
        meta: { title: "Transaction History", authRequired: true },
      },
      {
        path: "sales-report",
        component: SalesReport,
        meta: { title: "Sales Report", authRequired: true },
      },
      {
        path: "notifications-test",
        component: NotificationsTest,
        meta: { title: "Notifications Test Center", authRequired: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.getIsAuthenticated;
  const user = store.state.user?.user;

  if (to.matched.some(record => record.meta.authRequired)) {

    if (!isAuthenticated) {
      return next("/login");
    }

    if (!user) {
      return next(false);
    }

    const baseRoute = to.path.split("/")[1];
    const homeRoute = user.usertypeID === 1
      ? "/admin/dashboard"
      : user.user_roleID === 5
        ? "/superadmin/dashboard"
        : "/employee/dashboard";
    const expectedBase = user.usertypeID === 1
      ? "admin"
      : user.user_roleID === 5
        ? "superadmin"
        : "employee";

    return baseRoute === expectedBase ? next() : next(homeRoute);
  }

  next();
});

export default router;
