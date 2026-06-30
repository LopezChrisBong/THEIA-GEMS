<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Suppliers</div>
        <div class="page-sub">Manage and view suppliers</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Search suppliers..."
            class="search-input-proto"
          />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Supplier
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterType === 'all' }" @click="filterType = 'all'">All</button>
        <button class="filter-chip" :class="{ on: filterType === 'active' }" @click="filterType = 'active'">Active</button>
        <button class="filter-chip" :class="{ on: filterType === 'inactive' }" @click="filterType = 'inactive'">Inactive</button>
        <div class="filter-spacer" />
        <div class="per-pg">
          Items per page:
          <select v-model="perPage" @change="page = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th @click="sortBy('id')">ID</th>
              <th @click="sortBy('supplierName')">Supplier Name</th>
              <th @click="sortBy('supplierType')">Type</th>
              <th @click="sortBy('contactPerson')">Contact Person</th>
              <th @click="sortBy('phone')">Phone</th>
              <th @click="sortBy('email')">Email</th>
              <th @click="sortBy('isActive')">Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.id }}</td>
              <td><span class="cust-name">{{ item.supplierName }}</span></td>
              <td>
                <span class="repeat-badge" :class="item.supplierType === 'theia_gems' ? 'r-primary' : 'r-secondary'">
                  {{ formatSupplierType(item.supplierType) }}
                </span>
              </td>
              <td>{{ item.contactPerson || '—' }}</td>
              <td>{{ item.phone || '—' }}</td>
              <td class="dim">{{ item.email || '—' }}</td>
              <td>
                <span class="repeat-badge" :class="item.isActive ? 'r-yes' : 'r-no'">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="View Items" @click="viewItems(item)">
                    <v-icon size="14">mdi-eye-outline</v-icon>
                  </button>
                  <button class="act-btn" title="Edit" @click="editItem(item)">
                    <v-icon size="14">mdi-pencil-outline</v-icon>
                  </button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)">
                    <v-icon size="14">mdi-delete-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-truck-outline</v-icon></div>
                  <div class="empty-title">No suppliers found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading suppliers...</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="cust-pagination" v-if="filteredData.length > 0">
        <div class="pg-info">Showing {{ pgStart }}–{{ pgEnd }} of {{ filteredData.length }}</div>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="page <= 1" @click="page = 1">&laquo;</button>
          <button class="pg-btn" :disabled="page <= 1" @click="page--">&lsaquo;</button>
          <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="{ cur: p === page }" @click="page = p">{{ p }}</button>
          <button class="pg-btn" :disabled="page >= totalPages" @click="page++">&rsaquo;</button>
          <button class="pg-btn" :disabled="page >= totalPages" @click="page = totalPages">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Supplier Items Modal -->
    <v-dialog v-model="dialogItems" max-width="860px">
      <v-card style="border-radius:16px;overflow:hidden;font-family:'Outfit',sans-serif;">
        <!-- Header -->
        <div class="items-modal-hdr">
          <div>
            <div class="items-modal-title">
              <v-icon size="16" color="#9B6B3A" style="margin-right:8px">mdi-package-variant-outline</v-icon>
              Items under {{ selectedSupplier?.supplierName }}
            </div>
            <div class="items-modal-sub">{{ supplierItems.length }} item{{ supplierItems.length !== 1 ? 's' : '' }} found</div>
          </div>
          <button class="items-modal-close" @click="dialogItems = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>

        <!-- Table -->
        <div class="items-modal-body">
          <div v-if="loadingItems" class="items-loading">
            <v-progress-circular indeterminate color="#9B6B3A" size="28" />
            <span>Loading items...</span>
          </div>
          <div v-else-if="supplierItems.length === 0" class="items-empty">
            <v-icon size="32" color="#9A7858">mdi-package-variant-closed-remove</v-icon>
            <div>No items found for this supplier</div>
          </div>
          <table v-else class="items-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Name</th>
                <th>Material</th>
                <th>Carat</th>
                <th>Branch</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in supplierItems" :key="item.id">
                <td class="item-code">{{ item.itemCode }}</td>
                <td>{{ item.category?.categoryName || '—' }}</td>
                <td>{{ item.brand || '—' }}</td>
                <td>{{ item.material || '—' }}</td>
                <td>{{ item.carat || '—' }}</td>
                <td>
                  <span class="branch-chip" v-if="item.branch">{{ item.branch.branchName }}</span>
                  <span v-else>—</span>
                </td>
                <td class="item-price">{{ item.price ? '₱' + Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—' }}</td>
                <td>
                  <span class="status-chip" :class="'s-' + (item.status || '').toLowerCase()">
                    {{ (item.status || '').replace(/_/g, ' ') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </v-dialog>

    <!-- Dialogs -->
    <SuppliersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete the supplier "{{ deleteData?.supplierName }}"?</v-card-text>
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
import SuppliersDialog from "../../components/Dialogs/Forms/SuppliersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { SuppliersDialog },

  data: () => ({
    search: "",
    filterType: "all",
    page: 1,
    perPage: 10,
    sortKey: "id",
    sortDir: "asc",
    data: [],
    deleteData: null,
    updateData: null,
    loading: false,
    deleting: false,
    action: null,
    dialogConfirmDelete: false,
    dialogItems: false,
    selectedSupplier: null,
    supplierItems: [],
    loadingItems: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),

  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterType === "active") result = result.filter((s) => s.isActive);
      else if (this.filterType === "inactive") result = result.filter((s) => !s.isActive);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((s) =>
          [s.supplierName, s.contactPerson, s.phone, s.email].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
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
    totalPages() { return Math.max(1, Math.ceil(this.filteredData.length / this.perPage)); },
    paginatedData() { const s = (this.page - 1) * this.perPage; return this.filteredData.slice(s, s + this.perPage); },
    pgStart() { return Math.min((this.page - 1) * this.perPage + 1, this.filteredData.length); },
    pgEnd() { return Math.min(this.page * this.perPage, this.filteredData.length); },
    visiblePages() { const p = []; const s = Math.max(1, this.page - 2); for (let i = s; i <= Math.min(this.totalPages, s + 4); i++) p.push(i); return p; },
  },

  mounted() {
    this.initialize();
    eventBus.on("closeSuppliersDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeSuppliersDialog"); },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      else { this.sortKey = key; this.sortDir = "asc"; }
    },
    formatSupplierType(type) {
      switch (type) {
        case "theia_gems": return "Theia Gems";
        case "external": return "External";
        default: return type || "—";
      }
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/suppliers", "GET").then((res) => { if (res && res.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load suppliers", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    viewItems(supplier) {
      this.selectedSupplier = supplier;
      this.supplierItems = [];
      this.dialogItems = true;
      this.loadingItems = true;
      this.axiosCall("/jewelry-items?supplierId=" + supplier.id, "GET")
        .then((res) => { this.supplierItems = res?.data || []; })
        .catch(() => { this.supplierItems = []; })
        .finally(() => { this.loadingItems = false; });
    },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/suppliers/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Supplier deleted successfully", top: 10 };
            this.dialogConfirmDelete = false; this.deleteData = null; this.initialize();
          }
        })
        .catch((error) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: error?.response?.data?.message || "Failed to delete supplier", top: 10 }; })
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
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit', sans-serif; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }
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
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.r-secondary { background: rgba(90,122,155,0.1); color: #5A7A9B; }
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

/* ── Supplier Items Modal ── */
.items-modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #F5EFE4; border-bottom: 1px solid rgba(155,107,58,0.16); }
.items-modal-title { font-size: 15px; font-weight: 600; color: #3A2515; display: flex; align-items: center; }
.items-modal-sub { font-size: 11px; color: #9A7858; margin-top: 2px; padding-left: 24px; }
.items-modal-close { background: none; border: none; cursor: pointer; color: #9A7858; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color 0.12s; }
.items-modal-close:hover { color: #B84040; }
.items-modal-body { padding: 16px 20px; max-height: 500px; overflow-y: auto; }
.items-loading { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 40px; color: #9A7858; font-size: 13px; }
.items-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #9A7858; font-size: 13px; }
.items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.items-table thead th { text-align: left; padding: 8px 12px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.items-table tbody tr { border-top: 1px solid rgba(155,107,58,0.12); transition: background 0.1s; }
.items-table tbody tr:hover { background: #F5EFE4; }
.items-table tbody td { padding: 9px 12px; color: #3A2515; vertical-align: middle; }
.item-code { font-family: monospace; font-weight: 700; color: #9B6B3A; }
.item-price { font-weight: 600; color: #9B6B3A; }
.branch-chip { background: rgba(90,122,155,0.12); color: #5A7A9B; border-radius: 20px; padding: 2px 8px; font-size: 11px; }
.status-chip { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; text-transform: capitalize; background: rgba(155,107,58,0.1); color: #9B6B3A; }
.s-in_stock { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.s-sold { background: rgba(90,122,155,0.12); color: #5A7A9B; }
.s-transferred { background: rgba(200,120,40,0.12); color: #C87828; }
.s-layaway { background: rgba(100,170,200,0.12); color: #4A9AB8; }
.s-pulled_out { background: rgba(150,150,150,0.12); color: #888; }
</style>
