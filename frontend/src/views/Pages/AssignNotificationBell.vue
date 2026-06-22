<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Assign Notification Bell</div>
        <div class="page-sub">Choose which users have the notification bell in their account</div>
      </div>
      <div class="search-wrap">
        <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
        <input
          v-model="search"
          type="text"
          placeholder="Search users..."
          class="search-input-proto"
        />
      </div>
    </div>

    <!-- Table Card -->
    <div class="access-table-card">
      <div class="tbl-wrap">
        <table class="access-table" v-if="!loading">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th class="text-center">Notification Bell</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td>
                <span class="user-name">{{ item.fullName }}</span>
              </td>
              <td class="dim">{{ item.email }}</td>
              <td>
                <span class="role-badge" :class="isAlwaysAllowed(item) ? 'r-admin' : 'r-staff'">
                  {{ item.usertype_desc || (item.user_roleID === 5 ? 'Superadmin' : 'Staff') }}
                </span>
              </td>
              <td class="text-center">
                <span v-if="isAlwaysAllowed(item)" class="always-badge">
                  <v-icon size="12" color="#3D7A5A">mdi-shield-check-outline</v-icon>
                  Always
                </span>
                <label v-else class="switch">
                  <input
                    type="checkbox"
                    :checked="!!item.canAccessNotifications"
                    :disabled="savingId === item.id"
                    @change="toggleAccess(item)"
                  />
                  <span class="slider"></span>
                </label>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-icon">
                    <v-icon size="20" color="#9B6B3A">mdi-account-search</v-icon>
                  </div>
                  <div class="empty-title">No users found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading -->
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading users...</div>
        </div>
      </div>
    </div>

    <!-- Fade Message -->
    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </v-container>
</template>

<script>
export default {
  name: "AssignNotificationBellPage",

  data: () => ({
    search: "",
    data: [],
    loading: false,
    savingId: null,
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "",
      message: "",
      top: 10,
    },
  }),

  computed: {
    filteredData() {
      if (!this.search) return this.data;
      const q = this.search.toLowerCase();
      return this.data.filter((u) =>
        [u.fullName, u.email, u.usertype_desc]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q))
      );
    },
  },

  created() {
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setIsAuthenticated", 0);
      this.$router.push("/");
    }
    this.initialize();
  },

  methods: {
    isAlwaysAllowed(item) {
      return item.usertypeID === 1 || item.user_roleID === 5;
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/notifications/getAssignableUsers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load users:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load users";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    toggleAccess(item) {
      const next = !item.canAccessNotifications;
      this.savingId = item.id;
      this.axiosCall("/notifications/setUserAccess", "POST", {
        userId: item.id,
        canAccessNotifications: next,
      })
        .then(() => {
          item.canAccessNotifications = next;
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "success";
          this.fadeAwayMessage.header = "Updated";
          this.fadeAwayMessage.message = `${item.fullName} ${next ? "now has" : "no longer has"} the notification bell`;
        })
        .catch((error) => {
          console.error("Failed to update access:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to update notification bell access";
        })
        .finally(() => {
          this.savingId = null;
        });
    },
  },
};
</script>

<style scoped>
.theia-view {
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  position: relative;
  z-index: 1;
}

/* ─── Page Header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-heading {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  font-weight: 500;
  color: #3A2515;
  letter-spacing: 0.02em;
}

.page-sub {
  font-size: 12px;
  color: #9A7858;
  margin-top: 2px;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 9px;
  padding: 8px 13px;
  box-shadow: 0 1px 6px rgba(80,30,10,0.08);
  min-width: 230px;
}

.search-input-proto {
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  width: 100%;
}

.search-input-proto::placeholder {
  color: #9A7858;
}

/* ─── Table Card ─── */
.access-table-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(80,30,10,0.08);
  overflow: hidden;
}

.tbl-wrap {
  overflow-x: auto;
}

.access-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.access-table thead th {
  text-align: left;
  padding: 10px 16px;
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #9A7858;
  font-weight: 600;
  background: #F5EFE4;
  white-space: nowrap;
}

.access-table thead th.text-center { text-align: center; }

.access-table tbody tr {
  border-top: 1px solid rgba(155,107,58,0.16);
  transition: background 0.1s;
}

.access-table tbody tr:hover {
  background: #EDE0CC;
}

.access-table tbody td {
  padding: 11px 16px;
  color: #3A2515;
  white-space: nowrap;
  vertical-align: middle;
}

.text-center { text-align: center; }

td.dim {
  color: #9A7858;
  font-size: 12px;
}

.user-name {
  font-weight: 500;
}

/* Role badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.r-admin {
  background: rgba(61,122,90,0.1);
  color: #3D7A5A;
}

.r-staff {
  background: rgba(155,107,58,0.08);
  color: #9A7858;
}

.always-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(61,122,90,0.1);
  color: #3D7A5A;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 21px;
  vertical-align: middle;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(155,107,58,0.2);
  border-radius: 21px;
  transition: 0.15s;
}

.slider::before {
  position: absolute;
  content: "";
  height: 15px;
  width: 15px;
  left: 3px;
  bottom: 3px;
  background-color: #FDFAF6;
  border-radius: 50%;
  transition: 0.15s;
}

.switch input:checked + .slider {
  background-color: #9B6B3A;
}

.switch input:checked + .slider::before {
  transform: translateX(17px);
}

.switch input:disabled + .slider {
  opacity: 0.5;
  cursor: default;
}

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 52px 20px;
  gap: 10px;
  color: #9A7858;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: #EDE0CC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #6B4A30;
}
</style>
