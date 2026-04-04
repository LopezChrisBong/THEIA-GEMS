<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="800px">
      <v-form ref="SalesFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Sale</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Sale Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Sale Information
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="saleNumber"
                    label="Sale Number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Unique sale reference"
                    persistent-hint
                    :disabled="action === 'Update'"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="saleDate"
                    label="Sale Date"
                    type="datetime-local"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Date and time of sale"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="saleType"
                    :items="saleTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Sale Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Type of sale"
                    persistent-hint
                  />
                </v-col>

                <!-- Location & Customer -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Location & Customer
                  </h3>
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

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="customerId"
                    :items="customers"
                    :item-title="(item) => `${item.firstName} ${item.lastName}`"
                    item-value="id"
                    label="Customer"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Select customer (optional)"
                    persistent-hint
                  />
                </v-col>

                <!-- Amounts -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Amounts
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="subtotal"
                    label="Subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Subtotal before discount/tax"
                    persistent-hint
                    @update:modelValue="calculateTotal"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="discountAmount"
                    label="Discount"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Discount amount"
                    persistent-hint
                    @update:modelValue="calculateTotal"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="taxAmount"
                    label="Tax"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Tax amount"
                    persistent-hint
                    @update:modelValue="calculateTotal"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="totalAmount"
                    label="Total Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Total amount due"
                    persistent-hint
                    readonly
                    class="font-weight-bold"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="amountPaid"
                    label="Amount Paid"
                    type="number"
                    step="0.01"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Amount received"
                    persistent-hint
                    @update:modelValue="calculateChange"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="changeAmount"
                    label="Change"
                    type="number"
                    step="0.01"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Change to return"
                    persistent-hint
                    readonly
                  />
                </v-col>

                <!-- Payment Status -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Payment Status
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-select
                    v-model="paymentStatus"
                    :items="paymentStatusOptions"
                    item-title="label"
                    item-value="value"
                    label="Payment Status"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Current payment status"
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
      saleNumber: null,
      branchId: null,
      customerId: null,
      saleDate: null,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      changeAmount: 0,
      paymentStatus: 'paid',
      saleType: 'regular',
      notes: null,

      branches: [],
      customers: [],

      paymentStatusOptions: [
        { label: "Paid", value: "paid" },
        { label: "Partial", value: "partial" },
        { label: "Layaway", value: "layaway" },
        { label: "Refunded", value: "refunded" },
      ],

      saleTypeOptions: [
        { label: "Regular", value: "regular" },
        { label: "Layaway", value: "layaway" },
        { label: "Consignment", value: "consignment" },
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
  watch: {
    data: {
      handler(data) {
        this.dialog = true;
        this.loadDropdownData();
        this.$refs.SalesFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing sale
          this.id = data.id;
          this.saleNumber = data.saleNumber;
          this.branchId = data.branchId;
          this.customerId = data.customerId;
          this.saleDate = data.saleDate ? this.formatDateTimeForInput(data.saleDate) : null;
          this.subtotal = data.subtotal || 0;
          this.discountAmount = data.discountAmount || 0;
          this.taxAmount = data.taxAmount || 0;
          this.totalAmount = data.totalAmount || 0;
          this.amountPaid = data.amountPaid || 0;
          this.changeAmount = data.changeAmount || 0;
          this.paymentStatus = data.paymentStatus || 'paid';
          this.saleType = data.saleType || 'regular';
          this.notes = data.notes;
        } else {
          // Adding new sale
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.saleNumber = this.generateSaleNumber();
      this.branchId = null;
      this.customerId = null;
      this.saleDate = this.getCurrentDateTime();
      this.subtotal = 0;
      this.discountAmount = 0;
      this.taxAmount = 0;
      this.totalAmount = 0;
      this.amountPaid = 0;
      this.changeAmount = 0;
      this.paymentStatus = 'paid';
      this.saleType = 'regular';
      this.notes = null;
    },

    generateSaleNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `SL-${year}${month}${day}-${random}`;
    },

    getCurrentDateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    formatDateTimeForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    calculateTotal() {
      const sub = Number(this.subtotal) || 0;
      const disc = Number(this.discountAmount) || 0;
      const tax = Number(this.taxAmount) || 0;
      this.totalAmount = Math.max(0, sub - disc + tax);
      this.calculateChange();
    },

    calculateChange() {
      const total = Number(this.totalAmount) || 0;
      const paid = Number(this.amountPaid) || 0;
      this.changeAmount = Math.max(0, paid - total);
    },

    loadDropdownData() {
      // Load branches
      this.axiosCall("/branches", "GET")
        .then((res) => {
          if (res && res.data) {
            this.branches = res.data;
          }
        })
        .catch((error) => console.error("Failed to load branches:", error));

      // Load customers
      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.customers = res.data;
          }
        })
        .catch((error) => console.error("Failed to load customers:", error));
    },

    closeD() {
      eventBus.emit("closeSalesDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.SalesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        saleNumber: this.saleNumber,
        branchId: this.branchId,
        customerId: this.customerId || null,
        saleDate: this.saleDate,
        subtotal: this.subtotal,
        discountAmount: this.discountAmount || 0,
        taxAmount: this.taxAmount || 0,
        totalAmount: this.totalAmount,
        amountPaid: this.amountPaid || 0,
        changeAmount: this.changeAmount || 0,
        paymentStatus: this.paymentStatus,
        saleType: this.saleType,
        notes: this.notes || null,
      };

      this.axiosCall("/sales", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Sale created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create sale";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create sale";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.SalesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        branchId: this.branchId,
        customerId: this.customerId || null,
        saleDate: this.saleDate,
        subtotal: this.subtotal,
        discountAmount: this.discountAmount || 0,
        taxAmount: this.taxAmount || 0,
        totalAmount: this.totalAmount,
        amountPaid: this.amountPaid || 0,
        changeAmount: this.changeAmount || 0,
        paymentStatus: this.paymentStatus,
        saleType: this.saleType,
        notes: this.notes || null,
      };

      this.axiosCall("/sales/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Sale updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update sale";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update sale";
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
