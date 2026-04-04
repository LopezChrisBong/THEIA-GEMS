<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        density="compact"
        variant="outlined"
        class="mr-4"
        style="max-width: 300px"
      ></v-text-field>
      <v-spacer></v-spacer>
      <UserActivityLogsDialog />
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="activityLogs"
      :search="search"
      :loading="loading"
      class="elevation-1"
      item-value="id"
    >
      <template v-slot:[`item.user`]="{ item }">
        <div v-if="item.user" class="d-flex align-center">
          <v-avatar size="30" color="primary" class="mr-2">
            <span class="text-caption white--text">
              {{ getInitials(item.user) }}
            </span>
          </v-avatar>
          <span>{{ item.user.first_name }} {{ item.user.last_name }}</span>
        </div>
        <span v-else class="text-grey">Unknown User</span>
      </template>

      <template v-slot:[`item.activityType`]="{ item }">
        <v-chip :color="getActivityColor(item.activityType)" size="small" dark>
          <v-icon start size="small">{{ getActivityIcon(item.activityType) }}</v-icon>
          {{ formatActivityType(item.activityType) }}
        </v-chip>
      </template>

      <template v-slot:[`item.module`]="{ item }">
        <v-chip v-if="item.module" color="blue-grey" size="small" variant="outlined">
          <v-icon start size="small">{{ getModuleIcon(item.module) }}</v-icon>
          {{ formatModule(item.module) }}
        </v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.activityDescription`]="{ item }">
        <span v-if="item.activityDescription" class="text-truncate" style="max-width: 200px; display: inline-block;">
          {{ item.activityDescription }}
        </span>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.ipAddress`]="{ item }">
        <code v-if="item.ipAddress" class="text-caption">{{ item.ipAddress }}</code>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.sessionId`]="{ item }">
        <code v-if="item.sessionId" class="text-caption text-truncate" style="max-width: 100px; display: inline-block;">
          {{ item.sessionId }}
        </code>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.createdAt`]="{ item }">
        {{ formatDateTime(item.createdAt) }}
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          variant="text"
          @click="editItem(item)"
        >
          <v-icon size="small">mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          color="error"
          variant="text"
          @click="deleteItem(item)"
        >
          <v-icon size="small">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this activity log? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import eventBus from "@/eventBus";
import UserActivityLogsDialog from "./UserActivityLogsDialog.vue";

export default {
  name: "UserActivityLogsDataTable",
  components: {
    UserActivityLogsDialog,
  },
  data() {
    return {
      search: "",
      loading: false,
      activityLogs: [],
      dialogDelete: false,
      deleteId: null,
      headers: [
        { title: "ID", key: "id", width: "70px" },
        { title: "User", key: "user", width: "180px" },
        { title: "Activity", key: "activityType", width: "130px" },
        { title: "Module", key: "module", width: "130px" },
        { title: "Description", key: "activityDescription", width: "200px" },
        { title: "IP Address", key: "ipAddress", width: "130px" },
        { title: "Session ID", key: "sessionId", width: "120px" },
        { title: "Created At", key: "createdAt", width: "160px" },
        { title: "Actions", key: "actions", sortable: false, width: "100px" },
      ],
    };
  },
  mounted() {
    this.initialize();
    eventBus.on("closeUserActivityLogsDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeUserActivityLogsDialog");
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const response = await this.axiosCall("/user-activity-logs", "GET");
        if (response.data) {
          this.activityLogs = response.data;
        }
      } catch (error) {
        console.error("Error loading activity logs:", error);
      } finally {
        this.loading = false;
      }
    },
    getInitials(user) {
      if (!user) return "?";
      const first = user.first_name ? user.first_name.charAt(0) : "";
      const last = user.last_name ? user.last_name.charAt(0) : "";
      return (first + last).toUpperCase();
    },
    getActivityColor(activityType) {
      const colors = {
        login: "success",
        logout: "grey",
        view: "info",
        create: "primary",
        update: "warning",
        delete: "error",
        export: "purple",
        import: "teal",
        print: "blue-grey",
        search: "cyan",
        download: "indigo",
        upload: "deep-purple",
        approve: "green",
        reject: "red",
        other: "grey",
      };
      return colors[activityType] || "grey";
    },
    getActivityIcon(activityType) {
      const icons = {
        login: "mdi-login",
        logout: "mdi-logout",
        view: "mdi-eye",
        create: "mdi-plus-circle",
        update: "mdi-pencil",
        delete: "mdi-delete",
        export: "mdi-export",
        import: "mdi-import",
        print: "mdi-printer",
        search: "mdi-magnify",
        download: "mdi-download",
        upload: "mdi-upload",
        approve: "mdi-check-circle",
        reject: "mdi-close-circle",
        other: "mdi-dots-horizontal",
      };
      return icons[activityType] || "mdi-help-circle";
    },
    getModuleIcon(module) {
      const icons = {
        dashboard: "mdi-view-dashboard",
        products: "mdi-package-variant",
        variants: "mdi-shape",
        categories: "mdi-tag-multiple",
        branches: "mdi-store",
        inventory: "mdi-warehouse",
        sales: "mdi-cash-register",
        payments: "mdi-credit-card",
        customers: "mdi-account-group",
        suppliers: "mdi-truck",
        consignments: "mdi-package",
        transfers: "mdi-swap-horizontal",
        layaway: "mdi-calendar-clock",
        reports: "mdi-chart-bar",
        users: "mdi-account-cog",
        settings: "mdi-cog",
      };
      return icons[module] || "mdi-folder";
    },
    formatActivityType(type) {
      if (!type) return "";
      return type.charAt(0).toUpperCase() + type.slice(1);
    },
    formatModule(module) {
      if (!module) return "";
      return module.charAt(0).toUpperCase() + module.slice(1);
    },
    formatDateTime(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString();
    },
    editItem(item) {
      eventBus.emit("editUserActivityLog", item);
    },
    deleteItem(item) {
      this.deleteId = item.id;
      this.dialogDelete = true;
    },
    closeDelete() {
      this.dialogDelete = false;
      this.deleteId = null;
    },
    async deleteItemConfirm() {
      try {
        await this.axiosCall(`/user-activity-logs/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (error) {
        console.error("Error deleting activity log:", error);
      } finally {
        this.closeDelete();
      }
    },
  },
};
</script>

<style scoped>
</style>
