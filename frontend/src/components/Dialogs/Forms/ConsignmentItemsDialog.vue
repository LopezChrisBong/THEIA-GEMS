<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="900px">
      <v-form ref="ConsignmentItemsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Consignment Item{{ action === 'Add' ? 's' : '' }}</span>
          </v-card-title>

          <v-card-text style="max-height: 75vh; overflow-y: auto" class="py-6 px-6">
            <v-container fluid>
              <v-row dense>
                <!-- ─── CONSIGNOR INFO (shared for both modes) ─── -->
                <v-col cols="12" class="mb-1">
                  <div class="section-label">Consignor Information</div>
                </v-col>

                <v-col cols="12" md="6" class="mb-3">
                  <v-text-field
                    v-model="consignorName"
                    label="Consignor Name"
                    :rules="[formRules.required]"
                    outlined dense clearable color="primary"
                    hint="Name of the consignor" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="3" class="mb-3">
                  <v-text-field
                    v-model="consignorEmail"
                    label="Consignor Email"
                    type="email"
                    outlined dense clearable color="primary"
                    hint="Email address" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="3" class="mb-3">
                  <v-text-field
                    v-model="consignorPhone"
                    label="Consignor Phone"
                    outlined dense clearable color="primary"
                    hint="Contact number" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-3">
                  <v-autocomplete
                    v-model="branchId"
                    :items="branches"
                    item-title="branchName"
                    item-value="branchId"
                    label="Branch"
                    :rules="[formRules.required]"
                    outlined dense color="primary"
                    hint="Branch location" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="3" class="mb-3">
                  <v-text-field
                    v-model="consignmentDate"
                    label="Consignment Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined dense color="primary"
                    hint="Date of consignment" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="3" class="mb-3">
                  <v-select
                    v-model="status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    :rules="[formRules.required]"
                    outlined dense color="primary"
                    hint="Current status" persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="3" class="mb-3 d-flex align-center">
                  <v-checkbox
                    v-model="isAuthentic"
                    label="Genuine/Entrupy"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </v-col>

                <v-col cols="12" md="9" class="mb-3">
                  <v-textarea
                    v-model="notes"
                    label="Notes"
                    outlined dense clearable color="primary"
                    rows="2" hint="Additional notes" persistent-hint
                  />
                </v-col>

                <!-- ─── MULTI-ITEM TABLE (Add mode) ─── -->
                <template v-if="action === 'Add'">
                  <v-col cols="12" class="mb-2 mt-1">
                    <div class="section-label-row">
                      <div class="section-label">Items</div>
                      <button class="btn-add-row" type="button" @click="addItemRow">
                        <v-icon size="13">mdi-plus</v-icon> Add Item
                      </button>
                    </div>
                    <div v-if="itemsError" class="items-error">{{ itemsError }}</div>
                  </v-col>

                  <v-col cols="12">
                    <div class="items-table-wrap">
                      <table class="items-tbl">
                        <thead>
                          <tr>
                            <th style="width:34%">Jewelry Item</th>
                            <th style="width:18%">Consigned Price</th>
                            <th style="width:18%">Selling Price</th>
                            <th style="width:14%">Commission %</th>
                            <th style="width:16%">Auto-filled</th>
                            <th style="width:40px"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(row, idx) in items" :key="idx">
                            <td>
                              <v-autocomplete
                                v-model="row.jewelryItemId"
                                :items="availableJewelryItems(idx)"
                                :item-title="(item) => `${item.itemCode}${item.brand ? ' - ' + item.brand : ''}`"
                                item-value="id"
                                density="compact"
                                variant="outlined"
                                hide-details
                                placeholder="Select item"
                                @update:modelValue="(val) => onItemSelect(idx, val)"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model.number="row.consignedPrice"
                                type="number" step="0.01" min="0"
                                density="compact" variant="outlined"
                                hide-details prefix="₱"
                                placeholder="0.00"
                                @update:modelValue="recalcRowCommission(idx)"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model.number="row.sellingPrice"
                                type="number" step="0.01" min="0"
                                density="compact" variant="outlined"
                                hide-details prefix="₱"
                                placeholder="0.00"
                                @update:modelValue="recalcRowCommission(idx)"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model.number="row.commissionRate"
                                type="number" step="0.01" min="0" max="100"
                                density="compact" variant="outlined"
                                hide-details suffix="%"
                                placeholder="0"
                              />
                            </td>
                            <td class="autofill-cell">
                              <span v-if="row.autoFilled" class="autofill-badge">
                                <v-icon size="11">mdi-check-circle-outline</v-icon> auto
                              </span>
                            </td>
                            <td>
                              <button
                                class="btn-remove-row"
                                type="button"
                                :disabled="items.length === 1"
                                @click="removeItemRow(idx)"
                                title="Remove row"
                              >
                                <v-icon size="15">mdi-close</v-icon>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="items-summary">
                      {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} to consign
                    </div>
                  </v-col>
                </template>

                <!-- ─── SINGLE-ITEM (Update mode) ─── -->
                <template v-if="action === 'Update'">
                  <v-col cols="12" class="mb-2 mt-1">
                    <div class="section-label">Item & Pricing</div>
                  </v-col>

                  <v-col cols="12" md="12" class="mb-3">
                    <v-autocomplete
                      v-model="jewelryItemId"
                      :items="jewelryItems"
                      :item-title="(item) => `${item.itemCode}${item.brand ? ' - ' + item.brand : ''}${item.category ? ' (' + item.category.categoryName + ')' : ''}`"
                      item-value="id"
                      label="Item"
                      :rules="[formRules.required]"
                      outlined dense color="primary"
                      hint="Select the inventory item" persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" md="4" class="mb-3">
                    <v-text-field
                      v-model.number="consignedPrice"
                      label="Consigned Price"
                      type="number" step="0.01" min="0"
                      :rules="[formRules.required]"
                      outlined dense color="primary"
                      prefix="₱" hint="Price agreed with consignor" persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" md="4" class="mb-3">
                    <v-text-field
                      v-model.number="sellingPrice"
                      label="Selling Price"
                      type="number" step="0.01" min="0"
                      :rules="[formRules.required]"
                      outlined dense color="primary"
                      prefix="₱" hint="Price to sell at" persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" md="4" class="mb-3">
                    <v-text-field
                      v-model.number="commissionRate"
                      label="Commission Rate"
                      type="number" step="0.01" min="0" max="100"
                      outlined dense color="primary"
                      suffix="%" hint="Commission percentage" persistent-hint
                    />
                  </v-col>
                </template>
              </v-row>
            </v-container>
          </v-card-text>

          <v-divider />

          <v-card-actions class="px-6 py-4 justify-end">
            <v-btn variant="text" color="red" rounded="lg" @click="closeD">Cancel</v-btn>
            <v-spacer />
            <v-btn
              v-if="action === 'Add'"
              color="primary" rounded elevation="2"
              :loading="loading"
              @click="add"
            >
              <v-icon start>mdi-check-circle</v-icon>
              Add {{ items.length > 1 ? items.length + ' Items' : 'Item' }}
            </v-btn>
            <v-btn
              v-else-if="action === 'Update'"
              variant="text" color="primary" rounded="lg" elevation="1"
              :loading="loading"
              @click="update"
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
      itemsError: "",

      // Shared consignor fields
      branchId: null,
      consignorName: null,
      consignorEmail: null,
      consignorPhone: null,
      consignmentDate: null,
      status: "active",
      isAuthentic: null,
      notes: null,

      // Multi-item rows (Add mode)
      items: [this.emptyRow()],

      // Single-item fields (Update mode)
      id: null,
      jewelryItemId: null,
      consignedPrice: null,
      sellingPrice: null,
      commissionRate: null,

      jewelryItems: [],
      branches: [],

      statusOptions: [
        { label: "Active", value: "active" },
        { label: "Sold", value: "sold" },
        { label: "Returned", value: "returned" },
      ],

      fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
    };
  },

  computed: {
    selectedItemIds() {
      return this.items.map((r) => r.jewelryItemId).filter(Boolean);
    },
  },

  watch: {
    consignedPrice(val) {
      this.commissionRate = this.calcCommission(val, this.sellingPrice);
    },
    sellingPrice(val) {
      this.commissionRate = this.calcCommission(this.consignedPrice, val);
    },

    data: {
      handler(data) {
        this.dialog = true;
        // Pass the current item's jewelryItemId so it isn't excluded in Update mode
        this.loadDropdownData(data?.jewelryItemId ?? null);
        this.$refs.ConsignmentItemsFormref?.resetValidation();

        if (data && data.id) {
          // Update mode — populate single-item fields
          this.id = data.id;
          this.jewelryItemId = data.jewelryItemId;
          this.branchId = data.branchId;
          this.consignorName = data.consignorName;
          this.consignorEmail = data.consignorEmail;
          this.consignorPhone = data.consignorPhone;
          this.consignedPrice = data.consignedPrice ? Number(data.consignedPrice) : null;
          this.sellingPrice = data.sellingPrice ? Number(data.sellingPrice) : null;
          this.commissionRate = data.commissionRate ? Number(data.commissionRate) : null;
          this.consignmentDate = data.consignmentDate ? this.formatDateForInput(data.consignmentDate) : null;
          this.status = data.status || "active";
          this.isAuthentic = data.isAuthentic ?? null;
          this.notes = data.notes;
        } else {
          this.resetForm();
        }
      },
      deep: true,
    },
  },

  methods: {
    calcCommission(consignedPrice, sellingPrice) {
      if (!sellingPrice || sellingPrice <= 0 || consignedPrice == null) return null;
      const rate = ((sellingPrice - consignedPrice) / sellingPrice) * 100;
      return rate < 0 ? 0 : Math.round(rate * 100) / 100;
    },

    recalcRowCommission(idx) {
      const row = this.items[idx];
      row.commissionRate = this.calcCommission(row.consignedPrice, row.sellingPrice);
    },

    emptyRow() {
      return { jewelryItemId: null, consignedPrice: null, sellingPrice: null, commissionRate: null, autoFilled: false };
    },

    resetForm() {
      this.id = null;
      this.jewelryItemId = null;
      this.branchId = null;
      this.consignorName = null;
      this.consignorEmail = null;
      this.consignorPhone = null;
      this.consignedPrice = null;
      this.sellingPrice = null;
      this.commissionRate = null;
      this.consignmentDate = new Date().toISOString().split("T")[0];
      this.status = "active";
      this.isAuthentic = null;
      this.notes = null;
      this.items = [this.emptyRow()];
      this.itemsError = "";
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      return new Date(dateString).toISOString().split("T")[0];
    },

    // Returns jewelry items excluding those already picked in other rows
    availableJewelryItems(idx) {
      const otherIds = new Set(
        this.items.filter((_, i) => i !== idx).map((r) => r.jewelryItemId).filter(Boolean)
      );
      return this.jewelryItems.filter((i) => !otherIds.has(i.id));
    },

    onItemSelect(idx, itemId) {
      if (!itemId) return;
      const item = this.jewelryItems.find((i) => i.id === itemId);
      if (!item) return;
      const row = this.items[idx];
      if (item.cost != null) row.consignedPrice = Number(item.cost);
      if (item.price != null) row.sellingPrice = Number(item.price);
      row.commissionRate = this.calcCommission(row.consignedPrice, row.sellingPrice);
      row.autoFilled = true;
      // Auto-fill branch from first item if not yet set
      if (!this.branchId && item.branchId) this.branchId = item.branchId;
    },

    addItemRow() {
      this.items.push(this.emptyRow());
      this.itemsError = "";
    },

    removeItemRow(idx) {
      if (this.items.length > 1) this.items.splice(idx, 1);
    },

    loadDropdownData(currentJewelryItemId = null) {
      // Only items with CONSIGNMENT status are eligible
      this.axiosCall("/jewelry-items?status=CONSIGNMENT", "GET")
        .then((res) => {
          const eligible = res?.data || [];
          // Exclude items already linked to an active consignment
          this.axiosCall("/consignment-items", "GET")
            .then((c) => {
              const takenIds = new Set(
                (c?.data || [])
                  .filter((ci) => ci.status === "active")
                  .map((ci) => ci.jewelryItemId)
              );
              // Keep the current item visible in Update mode
              if (currentJewelryItemId) takenIds.delete(currentJewelryItemId);
              this.jewelryItems = eligible.filter((i) => !takenIds.has(i.id));
            })
            .catch(() => { this.jewelryItems = eligible; });
        })
        .catch(() => {});
      this.axiosCall("/branches", "GET")
        .then((res) => { if (res?.data) this.branches = res.data; })
        .catch(() => {});
    },

    closeD() {
      eventBus.emit("closeConsignmentItemsDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.ConsignmentItemsFormref.validate();
      if (!valid) return;

      // Validate items
      const incomplete = this.items.filter((r) => !r.jewelryItemId || r.consignedPrice == null || r.sellingPrice == null);
      if (incomplete.length > 0) {
        this.itemsError = "Each item row must have an item, consigned price, and selling price.";
        return;
      }
      this.itemsError = "";
      this.loading = true;

      const shared = {
        branchId: this.branchId,
        consignorName: this.consignorName,
        consignorEmail: this.consignorEmail || null,
        consignorPhone: this.consignorPhone || null,
        consignmentDate: this.consignmentDate,
        status: this.status,
        isAuthentic: this.isAuthentic ?? null,
        notes: this.notes || null,
      };

      try {
        for (const row of this.items) {
          await this.axiosCall("/consignment-items", "POST", {
            ...shared,
            jewelryItemId: row.jewelryItemId,
            consignedPrice: row.consignedPrice,
            sellingPrice: row.sellingPrice,
            commissionRate: row.commissionRate || null,
          });
        }
        this.fadeAwayMessage = {
          show: true, type: "success", header: "Success",
          message: `${this.items.length} consignment item${this.items.length !== 1 ? 's' : ''} created successfully`,
          top: 10,
        };
        this.closeD();
      } catch (e) {
        this.fadeAwayMessage = {
          show: true, type: "error", header: "Error",
          message: e?.response?.data?.message || "Failed to create consignment items",
          top: 10,
        };
      } finally {
        this.loading = false;
      }
    },

    async update() {
      const { valid } = await this.$refs.ConsignmentItemsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        jewelryItemId: this.jewelryItemId,
        branchId: this.branchId,
        consignorName: this.consignorName,
        consignorEmail: this.consignorEmail || null,
        consignorPhone: this.consignorPhone || null,
        consignedPrice: this.consignedPrice,
        sellingPrice: this.sellingPrice,
        commissionRate: this.commissionRate || null,
        consignmentDate: this.consignmentDate,
        status: this.status,
        isAuthentic: this.isAuthentic ?? null,
        notes: this.notes || null,
      };

      this.axiosCall("/consignment-items/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Consignment item updated successfully", top: 10 };
            this.closeD();
          } else {
            this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: res?.data?.message || "Failed to update", top: 10 };
          }
        })
        .catch((e) => {
          this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to update", top: 10 };
        })
        .finally(() => { this.loading = false; });
    },
  },
};
</script>

<style scoped>
.dialog-header { min-height: 56px; }

.section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
  margin-bottom: 4px;
}
.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-add-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid rgba(155,107,58,0.3);
  border-radius: 7px;
  padding: 5px 12px;
  font-size: 12px;
  font-family: 'Outfit', sans-serif;
  color: #9B6B3A;
  cursor: pointer;
  transition: all 0.12s;
}
.btn-add-row:hover { background: rgba(155,107,58,0.08); border-color: #9B6B3A; }

.items-table-wrap {
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 10px;
  overflow: hidden;
}

.items-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.items-tbl thead th {
  background: #F5EFE4;
  padding: 8px 10px;
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9A7858;
  white-space: nowrap;
}
.items-tbl tbody tr { border-top: 1px solid rgba(155,107,58,0.12); }
.items-tbl tbody td { padding: 8px 6px; vertical-align: middle; }

.autofill-cell { text-align: center; }
.autofill-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: #3D7A5A;
  background: rgba(61,122,90,0.1);
  border-radius: 10px;
  padding: 2px 7px;
}

.btn-remove-row {
  background: none;
  border: none;
  color: #9A7858;
  cursor: pointer;
  padding: 3px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  transition: color 0.12s;
}
.btn-remove-row:hover:not([disabled]) { color: #B84040; }
.btn-remove-row[disabled] { opacity: 0.3; cursor: default; }

.items-summary {
  font-size: 11px;
  color: #9A7858;
  margin-top: 6px;
  text-align: right;
}

.items-error {
  font-size: 12px;
  color: #B84040;
  background: rgba(184,64,64,0.07);
  border: 1px solid rgba(184,64,64,0.2);
  border-radius: 7px;
  padding: 6px 12px;
  margin-top: 6px;
}

.v-card { box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15); }
.v-card-actions > .v-btn { min-width: 120px; }
</style>
