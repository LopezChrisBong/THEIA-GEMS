<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Transfers</h2>
          <small class="text-medium-emphasis">
            Manage inventory transfers between branches
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
            New Transfer
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
        loading-text="Loading transfers..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.transferNumber`]="{ item }">
          <span class="font-weight-medium">{{ item.transferNumber }}</span>
        </template>

        <template v-slot:[`item.fromBranch`]="{ item }">
          <span v-if="item.fromBranch">{{ item.fromBranch.branchName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.toBranch`]="{ item }">
          <span v-if="item.toBranch">{{ item.toBranch.branchName }}</span>
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

        <template v-slot:[`item.requester`]="{ item }">
          <span v-if="item.requester">{{ item.requester.firstName }} {{ item.requester.lastName }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.transferDate`]="{ item }">
          <span v-if="item.transferDate">{{ formatDate(item.transferDate) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:[`item.receivedDate`]="{ item }">
          <span v-if="item.receivedDate">{{ formatDate(item.receivedDate) }}</span>
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
            :disabled="item.status === 'completed'"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No transfers found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <TransfersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this transfer?
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
import TransfersDialog from "../../components/Dialogs/Forms/TransfersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    TransfersDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "ID", value: "id", align: "start", width: 70 },
      { title: "Transfer #", value: "transferNumber", align: "start", width: 160 },
      { title: "From Branch", value: "fromBranch", align: "start" },
      { title: "To Branch", value: "toBranch", align: "start" },
      { title: "Status", value: "status", align: "center", width: 120 },
      { title: "Requested By", value: "requester", align: "start", width: 140 },
      { title: "Transfer Date", value: "transferDate", align: "center", width: 130 },
      { title: "Received Date", value: "receivedDate", align: "center", width: 130 },
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
    eventBus.on("closeTransfersDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeTransfersDialog");
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

    formatStatus(status) {
      if (!status) return "—";
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    getStatusColor(status) {
      switch (status) {
        case 'pending': return 'warning';
        case 'approved': return 'info';
        case 'in_transit': return 'primary';
        case 'completed': return 'success';
        case 'rejected': return 'error';
        default: return 'grey';
      }
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/transfers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load transfers:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load transfers";
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
      this.axiosCall("/transfers/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Transfer deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete transfer";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete transfer";
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
