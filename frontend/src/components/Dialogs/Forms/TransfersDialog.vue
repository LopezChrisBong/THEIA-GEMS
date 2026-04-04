<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="TransfersFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Transfer</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Transfer Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Transfer Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="transferNumber"
                    label="Transfer Number"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Unique transfer reference"
                    persistent-hint
                    :disabled="action === 'Update'"
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="transferDate"
                    label="Transfer Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Date of transfer"
                    persistent-hint
                  />
                </v-col>

                <!-- Branch Selection -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Branch Selection
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="fromBranchId"
                    :items="branches"
                    item-title="branchName"
                    item-value="branchId"
                    label="From Branch"
                    :rules="[formRules.required, validateDifferentBranches]"
                    outlined
                    dense
                    color="primary"
                    hint="Source branch"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="toBranchId"
                    :items="branches"
                    item-title="branchName"
                    item-value="branchId"
                    label="To Branch"
                    :rules="[formRules.required, validateDifferentBranches]"
                    outlined
                    dense
                    color="primary"
                    hint="Destination branch"
                    persistent-hint
                  />
                </v-col>

                <!-- Status & Dates -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Status & Completion
                  </h3>
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
                    hint="Current status"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="receivedDate"
                    label="Received Date"
                    type="date"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Date items were received (optional)"
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
                    rows="3"
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
      transferNumber: null,
      fromBranchId: null,
      toBranchId: null,
      status: 'pending',
      transferDate: null,
      receivedDate: null,
      notes: null,

      branches: [],

      statusOptions: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "In Transit", value: "in_transit" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
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
        this.$refs.TransfersFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing transfer
          this.id = data.id;
          this.transferNumber = data.transferNumber;
          this.fromBranchId = data.fromBranchId;
          this.toBranchId = data.toBranchId;
          this.status = data.status || 'pending';
          this.transferDate = data.transferDate ? this.formatDateForInput(data.transferDate) : null;
          this.receivedDate = data.receivedDate ? this.formatDateForInput(data.receivedDate) : null;
          this.notes = data.notes;
        } else {
          // Adding new transfer
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    validateDifferentBranches() {
      if (this.fromBranchId && this.toBranchId && this.fromBranchId === this.toBranchId) {
        return "Source and destination branches must be different";
      }
      return true;
    },

    resetForm() {
      this.id = null;
      this.transferNumber = this.generateTransferNumber();
      this.fromBranchId = null;
      this.toBranchId = null;
      this.status = 'pending';
      this.transferDate = new Date().toISOString().split('T')[0];
      this.receivedDate = null;
      this.notes = null;
    },

    generateTransferNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TRF-${year}${month}${day}-${random}`;
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
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
    },

    closeD() {
      eventBus.emit("closeTransfersDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.TransfersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        transferNumber: this.transferNumber,
        fromBranchId: this.fromBranchId,
        toBranchId: this.toBranchId,
        status: this.status,
        transferDate: this.transferDate,
        receivedDate: this.receivedDate || null,
        notes: this.notes || null,
        requestedBy: Number(this.$store.state.user.userID),
      };

      this.axiosCall("/transfers", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Transfer created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create transfer";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create transfer";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.TransfersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        fromBranchId: this.fromBranchId,
        toBranchId: this.toBranchId,
        status: this.status,
        transferDate: this.transferDate,
        receivedDate: this.receivedDate || null,
        notes: this.notes || null,
      };

      this.axiosCall("/transfers/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Transfer updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update transfer";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update transfer";
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
