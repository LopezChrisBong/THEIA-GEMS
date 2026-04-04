<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="PaymentsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Payment</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Payment Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Payment Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="paymentNumber"
                    label="Payment Number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Unique payment reference"
                    persistent-hint
                    :disabled="action === 'Update'"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="paymentDate"
                    label="Payment Date"
                    type="datetime-local"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Date and time of payment"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="saleId"
                    :items="sales"
                    :item-title="(item) => `${item.saleNumber} - ₱${formatNumber(item.totalAmount)}`"
                    item-value="id"
                    label="Sale"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select the associated sale"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="referenceNumber"
                    label="Reference Number"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Transaction reference (optional)"
                    persistent-hint
                  />
                </v-col>

                <!-- Amount & Method -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Amount & Method
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="amount"
                    label="Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Payment amount"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="paymentMethod"
                    :items="paymentMethodOptions"
                    item-title="label"
                    item-value="value"
                    label="Payment Method"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="How was it paid"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="paymentType"
                    :items="paymentTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Payment Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Type of payment"
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
      paymentNumber: null,
      saleId: null,
      amount: null,
      paymentMethod: 'cash',
      paymentType: 'full',
      referenceNumber: null,
      paymentDate: null,
      notes: null,

      sales: [],

      paymentMethodOptions: [
        { label: "Cash", value: "cash" },
        { label: "Credit Card", value: "credit_card" },
        { label: "Debit Card", value: "debit_card" },
        { label: "Bank Transfer", value: "bank_transfer" },
        { label: "GCash", value: "gcash" },
        { label: "Maya", value: "maya" },
        { label: "Check", value: "check" },
        { label: "Other", value: "other" },
      ],

      paymentTypeOptions: [
        { label: "Full", value: "full" },
        { label: "Partial", value: "partial" },
        { label: "Deposit", value: "deposit" },
        { label: "Layaway", value: "layaway" },
        { label: "Refund", value: "refund" },
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
        this.$refs.PaymentsFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.paymentNumber = data.paymentNumber;
          this.saleId = data.saleId;
          this.amount = data.amount;
          this.paymentMethod = data.paymentMethod || 'cash';
          this.paymentType = data.paymentType || 'full';
          this.referenceNumber = data.referenceNumber;
          this.paymentDate = data.paymentDate ? this.formatDateTimeForInput(data.paymentDate) : null;
          this.notes = data.notes;
        } else {
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    resetForm() {
      this.id = null;
      this.paymentNumber = this.generatePaymentNumber();
      this.saleId = null;
      this.amount = null;
      this.paymentMethod = 'cash';
      this.paymentType = 'full';
      this.referenceNumber = null;
      this.paymentDate = this.getCurrentDateTime();
      this.notes = null;
    },

    generatePaymentNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PAY-${year}${month}${day}-${random}`;
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

    loadDropdownData() {
      this.axiosCall("/sales", "GET")
        .then((res) => {
          if (res && res.data) {
            this.sales = res.data;
          }
        })
        .catch((error) => console.error("Failed to load sales:", error));
    },

    closeD() {
      eventBus.emit("closePaymentsDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.PaymentsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        paymentNumber: this.paymentNumber,
        saleId: this.saleId,
        amount: this.amount,
        paymentMethod: this.paymentMethod,
        paymentType: this.paymentType,
        referenceNumber: this.referenceNumber || null,
        paymentDate: this.paymentDate,
        notes: this.notes || null,
      };

      this.axiosCall("/payments", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create payment";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create payment";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.PaymentsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        saleId: this.saleId,
        amount: this.amount,
        paymentMethod: this.paymentMethod,
        paymentType: this.paymentType,
        referenceNumber: this.referenceNumber || null,
        paymentDate: this.paymentDate,
        notes: this.notes || null,
      };

      this.axiosCall("/payments/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update payment";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update payment";
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
