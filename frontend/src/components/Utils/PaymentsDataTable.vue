<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Payments</h2>
          <small class="text-medium-emphasis">
            Manage payment transactions
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
            New Payment
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
        loading-text="Loading payments..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.paymentNumber`]="{ item }">
          <span class="font-weight-medium">{{ item.paymentNumber }}</span>
        </template>

        <template v-slot:[`item.sale`]="{ item }">
          <span v-if="item.sale" class="font-weight-medium">{{ item.sale.saleNumber }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.amount`]="{ item }">
          <span class="font-weight-bold">₱{{ formatNumber(item.amount) }}</span>
        </template>

        <template v-slot:[`item.paymentMethod`]="{ item }">
          <v-chip
            :color="getMethodColor(item.paymentMethod)"
            size="small"
            variant="outlined"
          >
            {{ formatMethodLabel(item.paymentMethod) }}
          </v-chip>
        </template>

        <template v-slot:[`item.paymentType`]="{ item }">
          <v-chip
            :color="getTypeColor(item.paymentType)"
            size="small"
            variant="flat"
          >
            {{ formatStatus(item.paymentType) }}
          </v-chip>
        </template>

        <template v-slot:[`item.referenceNumber`]="{ item }">
          <span v-if="item.referenceNumber">{{ item.referenceNumber }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.receiver`]="{ item }">
          <span v-if="item.receiver">{{ item.receiver.firstName }} {{ item.receiver.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.paymentDate`]="{ item }">
          <span v-if="item.paymentDate">{{ formatDateTime(item.paymentDate) }}</span>
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
            No payments found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <PaymentsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this payment record?
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
import PaymentsDialog from "../../components/Dialogs/Forms/PaymentsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    PaymentsDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Payment #", value: "paymentNumber", align: "start", width: 160 },
      { title: "Sale #", value: "sale", align: "start", width: 150 },
      { title: "Amount", value: "amount", align: "end", width: 120 },
      { title: "Method", value: "paymentMethod", align: "center", width: 130 },
      { title: "Type", value: "paymentType", align: "center", width: 100 },
      { title: "Reference", value: "referenceNumber", align: "start", width: 130 },
      { title: "Received By", value: "receiver", align: "start", width: 140 },
      { title: "Date", value: "paymentDate", align: "center", width: 160 },
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
    eventBus.on("closePaymentsDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closePaymentsDialog");
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

    formatStatus(status) {
      if (!status) return "—";
      return status.charAt(0).toUpperCase() + status.slice(1);
    },

    formatMethodLabel(method) {
      if (!method) return "—";
      const labels = {
        cash: "Cash",
        credit_card: "Credit Card",
        debit_card: "Debit Card",
        bank_transfer: "Bank Transfer",
        gcash: "GCash",
        maya: "Maya",
        check: "Check",
        other: "Other",
      };
      return labels[method] || method;
    },

    getMethodColor(method) {
      switch (method) {
        case 'cash': return 'success';
        case 'credit_card': return 'primary';
        case 'debit_card': return 'info';
        case 'bank_transfer': return 'indigo';
        case 'gcash': return 'blue';
        case 'maya': return 'green';
        case 'check': return 'orange';
        case 'other': return 'grey';
        default: return 'grey';
      }
    },

    getTypeColor(type) {
      switch (type) {
        case 'full': return 'success';
        case 'partial': return 'warning';
        case 'deposit': return 'info';
        case 'layaway': return 'primary';
        case 'refund': return 'error';
        default: return 'grey';
      }
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/payments", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load payments:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load payments";
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
      this.axiosCall("/payments/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete payment";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete payment";
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
