<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Promotional Messages</h2>
          <small class="text-medium-emphasis">
            Manage marketing and promotional communications
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
            New Message
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
        loading-text="Loading promotional messages..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.messageType`]="{ item }">
          <v-chip
            :color="getMessageTypeColor(item.messageType)"
            size="small"
            variant="flat"
          >
            {{ formatMessageType(item.messageType) }}
          </v-chip>
        </template>

        <template v-slot:[`item.customer`]="{ item }">
          <span v-if="item.customer">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
          <span v-else class="text-medium-emphasis font-italic">Broadcast</span>
        </template>

        <template v-slot:[`item.sendMethod`]="{ item }">
          <v-chip
            :color="getSendMethodColor(item.sendMethod)"
            size="small"
            variant="outlined"
          >
            <v-icon start size="14">{{ getSendMethodIcon(item.sendMethod) }}</v-icon>
            {{ formatSendMethod(item.sendMethod) }}
          </v-chip>
        </template>

        <template v-slot:[`item.subject`]="{ item }">
          <span v-if="item.subject" class="text-truncate" style="max-width: 150px; display: inline-block;">
            {{ item.subject }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.messageContent`]="{ item }">
          <span class="text-truncate" style="max-width: 200px; display: inline-block;">
            {{ item.messageContent }}
          </span>
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

        <template v-slot:[`item.scheduledDate`]="{ item }">
          <span v-if="item.scheduledDate">{{ formatDateTime(item.scheduledDate) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.sentAt`]="{ item }">
          <span v-if="item.sentAt">{{ formatDateTime(item.sentAt) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.creator`]="{ item }">
          <span v-if="item.creator">{{ item.creator.firstName }} {{ item.creator.lastName }}</span>
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
            :disabled="item.status === 'sent'"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No promotional messages found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <PromotionalMessagesDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this promotional message?
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
import PromotionalMessagesDialog from "../../components/Dialogs/Forms/PromotionalMessagesDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    PromotionalMessagesDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Type", value: "messageType", align: "center", width: 130 },
      { title: "Recipient", value: "customer", align: "start", width: 140 },
      { title: "Method", value: "sendMethod", align: "center", width: 110 },
      { title: "Subject", value: "subject", align: "start", width: 150 },
      { title: "Message", value: "messageContent", align: "start" },
      { title: "Status", value: "status", align: "center", width: 110 },
      { title: "Scheduled", value: "scheduledDate", align: "center", width: 150 },
      { title: "Sent At", value: "sentAt", align: "center", width: 150 },
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
    eventBus.on("closePromotionalMessagesDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closePromotionalMessagesDialog");
  },

  methods: {
    pagination(data) {
      this.paginationData = data;
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

    formatStatus(status) {
      if (!status) return "—";
      return status.charAt(0).toUpperCase() + status.slice(1);
    },

    formatMessageType(type) {
      if (!type) return "—";
      return type.charAt(0).toUpperCase() + type.slice(1);
    },

    formatSendMethod(method) {
      if (!method) return "—";
      const labels = {
        email: "Email",
        sms: "SMS",
        both: "Both",
      };
      return labels[method] || method;
    },

    getMessageTypeColor(type) {
      switch (type) {
        case 'promotional': return 'success';
        case 'reminder': return 'warning';
        case 'announcement': return 'info';
        default: return 'grey';
      }
    },

    getStatusColor(status) {
      switch (status) {
        case 'draft': return 'grey';
        case 'scheduled': return 'info';
        case 'sent': return 'success';
        case 'failed': return 'error';
        default: return 'grey';
      }
    },

    getSendMethodColor(method) {
      switch (method) {
        case 'email': return 'primary';
        case 'sms': return 'success';
        case 'both': return 'warning';
        default: return 'grey';
      }
    },

    getSendMethodIcon(method) {
      switch (method) {
        case 'email': return 'mdi-email';
        case 'sms': return 'mdi-message-text';
        case 'both': return 'mdi-message-badge';
        default: return 'mdi-send';
      }
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/promotional-messages", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load promotional messages:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load promotional messages";
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
      this.axiosCall("/promotional-messages/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Promotional message deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete promotional message";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete promotional message";
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
