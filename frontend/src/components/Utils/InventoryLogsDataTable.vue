<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Inventory Logs</h2>
          <small class="text-medium-emphasis">
            Track all inventory changes and movements
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
            Add Log
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
        loading-text="Loading inventory logs..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.product`]="{ item }">
          <div v-if="item.product">
            <span class="font-weight-medium">{{ item.product.productName }}</span>
            <br>
            <small class="text-medium-emphasis">{{ item.product.sku }}</small>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.variant`]="{ item }">
          <span v-if="item.variant">{{ item.variant.variantSku }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.branch`]="{ item }">
          <span v-if="item.branch">{{ item.branch.branchName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.actionType`]="{ item }">
          <v-chip
            :color="getActionTypeColor(item.actionType)"
            size="small"
            variant="flat"
          >
            <v-icon start size="14">{{ getActionTypeIcon(item.actionType) }}</v-icon>
            {{ formatActionType(item.actionType) }}
          </v-chip>
        </template>

        <template v-slot:[`item.quantityChange`]="{ item }">
          <span
            :class="{
              'text-success font-weight-medium': item.quantityChange > 0,
              'text-error font-weight-medium': item.quantityChange < 0,
            }"
          >
            {{ item.quantityChange > 0 ? '+' : '' }}{{ item.quantityChange }}
          </span>
        </template>

        <template v-slot:[`item.quantities`]="{ item }">
          <span>{{ item.previousQuantity }} → {{ item.newQuantity }}</span>
        </template>

        <template v-slot:[`item.reference`]="{ item }">
          <div v-if="item.referenceType || item.referenceId">
            <span class="font-weight-medium">{{ item.referenceType || '—' }}</span>
            <br v-if="item.referenceId">
            <small v-if="item.referenceId" class="text-medium-emphasis">#{{ item.referenceId }}</small>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.performer`]="{ item }">
          <span v-if="item.performer">{{ item.performer.firstName }} {{ item.performer.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.createdAt`]="{ item }">
          <span v-if="item.createdAt">{{ formatDateTime(item.createdAt) }}</span>
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
            No inventory logs found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <InventoryLogsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this inventory log?
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
import InventoryLogsDialog from "../../components/Dialogs/Forms/InventoryLogsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    InventoryLogsDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Product", value: "product", align: "start" },
      { title: "Variant", value: "variant", align: "start", width: 100 },
      { title: "Branch", value: "branch", align: "start", width: 120 },
      { title: "Action", value: "actionType", align: "center", width: 140 },
      { title: "Change", value: "quantityChange", align: "center", width: 90 },
      { title: "Qty (Before → After)", value: "quantities", align: "center", width: 150 },
      { title: "Reference", value: "reference", align: "start", width: 120 },
      { title: "By", value: "performer", align: "start", width: 130 },
      { title: "Date", value: "createdAt", align: "center", width: 150 },
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
    eventBus.on("closeInventoryLogsDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeInventoryLogsDialog");
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

    formatActionType(type) {
      if (!type) return "—";
      const labels = {
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        adjust: "Adjust",
        transfer_out: "Transfer Out",
        transfer_in: "Transfer In",
        sale: "Sale",
        return: "Return",
      };
      return labels[type] || type;
    },

    getActionTypeColor(type) {
      switch (type) {
        case 'add': return 'success';
        case 'edit': return 'info';
        case 'delete': return 'error';
        case 'adjust': return 'warning';
        case 'transfer_out': return 'orange';
        case 'transfer_in': return 'teal';
        case 'sale': return 'primary';
        case 'return': return 'purple';
        default: return 'grey';
      }
    },

    getActionTypeIcon(type) {
      switch (type) {
        case 'add': return 'mdi-plus-circle';
        case 'edit': return 'mdi-pencil';
        case 'delete': return 'mdi-delete';
        case 'adjust': return 'mdi-tune';
        case 'transfer_out': return 'mdi-arrow-right-bold';
        case 'transfer_in': return 'mdi-arrow-left-bold';
        case 'sale': return 'mdi-cart';
        case 'return': return 'mdi-undo';
        default: return 'mdi-help-circle';
      }
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/inventory-logs", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load inventory logs:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load inventory logs";
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
      this.axiosCall("/inventory-logs/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Inventory log deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete inventory log";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete inventory log";
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
