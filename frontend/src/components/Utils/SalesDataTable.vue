<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Sales</h2>
          <small class="text-medium-emphasis">
            Manage sales transactions
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
            New Sale
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
        loading-text="Loading sales..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.saleNumber`]="{ item }">
          <span class="font-weight-medium">{{ item.saleNumber }}</span>
        </template>

        <template v-slot:[`item.branch`]="{ item }">
          <span v-if="item.branch">{{ item.branch.branchName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.customer`]="{ item }">
          <span v-if="item.customer">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
          <span v-else class="text-medium-emphasis">Walk-in</span>
        </template>

        <template v-slot:[`item.saleDate`]="{ item }">
          <span v-if="item.saleDate">{{ formatDateTime(item.saleDate) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.totalAmount`]="{ item }">
          <span class="font-weight-bold">₱{{ formatNumber(item.totalAmount) }}</span>
        </template>

        <template v-slot:[`item.amountPaid`]="{ item }">
          <span>₱{{ formatNumber(item.amountPaid) }}</span>
        </template>

        <template v-slot:[`item.paymentStatus`]="{ item }">
          <v-chip
            :color="getPaymentStatusColor(item.paymentStatus)"
            size="small"
            variant="flat"
          >
            {{ formatStatus(item.paymentStatus) }}
          </v-chip>
        </template>

        <template v-slot:[`item.saleType`]="{ item }">
          <v-chip
            :color="getSaleTypeColor(item.saleType)"
            size="small"
            variant="outlined"
          >
            {{ formatStatus(item.saleType) }}
          </v-chip>
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
            :disabled="item.paymentStatus === 'refunded'"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No sales found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <SalesDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this sale record?
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
import SalesDialog from "../../components/Dialogs/Forms/SalesDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    SalesDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Sale #", value: "saleNumber", align: "start", width: 160 },
      { title: "Branch", value: "branch", align: "start" },
      { title: "Customer", value: "customer", align: "start" },
      { title: "Date", value: "saleDate", align: "center", width: 160 },
      { title: "Total", value: "totalAmount", align: "end", width: 120 },
      { title: "Paid", value: "amountPaid", align: "end", width: 120 },
      { title: "Payment", value: "paymentStatus", align: "center", width: 110 },
      { title: "Type", value: "saleType", align: "center", width: 110 },
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
    eventBus.on("closeSalesDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeSalesDialog");
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

    getPaymentStatusColor(status) {
      switch (status) {
        case 'paid': return 'success';
        case 'partial': return 'warning';
        case 'layaway': return 'info';
        case 'refunded': return 'error';
        default: return 'grey';
      }
    },

    getSaleTypeColor(type) {
      switch (type) {
        case 'regular': return 'primary';
        case 'layaway': return 'info';
        case 'consignment': return 'warning';
        default: return 'grey';
      }
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/sales", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load sales:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load sales";
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
      this.axiosCall("/sales/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Sale deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete sale";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete sale";
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
