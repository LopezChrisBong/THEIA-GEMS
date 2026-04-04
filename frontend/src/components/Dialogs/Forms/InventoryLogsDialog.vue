<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="InventoryLogsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Inventory Log</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Product Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Product Information
                  </h3>
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-autocomplete
                    v-model="productId"
                    :items="products"
                    :item-title="(item) => `${item.sku} - ${item.productName}`"
                    item-value="id"
                    label="Product"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select the product"
                    persistent-hint
                    @update:modelValue="onProductChange"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="variantId"
                    :items="filteredVariants"
                    :item-title="(item) => `${item.variantSku} - ${item.variantName || 'No Name'}`"
                    item-value="id"
                    label="Product Variant"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Select variant (optional)"
                    persistent-hint
                    :disabled="!productId"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="branchId"
                    :items="branches"
                    item-title="branchName"
                    item-value="branchId"
                    label="Branch"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select branch"
                    persistent-hint
                  />
                </v-col>

                <!-- Action Details -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Action Details
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-select
                    v-model="actionType"
                    :items="actionTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Action Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Type of inventory action"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model.number="quantityChange"
                    label="Quantity Change"
                    type="number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Amount changed (+/-)"
                    persistent-hint
                    @update:modelValue="calculateNewQuantity"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model.number="previousQuantity"
                    label="Previous Quantity"
                    type="number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Quantity before change"
                    persistent-hint
                    @update:modelValue="calculateNewQuantity"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model.number="newQuantity"
                    label="New Quantity"
                    type="number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Quantity after change"
                    persistent-hint
                    readonly
                  />
                </v-col>

                <!-- Reference Information -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Reference (Optional)
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="referenceType"
                    label="Reference Type"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="e.g., Sale, Transfer, Adjustment"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model.number="referenceId"
                    label="Reference ID"
                    type="number"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="ID of related record"
                    persistent-hint
                  />
                </v-col>

                <!-- Notes -->
                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="notes"
                    label="Notes"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="2"
                    hint="Additional notes"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-divider />

          <!-- Actions -->
          <v-card-actions class="px-6 py-4 justify-end">
            <v-btn
              variant="text"
              color="red"
              rounded="lg"
              elevation="1"
              @click="closeD"
            >
              Cancel
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="action === 'Add'"
              color="primary"
              @click="add"
              rounded
              elevation="2"
              :loading="loading"
            >
              <v-icon left>mdi-check-circle</v-icon>
              Add
            </v-btn>

            <v-btn
              v-else-if="action === 'Update'"
              variant="text"
              color="primary"
              rounded="lg"
              elevation="1"
              @click="update"
              :loading="loading"
            >
              Update
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </div>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  props: {
    data: Object,
    action: String,
  },
  data() {
    return {
      dialog: false,
      loading: false,

      id: null,
      productId: null,
      variantId: null,
      branchId: null,
      actionType: 'adjust',
      quantityChange: 0,
      previousQuantity: 0,
      newQuantity: 0,
      referenceId: null,
      referenceType: null,
      notes: null,

      products: [],
      variants: [],
      branches: [],

      actionTypeOptions: [
        { label: "Add", value: "add" },
        { label: "Edit", value: "edit" },
        { label: "Delete", value: "delete" },
        { label: "Adjust", value: "adjust" },
        { label: "Transfer Out", value: "transfer_out" },
        { label: "Transfer In", value: "transfer_in" },
        { label: "Sale", value: "sale" },
        { label: "Return", value: "return" },
      ],

      fadeAwayMessage: {
        show: false,
        type: "success",
        header: "Successfully Added!",
        message: "",
        top: 10,
      },
    };
  },
  computed: {
    filteredVariants() {
      if (!this.productId) return [];
      return this.variants.filter(v => v.productId === this.productId);
    }
  },
  watch: {
    data: {
      handler(data) {
        this.dialog = true;
        this.loadDropdownData();
        this.$refs.InventoryLogsFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.productId = data.productId;
          this.variantId = data.variantId;
          this.branchId = data.branchId;
          this.actionType = data.actionType || 'adjust';
          this.quantityChange = data.quantityChange || 0;
          this.previousQuantity = data.previousQuantity || 0;
          this.newQuantity = data.newQuantity || 0;
          this.referenceId = data.referenceId;
          this.referenceType = data.referenceType;
          this.notes = data.notes;
        } else {
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.productId = null;
      this.variantId = null;
      this.branchId = null;
      this.actionType = 'adjust';
      this.quantityChange = 0;
      this.previousQuantity = 0;
      this.newQuantity = 0;
      this.referenceId = null;
      this.referenceType = null;
      this.notes = null;
    },

    onProductChange() {
      this.variantId = null;
    },

    calculateNewQuantity() {
      const prev = Number(this.previousQuantity) || 0;
      const change = Number(this.quantityChange) || 0;
      this.newQuantity = prev + change;
    },

    loadDropdownData() {
      this.axiosCall("/products", "GET")
        .then((res) => {
          if (res && res.data) {
            this.products = res.data;
          }
        })
        .catch((error) => console.error("Failed to load products:", error));

      this.axiosCall("/product-variants", "GET")
        .then((res) => {
          if (res && res.data) {
            this.variants = res.data;
          }
        })
        .catch((error) => console.error("Failed to load variants:", error));

      this.axiosCall("/branches", "GET")
        .then((res) => {
          if (res && res.data) {
            this.branches = res.data;
          }
        })
        .catch((error) => console.error("Failed to load branches:", error));
    },

    closeD() {
      eventBus.emit("closeInventoryLogsDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.InventoryLogsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        productId: this.productId,
        variantId: this.variantId || null,
        branchId: this.branchId,
        actionType: this.actionType,
        quantityChange: this.quantityChange,
        previousQuantity: this.previousQuantity,
        newQuantity: this.newQuantity,
        referenceId: this.referenceId || null,
        referenceType: this.referenceType || null,
        notes: this.notes || null,
      };

      this.axiosCall("/inventory-logs", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Inventory log created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create inventory log";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create inventory log";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.InventoryLogsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        productId: this.productId,
        variantId: this.variantId || null,
        branchId: this.branchId,
        actionType: this.actionType,
        quantityChange: this.quantityChange,
        previousQuantity: this.previousQuantity,
        newQuantity: this.newQuantity,
        referenceId: this.referenceId || null,
        referenceType: this.referenceType || null,
        notes: this.notes || null,
      };

      this.axiosCall("/inventory-logs/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Inventory log updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update inventory log";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update inventory log";
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>

<style scoped>
.dialog-header {
  min-height: 56px;
}

.v-text-field {
  font-size: 1rem;
}

.v-card {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

.v-card-actions > .v-btn {
  min-width: 120px;
}
</style>
