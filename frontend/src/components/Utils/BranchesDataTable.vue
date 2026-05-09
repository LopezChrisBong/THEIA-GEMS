<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Branches</div>
        <div class="page-sub">Manage and view branch locations</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Search branches..."
            class="search-input-proto"
          />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Branch
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th @click="sortBy('branchId')">ID</th>
              <th @click="sortBy('branchName')">Branch Name</th>
              <th @click="sortBy('branchCode')">Code</th>
              <th @click="sortBy('address')">Address</th>
              <th @click="sortBy('phone')">Phone</th>
              <th @click="sortBy('email')">Email</th>
              <th @click="sortBy('isActive')">Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.branchId">
              <td class="mono">{{ item.branchId }}</td>
              <td><span class="cust-name">{{ item.branchName }}</span></td>
              <td class="mono">{{ item.branchCode || '—' }}</td>
              <td class="dim">{{ item.address || '—' }}</td>
              <td>{{ item.phone || '—' }}</td>
              <td class="dim">{{ item.email || '—' }}</td>
              <td>
                <span class="repeat-badge" :class="item.isActive ? 'r-yes' : 'r-no'">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="Edit" @click="editItem(item)">
                    <v-icon size="14">mdi-pencil-outline</v-icon>
                  </button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)">
                    <v-icon size="14">mdi-delete-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="sortedData.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-store-outline</v-icon></div>
                  <div class="empty-title">No branches found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading branches...</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="cust-pagination" v-if="sortedData.length > 0">
        <div class="pg-info">Showing {{ pgStart }}–{{ pgEnd }} of {{ sortedData.length }}</div>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="page <= 1" @click="page = 1">&laquo;</button>
          <button class="pg-btn" :disabled="page <= 1" @click="page--">&lsaquo;</button>
          <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="{ cur: p === page }" @click="page = p">{{ p }}</button>
          <button class="pg-btn" :disabled="page >= totalPages" @click="page++">&rsaquo;</button>
          <button class="pg-btn" :disabled="page >= totalPages" @click="page = totalPages">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <BranchesDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete the branch "{{ deleteData?.branchName }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogConfirmDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </v-container>
</template>

<script>
import BranchesDialog from "../../components/Dialogs/Forms/BranchesDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { BranchesDialog },

  data: () => ({
    search: "",
    page: 1,
    perPage: 10,
    sortKey: "branchId",
    sortDir: "asc",
    data: [],
    deleteData: null,
    updateData: null,
    loading: false,
    deleting: false,
    action: null,
    dialogConfirmDelete: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),

  computed: {
    sortedData() {
      let result = [...this.data];
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((b) =>
          [b.branchName, b.branchCode, b.address, b.phone, b.email].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = a[this.sortKey] ?? "", vb = b[this.sortKey] ?? "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return this.sortDir === "asc" ? -1 : 1;
        if (va > vb) return this.sortDir === "asc" ? 1 : -1;
        return 0;
      });
      return result;
    },
    totalPages() { return Math.max(1, Math.ceil(this.sortedData.length / this.perPage)); },
    paginatedData() { const s = (this.page - 1) * this.perPage; return this.sortedData.slice(s, s + this.perPage); },
    pgStart() { return Math.min((this.page - 1) * this.perPage + 1, this.sortedData.length); },
    pgEnd() { return Math.min(this.page * this.perPage, this.sortedData.length); },
    visiblePages() { const p = []; const s = Math.max(1, this.page - 2); for (let i = s; i <= Math.min(this.totalPages, s + 4); i++) p.push(i); return p; },
  },

  mounted() {
    this.initialize();
    eventBus.on("closeBranchesDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeBranchesDialog"); },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      else { this.sortKey = key; this.sortDir = "asc"; }
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/branches", "GET").then((res) => { if (res && res.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load branches", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { branchId: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/branches/" + this.deleteData.branchId, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Branch deleted successfully", top: 10 };
            this.dialogConfirmDelete = false; this.deleteData = null; this.initialize();
          }
        })
        .catch((error) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: error?.response?.data?.message || "Failed to delete branch", top: 10 }; })
        .finally(() => { this.deleting = false; });
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; letter-spacing: 0.02em; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 9px; padding: 8px 13px; box-shadow: 0 1px 6px rgba(80,30,10,0.08); min-width: 210px; }
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit', sans-serif; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }
.btn-add { display: flex; align-items: center; gap: 7px; background: #9B6B3A; color: #FDFAF6; border: none; padding: 9px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(155,107,58,0.3); transition: background 0.13s; }
.btn-add:hover { background: #C49455; }
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 760px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; cursor: pointer; user-select: none; }
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
td.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
td.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.repeat-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-yes { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-no { background: rgba(184,64,64,0.08); color: #B84040; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.cust-pagination { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-top: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; }
.pg-info { font-size: 12px; color: #9A7858; }
.pg-btns { display: flex; align-items: center; gap: 3px; }
.pg-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; font-family: 'Outfit', sans-serif; }
.pg-btn:hover:not([disabled]) { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.pg-btn[disabled] { opacity: 0.3; cursor: default; }
.pg-btn.cur { background: #9B6B3A; color: #FDFAF6; border-color: #9B6B3A; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-cancel-proto:hover { border-color: rgba(155,107,58,0.35); color: #6B4A30; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; }
.btn-danger-proto:hover { background: #c95252; }
</style>
