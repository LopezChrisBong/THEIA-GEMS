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
      <TransactionLogsDialog />
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="transactionLogs"
      :search="search"
      :loading="loading"
      class="elevation-1"
      item-value="id"
    >
      <template v-slot:[`item.action`]="{ item }">
        <v-chip :color="getActionColor(item.action)" size="small" dark>
          <v-icon start size="small">{{ getActionIcon(item.action) }}</v-icon>
          {{ formatAction(item.action) }}
        </v-chip>
      </template>

      <template v-slot:[`item.transactionType`]="{ item }">
        <v-chip color="blue-grey" size="small" variant="outlined">
          {{ formatTransactionType(item.transactionType) }}
        </v-chip>
      </template>

      <template v-slot:[`item.tableName`]="{ item }">
        <code class="text-caption">{{ item.tableName }}</code>
      </template>

      <template v-slot:[`item.performer`]="{ item }">
        <span v-if="item.performer">
          {{ item.performer.first_name }} {{ item.performer.last_name }}
        </span>
        <span v-else class="text-grey">Unknown</span>
      </template>

      <template v-slot:[`item.oldValues`]="{ item }">
        <v-btn
          v-if="item.oldValues && Object.keys(item.oldValues).length > 0"
          size="x-small"
          color="orange"
          variant="tonal"
          @click="showJsonDialog('Old Values', item.oldValues)"
        >
          <v-icon start size="small">mdi-code-json</v-icon>
          View
        </v-btn>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.newValues`]="{ item }">
        <v-btn
          v-if="item.newValues && Object.keys(item.newValues).length > 0"
          size="x-small"
          color="green"
          variant="tonal"
          @click="showJsonDialog('New Values', item.newValues)"
        >
          <v-icon start size="small">mdi-code-json</v-icon>
          View
        </v-btn>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.ipAddress`]="{ item }">
        <code v-if="item.ipAddress" class="text-caption">{{ item.ipAddress }}</code>
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

    <!-- JSON Preview Dialog -->
    <v-dialog v-model="jsonDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-code-json</v-icon>
          {{ jsonDialogTitle }}
          <v-spacer></v-spacer>
          <v-btn icon @click="jsonDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <pre class="json-preview pa-3 rounded">{{ jsonDialogContent }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="copyJson">
            <v-icon start>mdi-content-copy</v-icon>
            Copy
          </v-btn>
          <v-btn color="grey" variant="text" @click="jsonDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this transaction log? This action cannot be undone.
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
import TransactionLogsDialog from "./TransactionLogsDialog.vue";

export default {
  name: "TransactionLogsDataTable",
  components: {
    TransactionLogsDialog,
  },
  data() {
    return {
      search: "",
      loading: false,
      transactionLogs: [],
      dialogDelete: false,
      deleteId: null,
      jsonDialog: false,
      jsonDialogTitle: "",
      jsonDialogContent: "",
      headers: [
        { title: "ID", key: "id", width: "70px" },
        { title: "Action", key: "action", width: "120px" },
        { title: "Type", key: "transactionType", width: "120px" },
        { title: "Trans. ID", key: "transactionId", width: "100px" },
        { title: "Table", key: "tableName", width: "120px" },
        { title: "Old Values", key: "oldValues", width: "100px", sortable: false },
        { title: "New Values", key: "newValues", width: "100px", sortable: false },
        { title: "Performed By", key: "performer", width: "140px" },
        { title: "IP Address", key: "ipAddress", width: "130px" },
        { title: "Created At", key: "createdAt", width: "160px" },
        { title: "Actions", key: "actions", sortable: false, width: "100px" },
      ],
    };
  },
  mounted() {
    this.initialize();
    eventBus.on("closeTransactionLogsDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeTransactionLogsDialog");
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const response = await this.axiosCall("/transaction-logs", "GET");
        if (response.data) {
          this.transactionLogs = response.data;
        }
      } catch (error) {
        console.error("Error loading transaction logs:", error);
      } finally {
        this.loading = false;
      }
    },
    getActionColor(action) {
      const colors = {
        create: "success",
        update: "warning",
        delete: "error",
      };
      return colors[action] || "grey";
    },
    getActionIcon(action) {
      const icons = {
        create: "mdi-plus-circle",
        update: "mdi-pencil-circle",
        delete: "mdi-delete-circle",
      };
      return icons[action] || "mdi-help-circle";
    },
    formatAction(action) {
      return action ? action.charAt(0).toUpperCase() + action.slice(1) : "";
    },
    formatTransactionType(type) {
      if (!type) return "";
      return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
    formatDateTime(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString();
    },
    showJsonDialog(title, content) {
      this.jsonDialogTitle = title;
      this.jsonDialogContent = JSON.stringify(content, null, 2);
      this.jsonDialog = true;
    },
    copyJson() {
      navigator.clipboard.writeText(this.jsonDialogContent);
    },
    editItem(item) {
      eventBus.emit("editTransactionLog", item);
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
        await this.axiosCall(`/transaction-logs/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (error) {
        console.error("Error deleting transaction log:", error);
      } finally {
        this.closeDelete();
      }
    },
  },
};
</script>

<style scoped>
.json-preview {
  background-color: #f5f5f5;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}
</style>
