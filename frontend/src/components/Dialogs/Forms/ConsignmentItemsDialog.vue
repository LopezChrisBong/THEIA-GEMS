<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="800px">
      <v-form ref="ConsignmentItemsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Consignment Item</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Item Selection -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Item Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="jewelryItemId"
                    :items="jewelryItems"
                    :item-title="(item) => `${item.itemCode}${item.brand ? ' - ' + item.brand : ''}${item.category ? ' (' + item.category.categoryName + ')' : ''}`"
                    item-value="id"
                    label="Item"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select the inventory item to consign"
                    persistent-hint
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

                <!-- Consignor Information -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Consignor Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="consignorName"
                    label="Consignor Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Name of the consignor"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="consignorContact"
                    label="Consignor Contact"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Contact number or email"
                    persistent-hint
                  />
                </v-col>

                <!-- Pricing -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Pricing & Commission
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="consignedPrice"
                    label="Consigned Price"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Price agreed with consignor"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="sellingPrice"
                    label="Selling Price"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Price to sell at"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="commissionRate"
                    label="Commission Rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    outlined
                    dense
                    color="primary"
                    suffix="%"
                    hint="Commission percentage"
                    persistent-hint
                  />
                </v-col>

                <!-- Status & Date -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Status & Date
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="consignmentDate"
                    label="Consignment Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Date of consignment"
                    persistent-hint
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
                    hint="Current status"
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
      jewelryItemId: null,
      branchId: null,
      consignorName: null,
      consignorContact: null,
      consignedPrice: null,
      sellingPrice: null,
      commissionRate: null,
      consignmentDate: null,
      status: "active",
      notes: null,

      jewelryItems: [],
      branches: [],

      statusOptions: [
        { label: "Active", value: "active" },
        { label: "Sold", value: "sold" },
        { label: "Returned", value: "returned" },
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
        this.$refs.ConsignmentItemsFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.jewelryItemId = data.jewelryItemId;
          this.branchId = data.branchId;
          this.consignorName = data.consignorName;
          this.consignorContact = data.consignorContact;
          this.consignedPrice = data.consignedPrice ? Number(data.consignedPrice) : null;
          this.sellingPrice = data.sellingPrice ? Number(data.sellingPrice) : null;
          this.commissionRate = data.commissionRate ? Number(data.commissionRate) : null;
          this.consignmentDate = data.consignmentDate ? this.formatDateForInput(data.consignmentDate) : null;
          this.status = data.status || "active";
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
      this.jewelryItemId = null;
      this.branchId = null;
      this.consignorName = null;
      this.consignorContact = null;
      this.consignedPrice = null;
      this.sellingPrice = null;
      this.commissionRate = null;
      this.consignmentDate = new Date().toISOString().split("T")[0];
      this.status = "active";
      this.notes = null;
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    },

    loadDropdownData() {
      this.axiosCall("/jewelry-items", "GET")
        .then((res) => {
          if (res && res.data) {
            this.jewelryItems = res.data;
          }
        })
        .catch((error) => console.error("Failed to load items:", error));

      this.axiosCall("/branches", "GET")
        .then((res) => {
          if (res && res.data) {
            this.branches = res.data;
          }
        })
        .catch((error) => console.error("Failed to load branches:", error));
    },

    closeD() {
      eventBus.emit("closeConsignmentItemsDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.ConsignmentItemsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        jewelryItemId: this.jewelryItemId,
        branchId: this.branchId,
        consignorName: this.consignorName,
        consignorContact: this.consignorContact || null,
        consignedPrice: this.consignedPrice,
        sellingPrice: this.sellingPrice,
        commissionRate: this.commissionRate || null,
        consignmentDate: this.consignmentDate,
        status: this.status,
        notes: this.notes || null,
      };

      this.axiosCall("/consignment-items", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Consignment item created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create consignment item";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create consignment item";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.ConsignmentItemsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        jewelryItemId: this.jewelryItemId,
        branchId: this.branchId,
        consignorName: this.consignorName,
        consignorContact: this.consignorContact || null,
        consignedPrice: this.consignedPrice,
        sellingPrice: this.sellingPrice,
        commissionRate: this.commissionRate || null,
        consignmentDate: this.consignmentDate,
        status: this.status,
        notes: this.notes || null,
      };

      this.axiosCall("/consignment-items/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Consignment item updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update consignment item";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update consignment item";
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
