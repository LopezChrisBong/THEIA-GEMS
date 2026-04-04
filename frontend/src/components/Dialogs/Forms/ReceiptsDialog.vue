<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="ReceiptsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Receipt</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Receipt Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Receipt Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="receiptNumber"
                    label="Receipt Number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Unique receipt reference"
                    persistent-hint
                    :disabled="action === 'Update'"
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
                    hint="Associated sale"
                    persistent-hint
                    :disabled="action === 'Update'"
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
                    hint="Branch location"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model.number="reprintCount"
                    label="Reprint Count"
                    type="number"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    hint="Number of times reprinted"
                    persistent-hint
                    readonly
                  />
                </v-col>

                <!-- Receipt Content -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Receipt Content
                  </h3>
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-text-field
                    v-model="logoUrl"
                    label="Logo URL"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="URL to company logo (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="headerText"
                    label="Header Text"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="3"
                    hint="Text displayed at top of receipt"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="footerText"
                    label="Footer Text"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="3"
                    hint="Text displayed at bottom of receipt"
                    persistent-hint
                  />
                </v-col>

                <!-- Print Information -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Print Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="printedAt"
                    label="Printed At"
                    type="datetime-local"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="When receipt was printed"
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
      saleId: null,
      receiptNumber: null,
      branchId: null,
      headerText: null,
      footerText: null,
      logoUrl: null,
      printedAt: null,
      reprintCount: 0,

      sales: [],
      branches: [],

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
        this.$refs.ReceiptsFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.saleId = data.saleId;
          this.receiptNumber = data.receiptNumber;
          this.branchId = data.branchId;
          this.headerText = data.headerText;
          this.footerText = data.footerText;
          this.logoUrl = data.logoUrl;
          this.printedAt = data.printedAt ? this.formatDateTimeForInput(data.printedAt) : null;
          this.reprintCount = data.reprintCount || 0;
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
      this.saleId = null;
      this.receiptNumber = this.generateReceiptNumber();
      this.branchId = null;
      this.headerText = null;
      this.footerText = null;
      this.logoUrl = null;
      this.printedAt = null;
      this.reprintCount = 0;
    },

    generateReceiptNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `RCP-${year}${month}${day}-${random}`;
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

      this.axiosCall("/branches", "GET")
        .then((res) => {
          if (res && res.data) {
            this.branches = res.data;
          }
        })
        .catch((error) => console.error("Failed to load branches:", error));
    },

    closeD() {
      eventBus.emit("closeReceiptsDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.ReceiptsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        saleId: this.saleId,
        receiptNumber: this.receiptNumber,
        branchId: this.branchId,
        headerText: this.headerText || null,
        footerText: this.footerText || null,
        logoUrl: this.logoUrl || null,
        printedAt: this.printedAt || null,
        reprintCount: this.reprintCount || 0,
      };

      this.axiosCall("/receipts", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Receipt created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create receipt";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create receipt";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.ReceiptsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        branchId: this.branchId,
        headerText: this.headerText || null,
        footerText: this.footerText || null,
        logoUrl: this.logoUrl || null,
        printedAt: this.printedAt || null,
      };

      this.axiosCall("/receipts/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Receipt updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update receipt";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update receipt";
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
