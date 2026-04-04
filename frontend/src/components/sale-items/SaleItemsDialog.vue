<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" color="primary" dark>
        <v-icon left>mdi-plus</v-icon>
        New Sale Item
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        <span>{{ formTitle }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeD">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.saleId"
                  :items="sales"
                  item-title="displayName"
                  item-value="id"
                  label="Sale *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="editedItem.productId"
                  :items="products"
                  item-title="productName"
                  item-value="id"
                  label="Product *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:modelValue="onProductChange"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="editedItem.variantId"
                  :items="filteredVariants"
                  item-title="displayName"
                  item-value="id"
                  label="Variant"
                  variant="outlined"
                  density="compact"
                  clearable
                  :disabled="!editedItem.productId"
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.serialNumberId"
                  :items="filteredSerialNumbers"
                  item-title="serialNumber"
                  item-value="id"
                  label="Serial Number"
                  variant="outlined"
                  density="compact"
                  clearable
                  :disabled="!editedItem.productId"
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.quantity"
                  label="Quantity *"
                  :rules="[rules.required, rules.positiveNumber]"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="compact"
                  @input="calculateLineTotal"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.unitPrice"
                  label="Unit Price *"
                  :rules="[rules.required, rules.nonNegative]"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  @input="calculateLineTotal"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.unitCost"
                  label="Unit Cost"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  @input="calculateGrossMargin"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.discountAmount"
                  label="Discount Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  @input="calculateLineTotal"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.lineTotal"
                  label="Line Total"
                  type="number"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="grey-lighten-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.grossMargin"
                  label="Gross Margin"
                  type="number"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="grey-lighten-3"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeD">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" @click="save" :disabled="!valid">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  name: "SaleItemsDialog",
  data() {
    return {
      dialog: false,
      valid: false,
      editedIndex: -1,
      editedItem: {
        saleId: null,
        productId: null,
        variantId: null,
        serialNumberId: null,
        quantity: 1,
        unitPrice: 0,
        unitCost: null,
        discountAmount: 0,
        lineTotal: 0,
        grossMargin: null,
      },
      defaultItem: {
        saleId: null,
        productId: null,
        variantId: null,
        serialNumberId: null,
        quantity: 1,
        unitPrice: 0,
        unitCost: null,
        discountAmount: 0,
        lineTotal: 0,
        grossMargin: null,
      },
      sales: [],
      products: [],
      variants: [],
      serialNumbers: [],
      rules: {
        required: (v) => !!v || v === 0 || "This field is required",
        positiveNumber: (v) => (v && v > 0) || "Must be greater than 0",
        nonNegative: (v) => v >= 0 || "Cannot be negative",
      },
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Sale Item" : "Edit Sale Item";
    },
    filteredVariants() {
      if (!this.editedItem.productId) return [];
      return this.variants
        .filter((v) => v.productId === this.editedItem.productId)
        .map((v) => ({
          ...v,
          displayName: `${v.variantSku} - ${v.variantName || ""}`.trim(),
        }));
    },
    filteredSerialNumbers() {
      if (!this.editedItem.productId) return [];
      return this.serialNumbers.filter(
        (sn) => sn.productId === this.editedItem.productId
      );
    },
  },
  watch: {
    dialog(val) {
      val || this.closeD();
    },
  },
  mounted() {
    this.loadDropdowns();
    eventBus.on("editSaleItem", (item) => {
      this.editedIndex = item.id;
      this.editedItem = Object.assign({}, item);
      this.editedItem.saleId = item.sale?.id || item.saleId;
      this.editedItem.productId = item.product?.id || item.productId;
      this.editedItem.variantId = item.variant?.id || item.variantId;
      this.editedItem.serialNumberId = item.serialNumber?.id || item.serialNumberId;
      this.dialog = true;
    });
  },
  beforeUnmount() {
    eventBus.off("editSaleItem");
  },
  methods: {
    async loadDropdowns() {
      try {
        const [salesRes, productsRes, variantsRes, serialsRes] = await Promise.all([
          this.axiosCall("/sales", "GET"),
          this.axiosCall("/products", "GET"),
          this.axiosCall("/product-variants", "GET"),
          this.axiosCall("/serial-numbers", "GET"),
        ]);

        if (salesRes.data) {
          this.sales = salesRes.data.map((s) => ({
            ...s,
            displayName: `${s.saleNumber} - ₱${parseFloat(s.totalAmount || 0).toLocaleString()}`,
          }));
        }
        if (productsRes.data) this.products = productsRes.data;
        if (variantsRes.data) this.variants = variantsRes.data;
        if (serialsRes.data) this.serialNumbers = serialsRes.data;
      } catch (error) {
        console.error("Error loading dropdowns:", error);
      }
    },
    onProductChange() {
      this.editedItem.variantId = null;
      this.editedItem.serialNumberId = null;
    },
    calculateLineTotal() {
      const qty = parseFloat(this.editedItem.quantity) || 0;
      const price = parseFloat(this.editedItem.unitPrice) || 0;
      const discount = parseFloat(this.editedItem.discountAmount) || 0;
      this.editedItem.lineTotal = (qty * price - discount).toFixed(2);
      this.calculateGrossMargin();
    },
    calculateGrossMargin() {
      const qty = parseFloat(this.editedItem.quantity) || 0;
      const cost = parseFloat(this.editedItem.unitCost) || 0;
      const lineTotal = parseFloat(this.editedItem.lineTotal) || 0;
      if (cost > 0) {
        this.editedItem.grossMargin = (lineTotal - qty * cost).toFixed(2);
      } else {
        this.editedItem.grossMargin = null;
      }
    },
    closeD() {
      eventBus.emit("closeSaleItemsDialog", false);
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    async save() {
      if (!this.$refs.form.validate()) return;

      try {
        let response;
        if (this.editedIndex > -1) {
          response = await this.axiosCall(
            `/sale-items/${this.editedIndex}`,
            "PATCH",
            this.editedItem
          );
        } else {
          response = await this.axiosCall("/sale-items", "POST", this.editedItem);
        }

        if (response.data) {
          this.closeD();
        }
      } catch (error) {
        console.error("Error saving sale item:", error);
      }
    },
  },
};
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
</style>
