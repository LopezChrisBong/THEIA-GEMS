<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Transfers</div>
        <div class="page-sub">Manage inventory transfers between branches</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search transfers..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          New Transfer
        </button>
      </div>
    </div>

    <div class="cust-table-card">
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th style="width:32px;"></th>
              <th>Transfer #</th>
              <th>From Branch</th>
              <th>To Branch</th>
              <th>Status</th>
              <th>Requested By</th>
              <th>Transfer Date</th>
              <th>Received Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody v-for="item in filteredData" :key="item.id">
            <!-- Main row -->
            <tr :class="{ 'row-expanded': expandedId === item.id }">
              <td>
                <button class="expand-btn" @click="toggleExpand(item)" :title="expandedId === item.id ? 'Collapse items' : 'View items'">
                  <v-icon size="14" :class="{ 'rotate-icon': expandedId === item.id }">mdi-chevron-right</v-icon>
                </button>
              </td>
              <td class="mono">{{ item.transferNumber }}</td>
              <td>{{ item.fromBranch?.branchName || '—' }}</td>
              <td>{{ item.toBranch?.branchName || '—' }}</td>
              <td>
                <span class="repeat-badge" :class="'r-' + item.status">{{ formatStatus(item.status) }}</span>
              </td>
              <td>
                <span v-if="item.requester">{{ item.requester.fname }} {{ item.requester.lname }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="dim">{{ formatDate(item.transferDate) }}</td>
              <td class="dim">{{ formatDate(item.receivedDate) }}</td>
              <td>
                <div class="act-btns">
                  <button v-if="item.status === 'approved' && canDispatch(item)" class="act-btn dispatch" title="Dispatch (Mark In Transit)" @click="openDispatch(item)">
                    <v-icon size="14">mdi-truck-delivery-outline</v-icon>
                  </button>
                  <button v-if="item.status === 'in_transit' && canReceive(item)" class="act-btn receive" title="Receive Items" @click="openReceive(item)">
                    <v-icon size="14">mdi-package-variant-closed-check</v-icon>
                  </button>
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)" :disabled="item.status !== 'pending'"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <!-- Expanded items sub-row -->
            <tr v-if="expandedId === item.id" class="sub-row">
              <td colspan="9" class="sub-cell">
                <div class="items-panel">
                  <div class="items-panel-header">
                    <span class="items-panel-title">Items in {{ item.transferNumber }}</span>
                    <span class="items-count-badge" v-if="(itemsMap[item.id] || []).length > 0">
                      {{ (itemsMap[item.id] || []).length }} item{{ (itemsMap[item.id] || []).length !== 1 ? 's' : '' }}
                    </span>
                  </div>

                  <!-- Tracking: who transferred / received -->
                  <div class="tracking-row">
                    <div class="tracking-chip">
                      <v-icon size="12" color="#9A7858">mdi-account-arrow-right-outline</v-icon>
                      <span class="tracking-label">Transferred by:</span>
                      <span class="tracking-value">{{ item.transferrer ? (item.transferrer.fname + ' ' + item.transferrer.lname) : '—' }}</span>
                      <span class="tracking-time" v-if="item.transferredAt">· {{ formatDate(item.transferredAt) }}</span>
                    </div>
                    <div class="tracking-chip">
                      <v-icon size="12" color="#3D7A5A">mdi-account-check-outline</v-icon>
                      <span class="tracking-label">Received by:</span>
                      <span class="tracking-value">{{ item.receiver ? (item.receiver.fname + ' ' + item.receiver.lname) : '—' }}</span>
                      <span class="tracking-time" v-if="item.receivedAt">· {{ formatDate(item.receivedAt) }}</span>
                    </div>
                  </div>

                  <div v-if="itemsLoading[item.id]" class="items-loading">
                    <v-progress-circular size="16" indeterminate color="#9B6B3A" />
                    <span>Loading...</span>
                  </div>

                  <template v-else>
                    <table class="items-sub-table" v-if="(itemsMap[item.id] || []).length > 0">
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Qty</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="ti in itemsMap[item.id]" :key="ti.id">
                          <td class="mono">{{ ti.jewelryItem?.itemCode || '—' }}</td>
                          <td>{{ ti.jewelryItem?.brand || '—' }}</td>
                          <td>{{ ti.jewelryItem?.category?.categoryName || '—' }}</td>
                          <td>{{ ti.quantity ?? 1 }}</td>
                          <td class="dim">{{ ti.notes || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-else class="items-empty">
                      No items added to this transfer yet.
                    </div>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="filteredData.length === 0">
            <tr>
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-swap-horizontal</v-icon></div>
                  <div class="empty-title">No transfers found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading transfers...</div>
        </div>
      </div>
    </div>

    <TransfersDialog :data="updateData" :action="action" />
    <DispatchReceiveTransferDialog />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this transfer?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogConfirmDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <fade-away-message-component displayType="variation2" v-model="fadeAwayMessage.show" :message="fadeAwayMessage.message" :header="fadeAwayMessage.header" :top="fadeAwayMessage.top" :type="fadeAwayMessage.type" />
  </v-container>
</template>

<script>
import TransfersDialog from "../../components/Dialogs/Forms/TransfersDialog.vue";
import DispatchReceiveTransferDialog from "../../components/Dialogs/Forms/DispatchReceiveTransferDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { TransfersDialog, DispatchReceiveTransferDialog },
  data: () => ({
    search: "", data: [], deleteData: null, updateData: null,
    loading: false, deleting: false, action: null, dialogConfirmDelete: false,
    expandedId: null,
    itemsMap: {},
    itemsLoading: {},
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),
  computed: {
    filteredData() {
      if (!this.search) return this.data;
      const q = this.search.toLowerCase();
      return this.data.filter((t) =>
        [t.transferNumber, t.fromBranch?.branchName, t.toBranch?.branchName, t.status].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
      );
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closeTransfersDialog", () => {
      this.initialize();
      if (this.expandedId) this.loadItems(this.expandedId);
    });
    eventBus.on("transferActionDone", () => {
      this.initialize();
      if (this.expandedId) this.loadItems(this.expandedId);
    });
    eventBus.on("transferActionError", (msg) => {
      this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: msg, top: 10 };
    });
  },
  beforeUnmount() {
    eventBus.off("closeTransfersDialog");
    eventBus.off("transferActionDone");
    eventBus.off("transferActionError");
  },
  methods: {
    formatDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); },
    formatStatus(s) { if (!s) return "—"; return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "); },
    initialize() {
      this.loading = true;
      this.axiosCall("/transfers", "GET").then((r) => { if (r && r.data) this.data = r.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load transfers", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/transfers/" + this.deleteData.id, "DELETE")
        .then((r) => {
          if (r && (r.status === 200 || r.status === 204)) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Transfer deleted", top: 10 };
            this.dialogConfirmDelete = false;
            if (this.expandedId === this.deleteData.id) this.expandedId = null;
            this.deleteData = null;
            this.initialize();
          }
        })
        .catch((e) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to delete", top: 10 }; })
        .finally(() => { this.deleting = false; });
    },
    canDispatch(item) {
      const branchId = this.$store.state.user?.branchId;
      // null/undefined branchId = superadmin/owner, no branch restriction
      return !branchId || branchId === item.fromBranchId;
    },
    canReceive(item) {
      const branchId = this.$store.state.user?.branchId;
      return !branchId || branchId === item.toBranchId;
    },
    openDispatch(item) { eventBus.emit("openDispatchDialog", item); },
    openReceive(item) { eventBus.emit("openReceiveDialog", item); },
    toggleExpand(item) {
      if (this.expandedId === item.id) {
        this.expandedId = null;
        return;
      }
      this.expandedId = item.id;
      this.loadItems(item.id);
    },
    loadItems(transferId) {
      this.itemsLoading = { ...this.itemsLoading, [transferId]: true };
      this.axiosCall("/transfer-items/transfer/" + transferId, "GET")
        .then((r) => {
          this.itemsMap = { ...this.itemsMap, [transferId]: r?.data || [] };
        })
        .finally(() => {
          this.itemsLoading = { ...this.itemsLoading, [transferId]: false };
        });
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 9px; padding: 8px 13px; box-shadow: 0 1px 6px rgba(80,30,10,0.08); min-width: 210px; }
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit'; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }
.btn-add { display: flex; align-items: center; gap: 7px; background: #9B6B3A; color: #FDFAF6; border: none; padding: 9px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(155,107,58,0.3); transition: background 0.13s; }
.btn-add:hover { background: #C49455; }
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover:not(.sub-row) { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
.row-expanded { background: #F5EFE4 !important; }
td.mono, .mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-pending { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-approved { background: rgba(90,122,155,0.1); color: #5A7A9B; }
.r-in_transit { background: rgba(155,107,58,0.15); color: #9B6B3A; }
.r-completed { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-rejected { background: rgba(184,64,64,0.08); color: #B84040; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.act-btn.dispatch { color: #9B6B3A; }
.act-btn.dispatch:hover { border-color: #C49455; color: #9B6B3A; background: rgba(155,107,58,0.12); }
.act-btn.receive { color: #3D7A5A; }
.act-btn.receive:hover { border-color: #3D7A5A; color: #3D7A5A; background: rgba(61,122,90,0.1); }
.act-btn[disabled] { opacity: 0.3; cursor: default; }
.expand-btn { width: 22px; height: 22px; border-radius: 5px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; color: #9A7858; }
.expand-btn:hover { border-color: #C49455; background: #EDE0CC; }
.rotate-icon { transform: rotate(90deg); transition: transform 0.2s; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit'; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; }

/* Expanded sub-row */
.sub-row { background: #F9F3EA; }
.sub-cell { padding: 0 !important; border-top: none !important; }
.items-panel { padding: 14px 24px 16px 48px; border-top: 1px dashed rgba(155,107,58,0.2); }
.items-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.items-panel-title { font-size: 12px; font-weight: 600; color: #6B4A30; letter-spacing: 0.05em; text-transform: uppercase; }
.items-count-badge { background: rgba(155,107,58,0.12); color: #9B6B3A; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.items-loading { display: flex; align-items: center; gap: 8px; color: #9A7858; font-size: 12px; padding: 8px 0; }
.items-empty { color: #9A7858; font-size: 12px; font-style: italic; padding: 8px 0; }
.items-sub-table { width: 100%; border-collapse: collapse; font-size: 12px; max-width: 700px; }
.items-sub-table thead th { text-align: left; padding: 6px 12px; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: rgba(155,107,58,0.06); border-radius: 4px; }
.items-sub-table tbody tr { border-top: 1px solid rgba(155,107,58,0.08); }
.items-sub-table tbody td { padding: 7px 12px; color: #3A2515; }
.tracking-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; }
.tracking-chip { display: flex; align-items: center; gap: 5px; font-size: 11px; }
.tracking-label { color: #9A7858; font-weight: 500; }
.tracking-value { color: #3A2515; font-weight: 600; }
.tracking-time { color: #9A7858; }
</style>
