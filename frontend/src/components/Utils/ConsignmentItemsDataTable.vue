<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="4">
          <h2 class="mb-1 font-weight-medium">Consignment Items</h2>
          <small class="text-medium-emphasis">
            Manage consignment items from consignors
          </small>
        </v-col>

        <v-col cols="12" md="8" class="d-flex justify-end gap-2 flex-wrap">
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            label="Status"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="filter-input"
            @update:modelValue="initialize"
          />

          <v-select
            v-model="filterBranch"
            :items="branchList"
            item-title="branchName"
            item-value="branchId"
            label="Branch"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="filter-input"
            @update:modelValue="initialize"
          />

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
            Add Consignment
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
        loading-text="Loading consignment items..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.jewelryItem`]="{ item }">
          <div v-if="item.jewelryItem">
            <strong>{{ item.jewelryItem.itemCode }}</strong>
            <br v-if="item.jewelryItem.brand">
            <small v-if="item.jewelryItem.brand" class="text-medium-emphasis">{{ item.jewelryItem.brand }}</small>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.consignorName`]="{ item }">
          <div>
            <span class="font-weight-medium">{{ item.consignorName }}</span>
            <br v-if="item.consignorContact">
            <small v-if="item.consignorContact" class="text-medium-emphasis">{{ item.consignorContact }}</small>
          </div>
        </template>

        <template v-slot:[`item.consignedPrice`]="{ item }">
          <span>₱{{ formatNumber(item.consignedPrice) }}</span>
        </template>

        <template v-slot:[`item.sellingPrice`]="{ item }">
          <span>₱{{ formatNumber(item.sellingPrice) }}</span>
        </template>

        <template v-slot:[`item.commissionRate`]="{ item }">
          <span v-if="item.commissionRate">{{ item.commissionRate }}%</span>
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

        <template v-slot:[`item.branch`]="{ item }">
          <v-chip v-if="item.branch" color="primary" size="small" variant="outlined">
            {{ item.branch.branchName }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.consignmentDate`]="{ item }">
          <span v-if="item.consignmentDate">{{ formatDate(item.consignmentDate) }}</span>
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
            No consignment items found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <ConsignmentItemsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete the consignment for "{{ deleteData?.jewelryItem?.itemCode || deleteData?.consignorName }}"?
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
import ConsignmentItemsDialog from "../../components/Dialogs/Forms/ConsignmentItemsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    ConsignmentItemsDialog,
  },

  data: () => ({
    search: "",
    filterStatus: null,
    filterBranch: null,
    headers: [
      { title: "Item", value: "jewelryItem", align: "start" },
      { title: "Consignor", value: "consignorName", align: "start" },
      { title: "Consigned Price", value: "consignedPrice", align: "end", width: 140 },
      { title: "Selling Price", value: "sellingPrice", align: "end", width: 130 },
      { title: "Commission", value: "commissionRate", align: "center", width: 110 },
      { title: "Status", value: "status", align: "center", width: 110 },
      { title: "Branch", value: "branch", align: "center", width: 130 },
      { title: "Date", value: "consignmentDate", align: "center", width: 120 },
      {
        title: "Actions",
        value: "actions",
        align: "center",
        sortable: false,
        width: 220,
      },
    ],
    statusOptions: [
      { label: "Active", value: "active" },
      { label: "Sold", value: "sold" },
      { label: "Returned", value: "returned" },
    ],
    data: [],
    branchList: [],
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
    this.loadBranches();
    eventBus.on("closeConsignmentItemsDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeConsignmentItemsDialog");
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
      return Number(value).toLocaleString("en-PH", {
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
        case "active": return "success";
        case "sold": return "info";
        case "returned": return "warning";
        default: return "grey";
      }
    },

    loadBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res && res.data) {
          this.branchList = res.data;
        }
      });
    },

    initialize() {
      this.loading = true;
      let url = "/consignment-items";
      if (this.filterStatus) {
        url = "/consignment-items/status/" + this.filterStatus;
      }
      if (this.filterBranch) {
        url = "/consignment-items/branch/" + this.filterBranch;
      }

      this.axiosCall(url, "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load consignment items:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load consignment items";
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
      this.axiosCall("/consignment-items/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Consignment item deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete consignment item";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete consignment item";
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
  max-width: 220px;
}
.filter-input {
  max-width: 160px;
}
.gap-2 {
  gap: 12px;
}
</style>
