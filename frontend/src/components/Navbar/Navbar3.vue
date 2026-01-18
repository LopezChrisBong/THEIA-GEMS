<template>
  <v-app>
    <v-layout>
      <!-- NAVIGATION DRAWER -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        :temporary="!mdAndUp"
        width="280"
        rail-width="72"
        color="#d6a89c"
        expand-on-hover
        class="drawer-fixed"
      >
        <!-- HEADER -->
        <v-list-item class="px-3 py-2" @click="rail = !rail">
          <template #prepend>
            <v-avatar size="36">
              <v-img src="/img/check-mark.png" />
            </v-avatar>
          </template>

          <v-list-item-title class="text-white font-weight-bold ml-3">
            THEIA GEMS
          </v-list-item-title>

          <!-- <template #append>
            <v-btn v-if="mdAndUp" icon variant="text" @click="rail = !rail">
              <v-icon color="white">
                {{ rail ? "mdi-menu" : "mdi-menu-open" }}
              </v-icon>
            </v-btn>
          </template> -->
        </v-list-item>
        <v-divider thickness="1" class="opacity-25" />
        <!-- SIDEBAR LINKS -->
        <v-list nav density="comfortable" class="sidebar drawer-scroll">
          <!-- SINGLE LINKS -->
          <v-list-item
            v-for="(link, i) in singleLinks"
            :key="'item-' + i"
            :to="`/${userType}${link.route}`"
            exact
            rounded
          >
            <template #prepend>
              <v-icon color="black">{{ link.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ link.title }}
            </v-list-item-title>
          </v-list-item>

          <!-- GROUPED LINKS -->
          <v-list-group v-for="(link, i) in groupedLinks" :key="'group-' + i">
            <template #activator="{ props }">
              <v-list-item v-bind="props" rounded>
                <template #prepend>
                  <v-icon color="white">{{ link.icon }}</v-icon>
                </template>
                <v-list-item-title>
                  {{ link.title }}
                </v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item
              v-for="sublink in link.subLink"
              :key="sublink.title"
              :to="`/${userType}${sublink.route}`"
              router
              rounded
              class="ml-6"
            >
              <v-list-item-title>
                {{ sublink.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>

      <!-- APP BAR -->
      <v-app-bar color="#d6a89c" elevation="2" height="63">
        <v-btn v-if="!mdAndUp" icon variant="text" @click="drawer = true">
          <v-icon>mdi-menu</v-icon>
        </v-btn>

        <div v-if="mdAndUp" class="ml-2">
          <h4 class="font-weight-medium text-white">
            Welcome, {{ $store.state.user?.fname }}
          </h4>
          <small class="opacity-80 text-white">
            {{ currentDate }}
          </small>
        </div>

        <v-spacer />

        <!-- NOTIFICATIONS -->
        <!-- <v-menu transition="scale-transition">
          <template #activator="{ props }">
            <v-btn icon v-bind="props" variant="text">
              <v-badge :content="notif_cnt || undefined" color="error">
                <v-icon>mdi-bell</v-icon>
              </v-badge>
            </v-btn>
          </template>

          <v-card width="380">
            <v-list>
              <v-list-item
                v-for="n in notification_items"
                :key="n.id"
                rounded="lg"
                class="mb-1"
                @click="markOneAsRead(n, 'notif')"
              >
                <v-list-item-title>{{ n.msg }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateTimeAgo(n.created_at) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu> -->

        <!-- PROFILE -->
        <v-menu transition="scale-transition">
          <template #activator="{ props }">
            <v-chip v-bind="props" elevation="1" class="ml-2 px-3 mr-3">
              <v-avatar start>
                <v-img :src="profImg ? profImg : '/img/img_avatar.png'" />
              </v-avatar>
              {{ $store.state.user?.fname }}
            </v-chip>
          </template>

          <v-list>
            <!-- <v-list-item @click="toProfile">
              <v-icon start>mdi-cog</v-icon>
              Profile
            </v-list-item> -->
            <v-list-item @click="logout()">
              <v-icon start>mdi-logout</v-icon>
              Logout
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <!-- MAIN CONTENT -->
      <v-main class="bg-grey-lighten-5 main-scroll">
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
      return new Date().toLocaleDateString();
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

    markOneAsRead(data, from) {
      this.axiosCall("/notifications/markOneAsRead", "POST", data).then(() => {
        this.getMyNotifs();
        this.getMyNewNotifsCount();
        if (from === "notif") {
          this.$router.push(`/${this.userType}${data.redirect_route}`);
        }
      });
    },

    toProfile() {
      const role = this.$store.state.user.user.user_roleID;
      if (role === 5) this.$router.push("/superadmin/profile");
      else this.$router.push(`/${this.userType}/profile`);
    },

    // logout() {
    //   this.$store.dispatch("setUser", null);
    //   this.$store.dispatch("setIsAuthenticated", 0);
    //   localStorage.clear();
    //   this.$router.push("/");
    // },
    logout() {
      localStorage.clear();
      this.$store.commit("resetState");

      this.$router.replace("/login");
    },
  },
};
</script>

<style scoped>
.sidebar :deep(.v-list-item-title),
.sidebar :deep(.v-icon) {
  color: white;
}

.sidebar :deep(.v-list-item--active) {
  background-color: white;
}

.sidebar :deep(.v-list-item--active .v-list-item-title),
.sidebar :deep(.v-list-item--active .v-icon) {
  color: #8e6e25;
}

.sidebar :deep(.v-list-item) {
  border-radius: 12px;
  margin-bottom: 6px;
  transition: all 0.2s ease;
}

.sidebar :deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.15);
}

.sidebar :deep(.v-list-item--active) {
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.sidebar :deep(.v-list-item-title) {
  font-size: 0.95rem;
  font-weight: 500;
}
.v-list-item:hover {
  background-color: #8e6e25;
}
.v-list-item :deep(.v-list-item-title:hover) {
  color: #8e6e25;
}
.v-chip {
  border-radius: 20px;
}
.drawer-fixed {
  height: 100vh;
}
.drawer-scroll {
  overflow-y: auto;
  max-height: calc(100vh - 120px); /* header + divider height */
}
.drawer-scroll :deep(.v-navigation-drawer__content) {
  overflow-y: hidden;
}
.main-scroll {
  overflow-y: auto;
  height: calc(100vh - 63px); /* app-bar height */
}
</style>
