<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Layaway Plans</h2>
          <small class="text-medium-emphasis">
            Manage customer layaway installment plans
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
            New Plan
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
        loading-text="Loading layaway plans..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.planNumber`]="{ item }">
          <span class="font-weight-medium">{{ item.planNumber }}</span>
        </template>

        <template v-slot:[`item.sale`]="{ item }">
          <span v-if="item.sale">{{ item.sale.saleNumber }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.customer`]="{ item }">
          <span v-if="item.customer">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.branch`]="{ item }">
          <span v-if="item.branch">{{ item.branch.branchName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.totalAmount`]="{ item }">
          <span class="font-weight-bold">₱{{ formatNumber(item.totalAmount) }}</span>
        </template>

        <template v-slot:[`item.remainingBalance`]="{ item }">
          <span :class="{ 'text-error': Number(item.remainingBalance) > 0 }">
            ₱{{ formatNumber(item.remainingBalance) }}
          </span>
        </template>

        <template v-slot:[`item.progress`]="{ item }">
          <div class="d-flex align-center" style="min-width: 120px;">
            <v-progress-linear
              :model-value="getProgress(item)"
              :color="getProgressColor(item)"
              height="8"
              rounded
              class="mr-2"
            />
            <small class="text-no-wrap">{{ item.paymentsMade }}/{{ item.numberOfPayments }}</small>
          </div>
        </template>

        <template v-slot:[`item.nextPaymentDate`]="{ item }">
          <div v-if="item.nextPaymentDate">
            <span :class="{ 'text-error font-weight-medium': isOverdue(item.nextPaymentDate) }">
              {{ formatDate(item.nextPaymentDate) }}
            </span>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
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
            :disabled="item.status === 'completed'"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No layaway plans found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <LayawayPlansDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this layaway plan?
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
import LayawayPlansDialog from "../../components/Dialogs/Forms/LayawayPlansDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    LayawayPlansDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Plan #", value: "planNumber", align: "start", width: 160 },
      { title: "Sale #", value: "sale", align: "start", width: 140 },
      { title: "Customer", value: "customer", align: "start" },
      { title: "Branch", value: "branch", align: "start", width: 120 },
      { title: "Total", value: "totalAmount", align: "end", width: 110 },
      { title: "Balance", value: "remainingBalance", align: "end", width: 110 },
      { title: "Progress", value: "progress", align: "center", width: 150 },
      { title: "Next Payment", value: "nextPaymentDate", align: "center", width: 130 },
      { title: "Status", value: "status", align: "center", width: 110 },
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
    eventBus.on("closeLayawayPlansDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeLayawayPlansDialog");
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

    getStatusColor(status) {
      switch (status) {
        case 'active': return 'success';
        case 'completed': return 'info';
        case 'defaulted': return 'error';
        case 'cancelled': return 'grey';
        default: return 'grey';
      }
    },

    getProgress(item) {
      if (!item.numberOfPayments) return 0;
      return (item.paymentsMade / item.numberOfPayments) * 100;
    },

    getProgressColor(item) {
      const progress = this.getProgress(item);
      if (progress >= 100) return 'success';
      if (progress >= 50) return 'info';
      if (progress >= 25) return 'warning';
      return 'error';
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
      this.axiosCall("/layaway-plans", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load layaway plans:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load layaway plans";
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
      this.axiosCall("/layaway-plans/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Layaway plan deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete layaway plan";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete layaway plan";
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
