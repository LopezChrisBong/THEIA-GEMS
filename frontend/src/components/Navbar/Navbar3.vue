<template>
  <v-app>
    <v-layout>
      <!-- SIDEBAR -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        :temporary="!mdAndUp"
        width="226"
        rail-width="72"
        color="transparent"
        expand-on-hover
        class="theia-sidebar"
      >
        <!-- LOGO AREA -->
        <div class="logo-area">
          <div class="logo-emblem">
            <img src="/img/theia-logo.png" alt="Theia Gems" class="sidebar-logo-img" />
          </div>
          <div v-show="!rail" class="logo-text">
            <div class="logo-name">Theia Gems</div>
            <div class="logo-tag">Point of Sale</div>
          </div>
        </div>

        <div class="nav-divider" />

        <!-- NAV LINKS -->
        <div class="nav-section">
          <!-- SINGLE LINKS -->
          <div
            v-for="(link, i) in singleLinks"
            :key="'item-' + i"
            :class="link.isLabel ? 'nav-label' : 'nav-item'"
            :style="link.isLabel && rail ? 'display:none' : ''"
            @click="!link.isLabel && navigateTo(link)"
          >
            <template v-if="link.isLabel">{{ link.title }}</template>
            <template v-else>
              <v-icon size="16" class="nav-icon">{{ link.icon }}</v-icon>
              <span v-show="!rail" class="nav-item-text">{{ link.title }}</span>
            </template>
          </div>

          <!-- GROUPED LINKS -->
          <div v-for="(link, i) in groupedLinks" :key="'group-' + i" class="nav-group-wrap">
            <div
              class="nav-item"
              :class="{ active: isGroupActive(link) }"
              @click="toggleGroup(i)"
            >
              <v-icon size="16" class="nav-icon">{{ link.icon }}</v-icon>
              <span v-show="!rail" class="nav-item-text">{{ link.title }}</span>
              <v-icon v-show="!rail" size="14" class="nav-chevron">
                {{ openGroups[i] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
            </div>
            <div v-if="openGroups[i] && !rail" class="nav-sub-items">
              <div
                v-for="sub in link.subLink"
                :key="sub.title"
                class="nav-item sub"
                :class="{ active: $route.path === `/${userType}${sub.route}` }"
                @click="$router.push(`/${userType}${sub.route}`)"
              >
                <span class="nav-item-text">{{ sub.title }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER USER CHIP -->
        <div class="sidebar-footer">
          <div class="user-chip" @click="showUserMenu = !showUserMenu">
            <div class="user-avatar">
              {{ $store.state.user?.fname?.charAt(0) || 'U' }}{{ $store.state.user?.lname?.charAt(0) || '' }}
            </div>
            <div v-show="!rail">
              <div class="user-name">{{ $store.state.user?.fname || 'User' }}</div>
              <div class="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </v-navigation-drawer>

      <!-- APP BAR -->
      <v-app-bar flat height="56" class="theia-topbar">
        <v-btn v-if="!mdAndUp" icon variant="text" @click="drawer = true">
          <v-icon color="white">mdi-menu</v-icon>
        </v-btn>

        <span class="topbar-title">{{ currentPageTitle }}</span>
        <span class="topbar-date">{{ currentDate }}</span>

        <v-spacer />

        <button class="btn-new-sale" @click="$router.push(`/${userType}/pos`)">
          + New Sale
        </button>

        <v-menu transition="scale-transition">
          <template #activator="{ props }">
            <button v-bind="props" class="btn-sign-out">
              <v-icon size="14" color="rgba(253,250,246,0.85)">mdi-logout</v-icon>
              Sign Out
            </button>
          </template>
          <v-card width="260" class="pa-4" style="border-radius: 16px;">
            <div class="text-center mb-3">
              <v-icon size="32" color="error">mdi-logout-variant</v-icon>
              <div class="text-h6 mt-2" style="font-family: 'Cormorant Garamond', serif;">Sign Out?</div>
              <div class="text-body-2 text-medium-emphasis">You will need to sign in again.</div>
            </div>
            <v-row dense>
              <v-col>
                <v-btn block variant="outlined" color="grey" size="small">Cancel</v-btn>
              </v-col>
              <v-col>
                <v-btn block color="error" size="small" @click="logout()">Sign Out</v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-menu>
      </v-app-bar>

      <!-- MAIN CONTENT -->
      <v-main class="theia-main">
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
import { useDisplay } from "vuetify";

export default {
  name: "Navbar3Page",

  data() {
    return {
      drawer: true,
      rail: false,
      links: [],
      userType: null,
      openGroups: {},
      showUserMenu: false,
      notification_items: [],
      notif_cnt: 0,
      interval: null,
      profImg: null,
    };
  },

  computed: {
    mdAndUp() {
      return useDisplay().mdAndUp;
    },

    currentDate() {
      return new Date().toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    currentPageTitle() {
      const route = this.$route;
      return route.meta?.title || route.name || "Dashboard";
    },

    singleLinks() {
      return this.links.filter((link) => !link.subLink);
    },
    groupedLinks() {
      return this.links.filter((link) => link.subLink);
    },
  },

  mounted() {
    this.loadMenu();
    this.getMyNotifs();
    this.getMyNewNotifsCount();

    this.interval = setInterval(() => {
      this.getMyNotifs();
      this.getMyNewNotifsCount();
    }, 180000);
  },

  beforeUnmount() {
    clearInterval(this.interval);
  },

  methods: {
    isActive(link) {
      return this.$route.path === `/${this.userType}${link.route}`;
    },

    isGroupActive(link) {
      return link.subLink?.some(
        (sub) => this.$route.path === `/${this.userType}${sub.route}`
      );
    },

    navigateTo(link) {
      this.$router.push(`/${this.userType}${link.route}`);
    },

    toggleGroup(idx) {
      this.openGroups = { ...this.openGroups, [idx]: !this.openGroups[idx] };
    },

    loadMenu() {
      const userTypeID = this.$store.state.user.user.usertypeID;
      const roleID = this.$store.state.user.user.user_roleID;

      this.axiosCall("/assigned-modules/getMyAssignedModules/my", "GET").then(
        (resp) => {
          this.links = JSON.parse(resp.data.assign_mods);
          if (userTypeID === 1) this.userType = "admin";
          else if (userTypeID === 2 && roleID === 5)
            this.userType = "superadmin";
          else this.userType = "employee";
        },
      );
    },

    getMyNotifs() {
      this.axiosCall("/notifications/getMyNotifs", "GET").then(
        (res) => (this.notification_items = res.data),
      );
    },

    getMyNewNotifsCount() {
      this.axiosCall("/notifications/getMyNewNotifsCount", "GET").then(
        (res) => (this.notif_cnt = res.data),
      );
    },

    logout() {
      localStorage.clear();
      this.$store.commit("resetState");
      this.$router.replace("/login");
    },
  },
};
</script>

<style scoped>
/* ─── SIDEBAR ─── */
.theia-sidebar {
  background: #A8705F !important;
  border-right: 1px solid rgba(255,255,255,0.12) !important;
  font-family: 'Outfit', sans-serif;
  display: flex;
  flex-direction: column;
}

.theia-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Logo */
.logo-area {
  padding: 24px 20px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-emblem {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FDFAF6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.sidebar-logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.logo-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 600;
  color: #FDFAF6;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  line-height: 1.1;
}

.logo-tag {
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(253,250,246,0.5);
  margin-top: 2px;
}

.nav-divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 0 10px;
}

/* Nav Section */
.nav-section {
  padding: 12px 10px;
  flex: 1;
  overflow-y: auto;
}

.nav-label {
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(253,250,246,0.38);
  padding: 0 8px;
  margin-bottom: 4px;
  margin-top: 14px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: rgba(253,250,246,0.62);
  cursor: pointer;
  transition: all 0.13s;
  border: 1px solid transparent;
  margin-bottom: 1px;
  position: relative;
}

.nav-item:hover {
  color: #FDFAF6;
  background: rgba(255,255,255,0.1);
}

.nav-item.active {
  color: #FDFAF6;
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.14);
}

.nav-icon {
  opacity: 0.75;
  color: rgba(253,250,246,0.75) !important;
  flex-shrink: 0;
}

.nav-item.active .nav-icon {
  opacity: 1;
  color: #FDFAF6 !important;
}

.nav-item-text {
  font-family: 'Outfit', sans-serif;
  white-space: nowrap;
}

.nav-chevron {
  margin-left: auto;
  color: rgba(253,250,246,0.4) !important;
}

.nav-sub-items {
  padding-left: 16px;
}

.nav-item.sub {
  padding: 6px 10px 6px 24px;
  font-size: 12px;
}

/* Footer */
.sidebar-footer {
  padding: 14px 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: auto;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.12);
  cursor: pointer;
  transition: background 0.13s;
}

.user-chip:hover {
  background: rgba(255,255,255,0.15);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FDFAF6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #9B6B3A;
  flex-shrink: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: #FDFAF6;
}

.user-role {
  font-size: 10px;
  color: rgba(253,250,246,0.48);
}

/* ─── TOPBAR ─── */
.theia-topbar {
  background: #B67D6E !important;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.topbar-title {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #FDFAF6;
  margin-left: 8px;
}

.topbar-date {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  color: rgba(253,250,246,0.52);
  margin-left: 10px;
}

.btn-new-sale {
  background: #FDFAF6;
  color: #9B6B3A;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: background 0.13s;
  margin-right: 10px;
}

.btn-new-sale:hover {
  background: #EDE0CC;
}

.btn-sign-out {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(253,250,246,0.85);
  padding: 6px 13px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: all 0.13s;
  font-weight: 500;
  margin-right: 12px;
}

.btn-sign-out:hover {
  background: rgba(255,255,255,0.2);
  color: #FDFAF6;
}

/* ─── MAIN CONTENT ─── */
.theia-main {
  background: #C08B7C !important;
  min-height: 100vh;
  overflow-y: auto;
}

/* Gem watermark pattern on main */
.theia-main::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='110' height='110' viewBox='0 0 110 110' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='55,8 95,35 95,75 55,102 15,75 15,35' fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/%3E%3Cpolygon points='55,8 95,35 55,50 15,35' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3Cline x1='55' y1='8' x2='55' y2='50' stroke='rgba(255,255,255,0.04)' stroke-width='0.5'/%3E%3C/svg%3E");
  background-size: 110px 110px;
  pointer-events: none;
  z-index: 0;
}

/* scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,107,58,0.22); border-radius: 4px; }
</style>
