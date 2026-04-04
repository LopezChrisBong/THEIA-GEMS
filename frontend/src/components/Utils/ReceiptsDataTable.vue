<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Receipts</h2>
          <small class="text-medium-emphasis">
            Manage sales receipts and print history
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
            New Receipt
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
        loading-text="Loading receipts..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.receiptNumber`]="{ item }">
          <span class="font-weight-medium">{{ item.receiptNumber }}</span>
        </template>

        <template v-slot:[`item.sale`]="{ item }">
          <div v-if="item.sale">
            <span class="font-weight-medium">{{ item.sale.saleNumber }}</span>
            <br>
            <small class="text-medium-emphasis">₱{{ formatNumber(item.sale.totalAmount) }}</small>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.branch`]="{ item }">
          <span v-if="item.branch">{{ item.branch.branchName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.printStatus`]="{ item }">
          <v-chip
            :color="item.printedAt ? 'success' : 'warning'"
            size="small"
            variant="flat"
          >
            {{ item.printedAt ? 'Printed' : 'Not Printed' }}
          </v-chip>
        </template>

        <template v-slot:[`item.printedAt`]="{ item }">
          <span v-if="item.printedAt">{{ formatDateTime(item.printedAt) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.printer`]="{ item }">
          <span v-if="item.printer">{{ item.printer.firstName }} {{ item.printer.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.reprintCount`]="{ item }">
          <v-chip
            :color="getReprintColor(item.reprintCount)"
            size="small"
            variant="outlined"
          >
            {{ item.reprintCount || 0 }}
          </v-chip>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="outlined"
            color="primary"
            @click="printReceipt(item)"
            class="mx-1"
          >
            <v-icon start size="18"> mdi-printer </v-icon>
            Print
          </v-btn>

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
            No receipts found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <ReceiptsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this receipt?
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
import ReceiptsDialog from "../../components/Dialogs/Forms/ReceiptsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    ReceiptsDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Receipt #", value: "receiptNumber", align: "start", width: 160 },
      { title: "Sale", value: "sale", align: "start", width: 160 },
      { title: "Branch", value: "branch", align: "start" },
      { title: "Status", value: "printStatus", align: "center", width: 120 },
      { title: "Printed At", value: "printedAt", align: "center", width: 160 },
      { title: "Printed By", value: "printer", align: "start", width: 140 },
      { title: "Reprints", value: "reprintCount", align: "center", width: 90 },
      {
        title: "Actions",
        value: "actions",
        align: "center",
        sortable: false,
        width: 280,
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
    eventBus.on("closeReceiptsDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeReceiptsDialog");
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

    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    getReprintColor(count) {
      if (!count || count === 0) return 'grey';
      if (count >= 3) return 'error';
      if (count >= 1) return 'warning';
      return 'grey';
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/receipts", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load receipts:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load receipts";
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

    printReceipt(item) {
      this.fadeAwayMessage.show = true;
      this.fadeAwayMessage.type = "info";
      this.fadeAwayMessage.header = "Print";
      this.fadeAwayMessage.message = `Printing receipt ${item.receiptNumber}...`;
      // Implement actual print logic here
    },

    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },

    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/receipts/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Receipt deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete receipt";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete receipt";
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
