<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Consignment Items</div>
        <div class="page-sub">Manage consignment items from consignors</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search consignments..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Consignment
        </button>
      </div>
    </div>

    <div class="cust-table-card">
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterStatus === null }" @click="filterStatus = null; initialize()">All</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'active' }" @click="filterStatus = 'active'; initialize()">Active</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'sold' }" @click="filterStatus = 'sold'; initialize()">Sold</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'returned' }" @click="filterStatus = 'returned'; initialize()">Returned</button>
        <div class="filter-spacer" />
        <div class="per-pg">
          Branch:
          <select v-model="filterBranch" @change="initialize()">
            <option :value="null">All</option>
            <option v-for="b in branchList" :key="b.branchId" :value="b.branchId">{{ b.branchName }}</option>
          </select>
        </div>
      </div>

      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th>Item</th>
              <th>Consignor</th>
              <th>Consigned Price</th>
              <th>Selling Price</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td>
                <span v-if="item.jewelryItem" class="cust-name">{{ item.jewelryItem.itemCode }}</span>
                <br v-if="item.jewelryItem && item.jewelryItem.brand">
                <span v-if="item.jewelryItem && item.jewelryItem.brand" class="dim">{{ item.jewelryItem.brand }}</span>
                <span v-if="!item.jewelryItem" class="dim">—</span>
              </td>
              <td>
                <span class="cust-name">{{ item.consignorName }}</span>
                <br v-if="item.consignorContact">
                <span v-if="item.consignorContact" class="dim">{{ item.consignorContact }}</span>
              </td>
              <td class="text-right">₱{{ formatNumber(item.consignedPrice) }}</td>
              <td class="text-right">₱{{ formatNumber(item.sellingPrice) }}</td>
              <td class="text-center">{{ item.commissionRate ? item.commissionRate + '%' : '—' }}</td>
              <td>
                <span class="repeat-badge" :class="'r-' + item.status">{{ formatStatus(item.status) }}</span>
              </td>
              <td>
                <span v-if="item.branch" class="repeat-badge r-primary">{{ item.branch.branchName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="dim">{{ formatDate(item.consignmentDate) }}</td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-handshake-outline</v-icon></div>
                  <div class="empty-title">No consignment items found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading consignments...</div>
        </div>
      </div>
    </div>

    <ConsignmentItemsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete the consignment for "{{ deleteData?.jewelryItem?.itemCode || deleteData?.consignorName }}"?</v-card-text>
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
import ConsignmentItemsDialog from "../../components/Dialogs/Forms/ConsignmentItemsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { ConsignmentItemsDialog },
  data: () => ({
    search: "", filterStatus: null, filterBranch: null,
    data: [], branchList: [], deleteData: null, updateData: null,
    loading: false, deleting: false, action: null, dialogConfirmDelete: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),
  computed: {
    filteredData() {
      if (!this.search) return this.data;
      const q = this.search.toLowerCase();
      return this.data.filter((c) =>
        [c.consignorName, c.consignorContact, c.jewelryItem?.itemCode].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
      );
    },
  },
  mounted() {
    this.initialize(); this.loadBranches();
    eventBus.on("closeConsignmentItemsDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeConsignmentItemsDialog"); },
  methods: {
    formatDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); },
    formatNumber(v) { if (v == null) return "0.00"; return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    formatStatus(s) { if (!s) return "—"; return s.charAt(0).toUpperCase() + s.slice(1); },
    loadBranches() { this.axiosCall("/branches", "GET").then((r) => { if (r && r.data) this.branchList = r.data; }); },
    initialize() {
      this.loading = true;
      let url = "/consignment-items";
      if (this.filterStatus) url = "/consignment-items/status/" + this.filterStatus;
      if (this.filterBranch) url = "/consignment-items/branch/" + this.filterBranch;
      this.axiosCall(url, "GET").then((r) => { if (r && r.data) this.data = r.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load consignments", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/consignment-items/" + this.deleteData.id, "DELETE")
        .then((r) => { if (r && (r.status === 200 || r.status === 204)) { this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Deleted successfully", top: 10 }; this.dialogConfirmDelete = false; this.deleteData = null; this.initialize(); } })
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
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit', sans-serif; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }
.btn-add { display: flex; align-items: center; gap: 7px; background: #9B6B3A; color: #FDFAF6; border: none; padding: 9px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(155,107,58,0.3); transition: background 0.13s; }
.btn-add:hover { background: #C49455; }
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit'; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit'; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
td.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
td.dim, .dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-active { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-sold { background: rgba(90,122,155,0.1); color: #5A7A9B; }
.r-returned { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
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
