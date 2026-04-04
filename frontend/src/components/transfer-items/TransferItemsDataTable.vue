<template>
  <v-card>
    <v-card-title class="d-flex align-center pa-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        density="compact"
        variant="outlined"
        clearable
        class="mr-4"
        style="max-width: 300px"
      />
      <v-spacer />
      <TransferItemsDialog />
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="transferItems"
      :search="search"
      :loading="loading"
      loading-text="Loading transfer items..."
      class="elevation-1"
      item-value="id"
      density="comfortable"
    >
      <template v-slot:[`item.transfer`]="{ item }">
        <v-chip v-if="item.transfer" color="primary" size="small" variant="outlined">
          {{ item.transfer.transferNumber }}
        </v-chip>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template v-slot:[`item.jewelryItem`]="{ item }">
        <div v-if="item.jewelryItem">
          <strong>{{ item.jewelryItem.itemCode }}</strong>
          <br v-if="item.jewelryItem.brand">
          <small v-if="item.jewelryItem.brand" class="text-medium-emphasis">{{ item.jewelryItem.brand }}</small>
        </div>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template v-slot:[`item.notes`]="{ item }">
        <span v-if="item.notes" class="text-truncate" style="max-width: 200px; display: inline-block;">
          {{ item.notes }}
        </span>
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
          <v-icon start size="18">mdi-pencil-outline</v-icon>
          Edit
        </v-btn>
        <v-btn
          size="small"
          variant="outlined"
          color="red"
          @click="deleteItem(item)"
          class="mx-1"
        >
          <v-icon start size="18">mdi-delete-outline</v-icon>
          Delete
        </v-btn>
      </template>

      <template #no-data>
        <v-alert type="info" class="ma-4" icon="mdi-information">
          No transfer items found.
        </v-alert>
      </template>
    </v-data-table>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this transfer item?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" @click="deleteItemConfirm" :loading="deleting">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import eventBus from "@/eventBus";
import TransferItemsDialog from "./TransferItemsDialog.vue";

export default {
  name: "TransferItemsDataTable",
  components: {
    TransferItemsDialog,
  },
  data() {
    return {
      search: "",
      loading: false,
      deleting: false,
      transferItems: [],
      dialogDelete: false,
      deleteId: null,
      headers: [
        { title: "Transfer", key: "transfer", width: "200px" },
        { title: "Item", key: "jewelryItem", width: "200px" },
        { title: "Notes", key: "notes" },
        { title: "Actions", key: "actions", sortable: false, width: "220px", align: "center" },
      ],
    };
  },
  mounted() {
    this.initialize();
    eventBus.on("closeTransferItemsDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeTransferItemsDialog");
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const response = await this.axiosCall("/transfer-items", "GET");
        if (response && response.data) {
          this.transferItems = response.data;
        }
      } catch (error) {
        console.error("Error loading transfer items:", error);
      } finally {
        this.loading = false;
      }
    },

    editItem(item) {
      eventBus.emit("editTransferItem", item);
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
      this.deleting = true;
      try {
        await this.axiosCall(`/transfer-items/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (error) {
        console.error("Error deleting transfer item:", error);
      } finally {
        this.deleting = false;
        this.closeDelete();
      }
    },
  },
};
</script>
