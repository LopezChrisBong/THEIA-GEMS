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
      
      // {
      //   path: "opcr",
      //   component: OPCR,
      //   meta: {
      //     title: "Office Performance and Commitment Review(OPCR)",
      //     authRequired: true,
      //   },
      //   beforeEnter: (to, from, next) => {
      //     if (
      //       store.state.user.user.user_roleID != 2 &&
      //       store.state.user.user.user_roleID != 5 &&
      //       store.state.user.user.user_roleID != 10
      //     ) {
      //       console.log(to.name, from.name);
      //       next();
      //     } else {
      //       next("/");
      //     }
      //   },
      // },

      // {
      //   path: "404",
      //   component: NotFound,
      //   meta: { authRequired: true },
      // },
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

    ],
  },
 
];

// const router = createRouter({
//   history: createWebHistory(),
//   base: process.env.BASE_URL,
//   routes,
// })
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

// router.beforeEach((to, from, next) => {
//   // let user = store.state.user;
//   const isAuthenticated = store.getters.getIsAuthenticated;
//   console.log(to);
//   if (to.matched.some((record) => record.meta.authRequired == true)) {
//     if (isAuthenticated) {
//       let pt = to.fullPath;
//       let ptSplit = pt.split("/");

//       if (store.state.user.user.usertypeID == 1) {
//         if (ptSplit[1].toLowerCase() == "admin") {
//           if (!to.matched.length) {
//             next("/admin/dashboard");
//           } else {
//             next();
//           }
//         } else {
//           next("/admin/dashboard");
//         }
//       } else {
//         if (store.state.user.user.user_roleID == 5) {
//           if (ptSplit[1].toLowerCase() == "superadmin") {
//             if (!to.matched.length) {
//               next("/superadmin/dashboard");
//             } else {
//               next();
//             }
//           } else {
//             next("/superadmin/dashboard");
//           }
//         } else {
//           if (ptSplit[1].toLowerCase() == "employee") {
//             if (!to.matched.length) {
//               next("/employee/dashboard");
//             } else {
//               next();
//             }
//           } else {
//             next("/employee/dashboard");
//           }
//         }
//       }
//     } else {
//       next("/");
//     }
//   } else {
//    next();
//   }
// });


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

    // Admin
    if (user.usertypeID === 1) {
      return baseRoute === "admin"
        ? next()
        : next("/admin/dashboard");
    }

    // Superadmin
    if (user.user_roleID === 5) {
      return baseRoute === "superadmin"
        ? next()
        : next("/superadmin/dashboard");
    }

    // Employee (default)
    return baseRoute === "employee"
      ? next()
      : next("/employee/dashboard");
  }

  next();
});




export default router;
