<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="800px">
      <v-form ref="LayawayPlansFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Layaway Plan</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Plan Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Plan Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="planNumber"
                    label="Plan Number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Unique plan reference"
                    persistent-hint
                    :disabled="action === 'Update'"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-select
                    v-model="status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Current plan status"
                    persistent-hint
                  />
                </v-col>

                <!-- References -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    References
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="saleId"
                    :items="sales"
                    :item-title="(item) => `${item.saleNumber}`"
                    item-value="id"
                    label="Sale"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Associated sale"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="customerId"
                    :items="customers"
                    :item-title="(item) => `${item.firstName} ${item.lastName}`"
                    item-value="id"
                    label="Customer"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select customer"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
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

                <!-- Amounts -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Payment Amounts
                  </h3>
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
                    hint="Total amount of the plan"
                    persistent-hint
                    @update:modelValue="calculateBalance"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="downPayment"
                    label="Down Payment"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Initial down payment"
                    persistent-hint
                    @update:modelValue="calculateBalance"
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="remainingBalance"
                    label="Remaining Balance"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Balance remaining"
                    persistent-hint
                    readonly
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="monthlyPayment"
                    label="Monthly Payment"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Amount per month"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="numberOfPayments"
                    label="Number of Payments"
                    type="number"
                    min="1"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Total installments"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="paymentsMade"
                    label="Payments Made"
                    type="number"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    hint="Installments completed"
                    persistent-hint
                  />
                </v-col>

                <!-- Schedule -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Schedule
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="startDate"
                    label="Start Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Plan start date"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="endDate"
                    label="End Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Plan end date"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="nextPaymentDate"
                    label="Next Payment Date"
                    type="date"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Next due date (optional)"
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
      planNumber: null,
      saleId: null,
      customerId: null,
      branchId: null,
      totalAmount: 0,
      downPayment: 0,
      remainingBalance: 0,
      monthlyPayment: 0,
      numberOfPayments: 1,
      paymentsMade: 0,
      startDate: null,
      endDate: null,
      nextPaymentDate: null,
      status: 'active',
      notes: null,

      sales: [],
      customers: [],
      branches: [],

      statusOptions: [
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Defaulted", value: "defaulted" },
        { label: "Cancelled", value: "cancelled" },
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
        this.$refs.LayawayPlansFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.planNumber = data.planNumber;
          this.saleId = data.saleId;
          this.customerId = data.customerId;
          this.branchId = data.branchId;
          this.totalAmount = data.totalAmount || 0;
          this.downPayment = data.downPayment || 0;
          this.remainingBalance = data.remainingBalance || 0;
          this.monthlyPayment = data.monthlyPayment || 0;
          this.numberOfPayments = data.numberOfPayments || 1;
          this.paymentsMade = data.paymentsMade || 0;
          this.startDate = data.startDate ? this.formatDateForInput(data.startDate) : null;
          this.endDate = data.endDate ? this.formatDateForInput(data.endDate) : null;
          this.nextPaymentDate = data.nextPaymentDate ? this.formatDateForInput(data.nextPaymentDate) : null;
          this.status = data.status || 'active';
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
      this.planNumber = this.generatePlanNumber();
      this.saleId = null;
      this.customerId = null;
      this.branchId = null;
      this.totalAmount = 0;
      this.downPayment = 0;
      this.remainingBalance = 0;
      this.monthlyPayment = 0;
      this.numberOfPayments = 1;
      this.paymentsMade = 0;
      this.startDate = new Date().toISOString().split('T')[0];
      this.endDate = null;
      this.nextPaymentDate = null;
      this.status = 'active';
      this.notes = null;
    },

    generatePlanNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `LAY-${year}${month}${day}-${random}`;
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    calculateBalance() {
      const total = Number(this.totalAmount) || 0;
      const down = Number(this.downPayment) || 0;
      this.remainingBalance = Math.max(0, total - down);
    },

    loadDropdownData() {
      this.axiosCall("/sales", "GET")
        .then((res) => {
          if (res && res.data) {
            this.sales = res.data;
          }
        })
        .catch((error) => console.error("Failed to load sales:", error));

      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.customers = res.data;
          }
        })
        .catch((error) => console.error("Failed to load customers:", error));

      this.axiosCall("/branches", "GET")
        .then((res) => {
          if (res && res.data) {
            this.branches = res.data;
          }
        })
        .catch((error) => console.error("Failed to load branches:", error));
    },

    closeD() {
      eventBus.emit("closeLayawayPlansDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.LayawayPlansFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        planNumber: this.planNumber,
        saleId: this.saleId,
        customerId: this.customerId,
        branchId: this.branchId,
        totalAmount: this.totalAmount,
        downPayment: this.downPayment,
        remainingBalance: this.remainingBalance,
        monthlyPayment: this.monthlyPayment,
        numberOfPayments: this.numberOfPayments,
        paymentsMade: this.paymentsMade || 0,
        startDate: this.startDate,
        endDate: this.endDate,
        nextPaymentDate: this.nextPaymentDate || null,
        status: this.status,
        notes: this.notes || null,
      };

      this.axiosCall("/layaway-plans", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Layaway plan created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create layaway plan";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create layaway plan";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.LayawayPlansFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        saleId: this.saleId,
        customerId: this.customerId,
        branchId: this.branchId,
        totalAmount: this.totalAmount,
        downPayment: this.downPayment,
        remainingBalance: this.remainingBalance,
        monthlyPayment: this.monthlyPayment,
        numberOfPayments: this.numberOfPayments,
        paymentsMade: this.paymentsMade || 0,
        startDate: this.startDate,
        endDate: this.endDate,
        nextPaymentDate: this.nextPaymentDate || null,
        status: this.status,
        notes: this.notes || null,
      };

      this.axiosCall("/layaway-plans/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Layaway plan updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update layaway plan";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update layaway plan";
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
