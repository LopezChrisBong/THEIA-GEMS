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
          <v-card-text style="max-height: 80vh; overflow-y: auto" class="py-6 px-6">
            <v-container fluid>
              <v-row dense>
                <!-- Transfer Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="section-heading">Transfer Information</h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="transferNumber"
                    label="Transfer Number"
                    :rules="[formRules.required]"
                    variant="outlined"
                    density="compact"
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
                    variant="outlined"
                    density="compact"
                    color="primary"
                    hint="Date of transfer"
                    persistent-hint
                  />
                </v-col>

                <!-- Branch Selection -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="section-heading">Branch Selection</h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="fromBranchId"
                    :items="branches"
                    item-title="branchName"
                    item-value="branchId"
                    label="From Branch"
                    :rules="[formRules.required, validateDifferentBranches]"
                    variant="outlined"
                    density="compact"
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
                    variant="outlined"
                    density="compact"
                    color="primary"
                    hint="Destination branch"
                    persistent-hint
                  />
                </v-col>

                <!-- Status & Dates -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="section-heading">Status & Completion</h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-select
                    v-model="status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    :rules="[formRules.required]"
                    variant="outlined"
                    density="compact"
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
                    variant="outlined"
                    density="compact"
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
                    variant="outlined"
                    density="compact"
                    clearable
                    color="primary"
                    rows="2"
                    hint="Additional notes (optional)"
                    persistent-hint
                  />
                </v-col>

                <!-- ── Tracking (Update mode, show when data present) ── -->
                <template v-if="action === 'Update' && (transferredByName || receivedByName)">
                  <v-col cols="12" class="mt-2 mb-1">
                    <v-divider class="mb-3" />
                    <h3 class="section-heading mb-2">Tracking</h3>
                  </v-col>
                  <v-col cols="12" md="6" class="mb-3" v-if="transferredByName">
                    <div class="tracking-info-chip">
                      <v-icon size="15" color="#9B6B3A">mdi-truck-delivery-outline</v-icon>
                      <div>
                        <div class="tracking-info-label">Dispatched by</div>
                        <div class="tracking-info-value">{{ transferredByName }}</div>
                        <div class="tracking-info-time" v-if="transferredAt">{{ formatDatetime(transferredAt) }}</div>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6" class="mb-3" v-if="receivedByName">
                    <div class="tracking-info-chip receive">
                      <v-icon size="15" color="#3D7A5A">mdi-package-variant-closed-check</v-icon>
                      <div>
                        <div class="tracking-info-label">Received by</div>
                        <div class="tracking-info-value">{{ receivedByName }}</div>
                        <div class="tracking-info-time" v-if="receivedAt">{{ formatDatetime(receivedAt) }}</div>
                      </div>
                    </div>
                  </v-col>
                </template>

                <!-- ── Transfer Items (Update mode only) ── -->
                <template v-if="action === 'Update'">
                  <v-col cols="12" class="mt-2 mb-2">
                    <v-divider class="mb-4" />
                    <div class="items-section-header">
                      <h3 class="section-heading mb-0">Transfer Items</h3>
                      <span class="items-badge" v-if="transferItems.length > 0">{{ transferItems.length }}</span>
                    </div>
                  </v-col>

                  <!-- Current items list -->
                  <v-col cols="12" class="mb-2">
                    <div v-if="itemsLoading" class="d-flex align-center gap-2 py-2">
                      <v-progress-circular size="16" indeterminate color="primary" />
                      <span class="text-caption text-medium-emphasis">Loading items...</span>
                    </div>
                    <template v-else>
                      <div v-if="transferItems.length === 0" class="text-caption text-medium-emphasis py-2">
                        No items added yet. Use the form below to add items.
                      </div>
                      <div v-else class="items-list">
                        <div v-for="ti in transferItems" :key="ti.id" class="item-row">
                          <div class="item-info">
                            <span class="item-code">{{ ti.jewelryItem?.itemCode || '—' }}</span>
                            <span class="item-detail" v-if="ti.jewelryItem?.brand">{{ ti.jewelryItem.brand }}</span>
                            <span class="item-qty">× {{ ti.quantity ?? 1 }}</span>
                            <span class="item-notes" v-if="ti.notes">· {{ ti.notes }}</span>
                          </div>
                          <button class="item-remove-btn" @click="removeItem(ti.id)" :disabled="removingId === ti.id" title="Remove item">
                            <v-icon size="14">mdi-close</v-icon>
                          </button>
                        </div>
                      </div>
                    </template>
                  </v-col>

                  <!-- Add item form -->
                  <v-col cols="12">
                    <div v-if="showAddItem" class="add-item-form">
                      <v-row dense>
                        <v-col cols="12" md="5">
                          <v-autocomplete
                            v-model="newItem.jewelryItemId"
                            :items="jewelryItems"
                            :item-title="(item) => `${item.itemCode}${item.brand ? ' – ' + item.brand : ''}`"
                            item-value="id"
                            label="Jewelry Item"
                            variant="outlined"
                            density="compact"
                            color="primary"
                            :loading="jewelryItemsLoading"
                            clearable
                          />
                        </v-col>
                        <v-col cols="6" md="2">
                          <v-text-field
                            v-model.number="newItem.quantity"
                            label="Qty"
                            type="number"
                            min="1"
                            variant="outlined"
                            density="compact"
                            color="primary"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-text-field
                            v-model="newItem.notes"
                            label="Notes (optional)"
                            variant="outlined"
                            density="compact"
                            color="primary"
                          />
                        </v-col>
                        <v-col cols="12" md="2" class="d-flex align-center gap-1">
                          <v-btn size="small" color="primary" @click="addItem" :loading="addingItem" :disabled="!newItem.jewelryItemId">
                            Add
                          </v-btn>
                          <v-btn size="small" variant="text" @click="cancelAddItem">
                            Cancel
                          </v-btn>
                        </v-col>
                      </v-row>
                    </div>
                    <v-btn
                      v-else
                      size="small"
                      variant="outlined"
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="openAddItem"
                    >
                      Add Item
                    </v-btn>
                  </v-col>
                </template>
              </v-row>
            </v-container>
          </v-card-text>

          <v-divider />

          <!-- Actions -->
          <v-card-actions class="px-6 py-4 justify-end">
            <v-btn variant="text" color="red" rounded="lg" @click="closeD">Cancel</v-btn>
            <v-spacer />
            <v-btn v-if="action === 'Add'" color="primary" @click="add" rounded elevation="2" :loading="loading">
              <v-icon start>mdi-check-circle</v-icon>
              Add
            </v-btn>
            <v-btn v-else-if="action === 'Update'" color="primary" @click="update" rounded elevation="2" :loading="loading">
              <v-icon start>mdi-check-circle</v-icon>
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

      // Tracking
      transferredByName: null,
      transferredAt: null,
      receivedByName: null,
      receivedAt: null,

      // Items management
      transferItems: [],
      itemsLoading: false,
      showAddItem: false,
      addingItem: false,
      removingId: null,
      newItem: { jewelryItemId: null, quantity: 1, notes: '' },
      jewelryItems: [],
      jewelryItemsLoading: false,

      statusOptions: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "In Transit", value: "in_transit" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
      ],

      fadeAwayMessage: { show: false, type: "success", header: "Successfully Added!", message: "", top: 10 },
    };
  },
  watch: {
    data: {
      handler(data) {
        this.dialog = true;
        this.loadBranches();
        this.$refs.TransfersFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.transferNumber = data.transferNumber;
          this.fromBranchId = data.fromBranchId;
          this.toBranchId = data.toBranchId;
          this.status = data.status || 'pending';
          this.transferDate = data.transferDate ? this.formatDateForInput(data.transferDate) : null;
          this.receivedDate = data.receivedDate ? this.formatDateForInput(data.receivedDate) : null;
          this.notes = data.notes;
          // Tracking fields
          const tf = data.transferrer;
          this.transferredByName = tf ? `${tf.firstName || ''} ${tf.lastName || ''}`.trim() || null : null;
          this.transferredAt = data.transferredAt || null;
          const rc = data.receiver;
          this.receivedByName = rc ? `${rc.firstName || ''} ${rc.lastName || ''}`.trim() || null : null;
          this.receivedAt = data.receivedAt || null;
          // Load items and jewelry list for Update mode
          this.loadTransferItems();
          this.loadJewelryItems();
        } else {
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
      this.transferItems = [];
      this.showAddItem = false;
      this.newItem = { jewelryItemId: null, quantity: 1, notes: '' };
      this.transferredByName = null;
      this.transferredAt = null;
      this.receivedByName = null;
      this.receivedAt = null;
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
      return new Date(dateString).toISOString().split('T')[0];
    },

    formatDatetime(dt) {
      if (!dt) return '';
      return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    loadBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res && res.data) this.branches = res.data;
      });
    },

    loadTransferItems() {
      if (!this.id) return;
      this.itemsLoading = true;
      this.axiosCall("/transfer-items/transfer/" + this.id, "GET")
        .then((res) => { this.transferItems = res?.data || []; })
        .finally(() => { this.itemsLoading = false; });
    },

    loadJewelryItems() {
      if (this.jewelryItems.length > 0) return;
      this.jewelryItemsLoading = true;
      this.axiosCall("/jewelry-items", "GET")
        .then((res) => { this.jewelryItems = res?.data || []; })
        .finally(() => { this.jewelryItemsLoading = false; });
    },

    openAddItem() {
      this.showAddItem = true;
      this.newItem = { jewelryItemId: null, quantity: 1, notes: '' };
    },

    cancelAddItem() {
      this.showAddItem = false;
      this.newItem = { jewelryItemId: null, quantity: 1, notes: '' };
    },

    addItem() {
      if (!this.newItem.jewelryItemId) return;
      this.addingItem = true;
      this.axiosCall("/transfer-items", "POST", {
        transferId: this.id,
        jewelryItemId: this.newItem.jewelryItemId,
        quantity: this.newItem.quantity || 1,
        notes: this.newItem.notes || null,
      })
        .then(() => {
          this.cancelAddItem();
          this.loadTransferItems();
        })
        .catch(() => {
          this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to add item", top: 10 };
        })
        .finally(() => { this.addingItem = false; });
    },

    removeItem(transferItemId) {
      this.removingId = transferItemId;
      this.axiosCall("/transfer-items/" + transferItemId, "DELETE")
        .then(() => { this.loadTransferItems(); })
        .catch(() => {
          this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to remove item", top: 10 };
        })
        .finally(() => { this.removingId = null; });
    },

    closeD() {
      eventBus.emit("closeTransfersDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.TransfersFormref.validate();
      if (!valid) return;
      this.loading = true;
      this.axiosCall("/transfers", "POST", {
        transferNumber: this.transferNumber,
        fromBranchId: this.fromBranchId,
        toBranchId: this.toBranchId,
        status: this.status,
        transferDate: this.transferDate,
        receivedDate: this.receivedDate || null,
        notes: this.notes || null,
        requestedBy: Number(this.$store.state.user.userID),
      })
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Transfer created successfully", top: 10 };
            this.closeD();
          } else {
            this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: res?.data?.message || "Failed to create transfer", top: 10 };
          }
        })
        .catch((e) => {
          this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to create transfer", top: 10 };
        })
        .finally(() => { this.loading = false; });
    },

    async update() {
      const { valid } = await this.$refs.TransfersFormref.validate();
      if (!valid) return;
      this.loading = true;
      this.axiosCall("/transfers/" + this.id, "PATCH", {
        fromBranchId: this.fromBranchId,
        toBranchId: this.toBranchId,
        status: this.status,
        transferDate: this.transferDate,
        receivedDate: this.receivedDate || null,
        notes: this.notes || null,
      })
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Transfer updated successfully", top: 10 };
            this.closeD();
          } else {
            this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: res?.data?.message || "Failed to update transfer", top: 10 };
          }
        })
        .catch((e) => {
          this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to update transfer", top: 10 };
        })
        .finally(() => { this.loading = false; });
    },
  },
};
</script>

<style scoped>
.section-heading {
  font-size: 13px;
  font-weight: 600;
  color: #6B4A30;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.items-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.items-badge {
  background: rgba(155,107,58,0.12);
  color: #9B6B3A;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F9F3EA;
  border: 1px solid rgba(155,107,58,0.14);
  border-radius: 8px;
  padding: 7px 10px;
}
.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #3A2515;
}
.item-code {
  font-family: monospace;
  font-size: 12px;
  color: #9B6B3A;
  font-weight: 600;
}
.item-detail {
  color: #6B4A30;
}
.item-qty {
  background: rgba(155,107,58,0.1);
  color: #9B6B3A;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 6px;
}
.item-notes {
  font-size: 11px;
  color: #9A7858;
  font-style: italic;
}
.item-remove-btn {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(184,64,64,0.2);
  background: rgba(184,64,64,0.05);
  color: #B84040;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.12s;
}
.item-remove-btn:hover { background: rgba(184,64,64,0.12); }
.item-remove-btn[disabled] { opacity: 0.4; cursor: default; }
.tracking-info-chip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(155,107,58,0.07);
  border: 1px solid rgba(155,107,58,0.14);
  border-radius: 10px;
  padding: 10px 12px;
}
.tracking-info-chip.receive {
  background: rgba(61,122,90,0.07);
  border-color: rgba(61,122,90,0.14);
}
.tracking-info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9A7858; font-weight: 600; }
.tracking-info-value { font-size: 13px; font-weight: 600; color: #3A2515; margin-top: 1px; }
.tracking-info-time { font-size: 11px; color: #9A7858; margin-top: 2px; }
.add-item-form {
  background: #F9F3EA;
  border: 1px solid rgba(155,107,58,0.14);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 4px;
}
</style>
