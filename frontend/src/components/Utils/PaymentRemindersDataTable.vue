<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Payment Reminders</h2>
          <small class="text-medium-emphasis">
            Manage layaway payment reminders and notifications
          </small>
        </v-col>

        <v-col cols="12" md="6" class="d-flex justify-end gap-2">
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="search-input"
          />

          <v-btn
            color="#8e6e25"
            prepend-icon="mdi-plus"
            rounded="lg"
            elevation="1"
            @click="addNew()"
          >
            New Reminder
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="data"
        :search="search"
        :items-per-page="10"
        :loading="loading"
        loading-text="Loading payment reminders..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.layawayPlan`]="{ item }">
          <span v-if="item.layawayPlan" class="font-weight-medium">{{ item.layawayPlan.planNumber }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.customer`]="{ item }">
          <span v-if="item.customer">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.reminderType`]="{ item }">
          <v-chip
            :color="getReminderTypeColor(item.reminderType)"
            size="small"
            variant="flat"
          >
            {{ formatReminderType(item.reminderType) }}
          </v-chip>
        </template>

        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template v-slot:[`item.channel`]="{ item }">
          <v-chip
            :color="getChannelColor(item.channel)"
            size="small"
            variant="outlined"
          >
            <v-icon start size="14">{{ getChannelIcon(item.channel) }}</v-icon>
            {{ formatChannel(item.channel) }}
          </v-chip>
        </template>

        <template v-slot:[`item.amountDue`]="{ item }">
          <span class="font-weight-medium">₱{{ formatNumber(item.amountDue) }}</span>
        </template>

        <template v-slot:[`item.paymentDueDate`]="{ item }">
          <span
            v-if="item.paymentDueDate"
            :class="{ 'text-error font-weight-medium': isOverdue(item.paymentDueDate) }"
          >
            {{ formatDate(item.paymentDueDate) }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.scheduledDate`]="{ item }">
          <span v-if="item.scheduledDate">{{ formatDateTime(item.scheduledDate) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="outlined"
            color="#8e6e25"
            @click="editItem(item)"
            class="mx-1"
          >
            <v-icon start size="18"> mdi-pencil-outline </v-icon>
            Edit
          </v-btn>

          <v-btn
            size="small"
            variant="outlined"
            class="mx-1"
            color="red"
            @click="deleteItem(item)"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No payment reminders found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <PaymentRemindersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this payment reminder?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            color="grey"
            @click="dialogConfirmDelete = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            class="white--text"
            @click="confirmDelete"
            :loading="deleting"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import PaymentRemindersDialog from "../../components/Dialogs/Forms/PaymentRemindersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    PaymentRemindersDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Plan #", value: "layawayPlan", align: "start", width: 150 },
      { title: "Customer", value: "customer", align: "start" },
      { title: "Type", value: "reminderType", align: "center", width: 120 },
      { title: "Status", value: "status", align: "center", width: 100 },
      { title: "Channel", value: "channel", align: "center", width: 130 },
      { title: "Amount Due", value: "amountDue", align: "end", width: 110 },
      { title: "Due Date", value: "paymentDueDate", align: "center", width: 120 },
      { title: "Scheduled", value: "scheduledDate", align: "center", width: 160 },
      {
        title: "Actions",
        value: "actions",
        align: "center",
        sortable: false,
        width: 220,
      },
    ],
    data: [],
    perPageChoices: [
      { title: "5", value: 5 },
      { title: "10", value: 10 },
      { title: "20", value: 20 },
      { title: "50", value: 50 },
      { title: "100", value: 100 },
    ],
    totalCount: 0,
    deleteData: null,
    updateData: null,

    loading: false,
    deleting: false,
    options: {},
    action: null,
    paginationData: {},
    dialogConfirmDelete: false,
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "Successfully Deleted!",
      message: "",
      top: 10,
    },
  }),

  watch: {
    options: {
      handler() {
        this.initialize();
      },
      deep: true,
    },
  },

  mounted() {
    this.initialize();
    eventBus.on("closePaymentRemindersDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closePaymentRemindersDialog");
  },

  methods: {
    pagination(data) {
      this.paginationData = data;
    },

    formatDate(dateString) {
      if (!dateString) return "—";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },

    formatDateTime(dateString) {
      if (!dateString) return "—";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    formatStatus(status) {
      if (!status) return "—";
      return status.charAt(0).toUpperCase() + status.slice(1);
    },

    formatReminderType(type) {
      if (!type) return "—";
      const labels = {
        upcoming: "Upcoming",
        due: "Due",
        overdue: "Overdue",
        final_notice: "Final Notice",
      };
      return labels[type] || type;
    },

    formatChannel(channel) {
      if (!channel) return "—";
      const labels = {
        sms: "SMS",
        email: "Email",
        phone_call: "Phone",
        in_person: "In Person",
      };
      return labels[channel] || channel;
    },

    getReminderTypeColor(type) {
      switch (type) {
        case 'upcoming': return 'info';
        case 'due': return 'warning';
        case 'overdue': return 'error';
        case 'final_notice': return 'red-darken-3';
        default: return 'grey';
      }
    },

    getStatusColor(status) {
      switch (status) {
        case 'pending': return 'warning';
        case 'sent': return 'success';
        case 'failed': return 'error';
        case 'cancelled': return 'grey';
        default: return 'grey';
      }
    },

    getChannelColor(channel) {
      switch (channel) {
        case 'sms': return 'primary';
        case 'email': return 'info';
        case 'phone_call': return 'success';
        case 'in_person': return 'warning';
        default: return 'grey';
      }
    },

    getChannelIcon(channel) {
      switch (channel) {
        case 'sms': return 'mdi-message-text';
        case 'email': return 'mdi-email';
        case 'phone_call': return 'mdi-phone';
        case 'in_person': return 'mdi-account';
        default: return 'mdi-bell';
      }
    },

    isOverdue(dateString) {
      if (!dateString) return false;
      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today > dueDate;
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/payment-reminders", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load payment reminders:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load payment reminders";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    addNew() {
      this.updateData = { id: null };
      this.action = "Add";
    },

    editItem(item) {
      this.updateData = { ...item };
      this.action = "Update";
    },

    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },

    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/payment-reminders/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment reminder deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete payment reminder";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete payment reminder";
        })
        .finally(() => {
          this.deleting = false;
        });
    },
  },
};
</script>

<style scoped>
.header-card {
  background: linear-gradient(135deg, #faf7f4, #ffffff);
}
.search-input {
  max-width: 260px;
}

.gap-2 {
  gap: 12px;
}
</style>
