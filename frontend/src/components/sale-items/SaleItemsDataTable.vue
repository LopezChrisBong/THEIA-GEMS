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
      <SaleItemsDialog />
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="saleItems"
      :search="search"
      :loading="loading"
      class="elevation-1"
      item-value="id"
    >
      <template v-slot:[`item.sale`]="{ item }">
        <v-chip v-if="item.sale" color="primary" size="small" variant="outlined">
          {{ item.sale.saleNumber }}
        </v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.product`]="{ item }">
        <span v-if="item.product">{{ item.product.productName }}</span>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.variant`]="{ item }">
        <v-chip v-if="item.variant" color="secondary" size="small" variant="tonal">
          {{ item.variant.variantSku }}
        </v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.serialNumber`]="{ item }">
        <code v-if="item.serialNumber" class="text-caption">
          {{ item.serialNumber.serialNumber }}
        </code>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.quantity`]="{ item }">
        <strong>{{ item.quantity }}</strong>
      </template>

      <template v-slot:[`item.unitPrice`]="{ item }">
        ₱{{ formatCurrency(item.unitPrice) }}
      </template>

      <template v-slot:[`item.unitCost`]="{ item }">
        <span v-if="item.unitCost">₱{{ formatCurrency(item.unitCost) }}</span>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.discountAmount`]="{ item }">
        <v-chip
          v-if="item.discountAmount > 0"
          color="orange"
          size="small"
          variant="tonal"
        >
          -₱{{ formatCurrency(item.discountAmount) }}
        </v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.lineTotal`]="{ item }">
        <strong class="text-primary">₱{{ formatCurrency(item.lineTotal) }}</strong>
      </template>

      <template v-slot:[`item.grossMargin`]="{ item }">
        <v-chip
          v-if="item.grossMargin !== null && item.grossMargin !== undefined"
          :color="getMarginColor(item.grossMargin)"
          size="small"
        >
          {{ item.grossMargin >= 0 ? '+' : '' }}₱{{ formatCurrency(item.grossMargin) }}
        </v-chip>
        <span v-else class="text-grey">-</span>
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this sale item? This action cannot be undone.
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
import SaleItemsDialog from "./SaleItemsDialog.vue";

export default {
  name: "SaleItemsDataTable",
  components: {
    SaleItemsDialog,
  },
  data() {
    return {
      search: "",
      loading: false,
      saleItems: [],
      dialogDelete: false,
      deleteId: null,
      headers: [
        { title: "ID", key: "id", width: "70px" },
        { title: "Sale", key: "sale", width: "130px" },
        { title: "Product", key: "product", width: "160px" },
        { title: "Variant", key: "variant", width: "110px" },
        { title: "Serial #", key: "serialNumber", width: "120px" },
        { title: "Qty", key: "quantity", width: "70px" },
        { title: "Unit Price", key: "unitPrice", width: "110px" },
        { title: "Unit Cost", key: "unitCost", width: "100px" },
        { title: "Discount", key: "discountAmount", width: "100px" },
        { title: "Line Total", key: "lineTotal", width: "120px" },
        { title: "Margin", key: "grossMargin", width: "110px" },
        { title: "Actions", key: "actions", sortable: false, width: "100px" },
      ],
    };
  },
  mounted() {
    this.initialize();
    eventBus.on("closeSaleItemsDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeSaleItemsDialog");
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const response = await this.axiosCall("/sale-items", "GET");
        if (response.data) {
          this.saleItems = response.data;
        }
      } catch (error) {
        console.error("Error loading sale items:", error);
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(value) {
      if (value === null || value === undefined) return "0.00";
      return parseFloat(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    getMarginColor(margin) {
      if (margin > 0) return "success";
      if (margin < 0) return "error";
      return "grey";
    },
    editItem(item) {
      eventBus.emit("editSaleItem", item);
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
        await this.axiosCall(`/sale-items/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (error) {
        console.error("Error deleting sale item:", error);
      } finally {
        this.closeDelete();
      }
    },
  },
};
</script>

<style scoped>
</style>
