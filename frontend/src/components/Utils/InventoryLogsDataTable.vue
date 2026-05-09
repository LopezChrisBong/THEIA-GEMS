<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Inventory Logs</div>
        <div class="page-sub">Track all inventory changes and movements</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search logs..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Log
        </button>
      </div>
    </div>

    <div class="cust-table-card">
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterAction === null }" @click="filterAction = null">All</button>
        <button class="filter-chip" :class="{ on: filterAction === 'add' }" @click="filterAction = 'add'">Add</button>
        <button class="filter-chip" :class="{ on: filterAction === 'edit' }" @click="filterAction = 'edit'">Edit</button>
        <button class="filter-chip" :class="{ on: filterAction === 'sale' }" @click="filterAction = 'sale'">Sale</button>
        <button class="filter-chip" :class="{ on: filterAction === 'transfer_out' }" @click="filterAction = 'transfer_out'">Transfer Out</button>
        <button class="filter-chip" :class="{ on: filterAction === 'transfer_in' }" @click="filterAction = 'transfer_in'">Transfer In</button>
        <button class="filter-chip" :class="{ on: filterAction === 'return' }" @click="filterAction = 'return'">Return</button>
        <div class="filter-spacer" />
      </div>

      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item</th>
              <th>Branch</th>
              <th>Action</th>
              <th>Change</th>
              <th>Qty (Before / After)</th>
              <th>Reference</th>
              <th>By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td class="mono">{{ item.id }}</td>
              <td>
                <span v-if="item.product" class="cust-name">{{ item.product.productName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span v-if="item.branch" class="repeat-badge r-primary">{{ item.branch.branchName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td><span class="repeat-badge" :class="'r-action-' + item.actionType">{{ formatActionType(item.actionType) }}</span></td>
              <td>
                <span :class="{ 'text-pos': item.quantityChange > 0, 'text-neg': item.quantityChange < 0 }">
                  {{ item.quantityChange > 0 ? '+' : '' }}{{ item.quantityChange }}
                </span>
              </td>
              <td class="dim">{{ item.previousQuantity }} / {{ item.newQuantity }}</td>
              <td>
                <span v-if="item.referenceType" class="cust-name">{{ item.referenceType }}</span>
                <span v-if="item.referenceId" class="dim"> #{{ item.referenceId }}</span>
                <span v-if="!item.referenceType && !item.referenceId" class="dim">—</span>
              </td>
              <td>
                <span v-if="item.performer">{{ item.performer.firstName }} {{ item.performer.lastName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="dim">{{ formatDateTime(item.createdAt) }}</td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="10">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-clipboard-text-clock-outline</v-icon></div>
                  <div class="empty-title">No inventory logs found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading logs...</div>
        </div>
      </div>
    </div>

    <InventoryLogsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this inventory log?</v-card-text>
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
import InventoryLogsDialog from "../../components/Dialogs/Forms/InventoryLogsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { InventoryLogsDialog },
  data: () => ({
    search: "", filterAction: null, data: [], deleteData: null, updateData: null,
    loading: false, deleting: false, action: null, dialogConfirmDelete: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),
  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterAction) result = result.filter((l) => l.actionType === this.filterAction);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((l) =>
          [l.product?.productName, l.branch?.branchName, l.actionType, l.referenceType, l.performer?.firstName].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      return result;
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closeInventoryLogsDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeInventoryLogsDialog"); },
  methods: {
    formatDateTime(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); },
    formatActionType(t) {
      const labels = { add: "Add", edit: "Edit", delete: "Delete", adjust: "Adjust", transfer_out: "Transfer Out", transfer_in: "Transfer In", sale: "Sale", return: "Return" };
      return labels[t] || t || "—";
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/inventory-logs", "GET").then((r) => { if (r && r.data) this.data = r.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load logs", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/inventory-logs/" + this.deleteData.id, "DELETE")
        .then((r) => { if (r && (r.status === 200 || r.status === 204)) { this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Log deleted", top: 10 }; this.dialogConfirmDelete = false; this.deleteData = null; this.initialize(); } })
        .catch((e) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to delete", top: 10 }; })
        .finally(() => { this.deleting = false; });
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
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit'; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
td.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.text-pos { color: #3D7A5A; font-weight: 600; }
.text-neg { color: #B84040; font-weight: 600; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.r-action-add { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-action-edit { background: rgba(90,122,155,0.1); color: #5A7A9B; }
.r-action-delete { background: rgba(184,64,64,0.08); color: #B84040; }
.r-action-adjust { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-action-transfer_out { background: rgba(200,140,50,0.1); color: #C48C32; }
.r-action-transfer_in { background: rgba(0,150,136,0.1); color: #009688; }
.r-action-sale { background: rgba(155,107,58,0.15); color: #9B6B3A; }
.r-action-return { background: rgba(120,80,160,0.1); color: #7850A0; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit'; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; }
</style>
