<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Customers</h2>
          <small class="text-medium-emphasis">
            Manage customer information and purchase history
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
            Add Customer
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
        loading-text="Loading customers..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.customerCode`]="{ item }">
          <span v-if="item.customerCode" class="font-weight-medium">{{ item.customerCode }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.name`]="{ item }">
          <div>
            <span class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</span>
            <br v-if="item.email">
            <small v-if="item.email" class="text-medium-emphasis">{{ item.email }}</small>
          </div>
        </template>

        <template v-slot:[`item.phone`]="{ item }">
          <span v-if="item.phone">{{ item.phone }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.isRepeatBuyer`]="{ item }">
          <v-chip
            :color="item.isRepeatBuyer ? 'success' : 'grey'"
            size="small"
            variant="flat"
          >
            {{ item.isRepeatBuyer ? 'Yes' : 'No' }}
          </v-chip>
        </template>

        <template v-slot:[`item.totalPurchases`]="{ item }">
          <span class="font-weight-medium">₱{{ formatNumber(item.totalPurchases) }}</span>
        </template>

        <template v-slot:[`item.purchaseCount`]="{ item }">
          <v-chip
            :color="getPurchaseCountColor(item.purchaseCount)"
            size="small"
            variant="flat"
          >
            {{ item.purchaseCount || 0 }}
          </v-chip>
        </template>

        <template v-slot:[`item.lastPurchaseAt`]="{ item }">
          <span v-if="item.lastPurchaseAt">{{ formatDate(item.lastPurchaseAt) }}</span>
          <span v-else class="text-medium-emphasis">Never</span>
        </template>

        <template v-slot:[`item.registeredAt`]="{ item }">
          <span v-if="item.registeredAt">{{ formatDate(item.registeredAt) }}</span>
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
            No customers found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <CustomersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this customer?
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
import CustomersDialog from "../../components/Dialogs/Forms/CustomersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    CustomersDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Code", value: "customerCode", align: "start", width: 100 },
      { title: "Name", value: "name", align: "start" },
      { title: "Phone", value: "phone", align: "start", width: 130 },
      { title: "Repeat Buyer", value: "isRepeatBuyer", align: "center", width: 120 },
      { title: "Total Purchases", value: "totalPurchases", align: "end", width: 140 },
      { title: "Orders", value: "purchaseCount", align: "center", width: 90 },
      { title: "Last Purchase", value: "lastPurchaseAt", align: "center", width: 130 },
      { title: "Registered", value: "registeredAt", align: "center", width: 120 },
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
    eventBus.on("closeCustomersDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeCustomersDialog");
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

    getPurchaseCountColor(count) {
      if (!count || count === 0) return 'grey';
      if (count >= 10) return 'success';
      if (count >= 5) return 'info';
      return 'warning';
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load customers:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load customers";
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
      this.axiosCall("/customers/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Customer deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete customer";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete customer";
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
