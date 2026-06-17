<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Layaway Plans</div>
        <div class="page-sub">Manage customer installment plans and payment schedules</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search plans..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          New Plan
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterStatus === 'all' }" @click="filterStatus = 'all'">All</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'active' }" @click="filterStatus = 'active'">Active</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'completed' }" @click="filterStatus = 'completed'">Completed</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'defaulted' }" @click="filterStatus = 'defaulted'">Defaulted</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'cancelled' }" @click="filterStatus = 'cancelled'">Cancelled</button>
        <div class="filter-spacer" />
        <div class="per-pg">
          Items per page:
          <select v-model="perPage" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th @click="sortBy('planNumber')">Plan #</th>
              <th>Sale #</th>
              <th @click="sortBy('customer')">Customer</th>
              <th @click="sortBy('branch')">Branch</th>
              <th @click="sortBy('totalAmount')" class="text-right">Total</th>
              <th @click="sortBy('remainingBalance')" class="text-right">Balance</th>
              <th class="text-center">Progress</th>
              <th @click="sortBy('nextPaymentDate')" class="text-center">Next Payment</th>
              <th @click="sortBy('status')" class="text-center">Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.planNumber }}</td>
              <td class="mono dim">{{ item.sale?.saleNumber || '—' }}</td>
              <td>
                <span class="cust-name">{{ item.customer ? item.customer.firstName + ' ' + item.customer.lastName : '—' }}</span>
              </td>
              <td class="dim">{{ item.branch?.branchName || '—' }}</td>
              <td class="text-right">
                <span class="amt-col">₱{{ formatNumber(item.totalAmount) }}</span>
              </td>
              <td class="text-right">
                <span :class="Number(item.remainingBalance) > 0 ? 'bal-due' : 'bal-zero'">
                  ₱{{ formatNumber(item.remainingBalance) }}
                </span>
              </td>
              <td class="text-center">
                <div class="prog-wrap">
                  <div class="prog-track">
                    <div class="prog-fill" :style="{ width: getProgress(item) + '%' }" :class="getProgressClass(item)" />
                  </div>
                  <span class="prog-label">{{ item.paymentsMade }}/{{ item.numberOfPayments }}</span>
                </div>
              </td>
              <td class="text-center">
                <span v-if="item.nextPaymentDate" :class="isOverdue(item.nextPaymentDate) ? 'overdue-date' : 'dim'">
                  {{ formatDate(item.nextPaymentDate) }}
                  <span v-if="isOverdue(item.nextPaymentDate)" class="overdue-dot"> ●</span>
                </span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="'s-' + item.status">{{ formatStatus(item.status) }}</span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn view-btn" title="View Payments" @click="viewPlan(item)">
                    <v-icon size="14">mdi-eye-outline</v-icon>
                  </button>
                  <button class="act-btn" title="Edit" @click="editItem(item)">
                    <v-icon size="14">mdi-pencil-outline</v-icon>
                  </button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)" :disabled="item.status === 'completed'">
                    <v-icon size="14">mdi-delete-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="10">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-calendar-clock</v-icon></div>
                  <div class="empty-title">No layaway plans found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading layaway plans...</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="cust-pagination" v-if="filteredData.length > 0">
        <div class="pg-info">Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredData.length }}</div>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage = 1">&laquo;</button>
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">&lsaquo;</button>
          <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="{ cur: p === currentPage }" @click="currentPage = p">{{ p }}</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">&rsaquo;</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- View Payments Modal -->
    <v-dialog v-model="dialogView" max-width="760px">
      <v-card v-if="viewData" class="ph-card">
        <div class="ph-header">
          <div class="ph-avatar">
            <v-icon size="20" color="#FDFAF6">mdi-calendar-clock</v-icon>
          </div>
          <div class="ph-info">
            <div class="ph-name">{{ viewData.planNumber }}</div>
            <div class="ph-meta">
              <span v-if="viewData.customer">{{ viewData.customer.firstName }} {{ viewData.customer.lastName }}</span>
              <span v-if="viewData.branch" class="ph-dot">·</span>
              <span v-if="viewData.branch">{{ viewData.branch.branchName }}</span>
              <span v-if="viewData.sale" class="ph-dot">·</span>
              <span v-if="viewData.sale" class="mono dim">{{ viewData.sale.saleNumber }}</span>
            </div>
          </div>
          <div>
            <span class="status-badge" :class="'s-' + viewData.status">{{ formatStatus(viewData.status) }}</span>
          </div>
          <button class="ph-close" @click="dialogView = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>

        <!-- Stats -->
        <div class="ph-stats">
          <div class="ph-stat">
            <div class="ph-stat-val">₱{{ formatNumber(viewData.totalAmount) }}</div>
            <div class="ph-stat-lbl">Total Amount</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val">₱{{ formatNumber(viewData.downPayment) }}</div>
            <div class="ph-stat-lbl">Down Payment</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val" :class="Number(viewData.remainingBalance) > 0 ? 'bal-due' : 'bal-zero'">₱{{ formatNumber(viewData.remainingBalance) }}</div>
            <div class="ph-stat-lbl">Remaining</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val">₱{{ formatNumber(viewData.monthlyPayment) }}</div>
            <div class="ph-stat-lbl">Monthly</div>
          </div>
        </div>

        <!-- Progress -->
        <div class="ph-progress-wrap">
          <div class="ph-progress-label">
            <span>Payment Progress</span>
            <span class="dim" style="font-size:11px">{{ viewData.paymentsMade || 0 }}/{{ viewData.numberOfPayments }} payments</span>
          </div>
          <div class="ph-progress-track">
            <div class="ph-progress-fill" :class="getProgressClass(viewData)" :style="{ width: getProgress(viewData) + '%' }"></div>
          </div>
          <div class="ph-tier-labels" v-if="viewData.nextPaymentDate">
            <span>Next due: <strong>{{ formatDate(viewData.nextPaymentDate) }}</strong></span>
            <span v-if="isOverdue(viewData.nextPaymentDate)" class="overdue-date">OVERDUE</span>
          </div>
        </div>

        <!-- Payments Table -->
        <div class="ph-history-header">
          <v-icon size="14" color="#9B6B3A">mdi-cash-multiple</v-icon>
          Payment History
          <span class="ph-count-badge" v-if="!loadingPayments">{{ planPayments.length }}</span>
        </div>
        <div class="ph-table-wrap">
          <div v-if="loadingPayments" class="ph-loading">
            <v-progress-circular indeterminate color="#9B6B3A" size="24" />
            <span>Loading payments...</span>
          </div>
          <div v-else-if="planPayments.length === 0" class="ph-empty">
            <v-icon size="28" color="#C4A882">mdi-cash-remove</v-icon>
            <div>No payment records found</div>
          </div>
          <table v-else class="ph-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Payment #</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Before</th>
                <th>After</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in planPayments" :key="p.id">
                <td class="mono">{{ p.receiptNumber }}</td>
                <td class="text-center dim">#{{ p.paymentNumber }}</td>
                <td class="amt-col">₱{{ formatNumber(p.amount) }}</td>
                <td><span class="method-badge">{{ formatMethod(p.paymentMethod) }}</span></td>
                <td class="dim">₱{{ formatNumber(p.balanceBefore) }}</td>
                <td :class="parseFloat(p.balanceAfter) === 0 ? 'bal-zero' : 'bal-due'">₱{{ formatNumber(p.balanceAfter) }}</td>
                <td class="dim">{{ formatDate(p.paymentDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </v-dialog>

    <!-- Dialogs -->
    <LayawayPlansDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1" style="color: #6B4A30;">
          Are you sure you want to delete this layaway plan?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogConfirmDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
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
import LayawayPlansDialog from "../../components/Dialogs/Forms/LayawayPlansDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { LayawayPlansDialog },

  data: () => ({
    search: "",
    filterStatus: "all",
    currentPage: 1,
    perPage: 10,
    sortKey: "planNumber",
    sortDir: "asc",
    data: [],
    deleteData: null,
    updateData: null,
    loading: false,
    deleting: false,
    action: null,
    dialogConfirmDelete: false,
    dialogView: false,
    viewData: null,
    planPayments: [],
    loadingPayments: false,
    fadeAwayMessage: { show: false, type: "success", header: "", message: "", top: 10 },
  }),

  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterStatus !== "all") result = result.filter(p => p.status === this.filterStatus);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter(p =>
          [p.planNumber, p.sale?.saleNumber, p.customer?.firstName, p.customer?.lastName, p.branch?.branchName]
            .filter(Boolean).some(f => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = this.sortKey === 'customer' ? (a.customer?.firstName || '') :
                 this.sortKey === 'branch' ? (a.branch?.branchName || '') : (a[this.sortKey] ?? '');
        let vb = this.sortKey === 'customer' ? (b.customer?.firstName || '') :
                 this.sortKey === 'branch' ? (b.branch?.branchName || '') : (b[this.sortKey] ?? '');
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
      return result;
    },
    totalPages() { return Math.max(1, Math.ceil(this.filteredData.length / this.perPage)); },
    paginatedData() { const s = (this.currentPage - 1) * this.perPage; return this.filteredData.slice(s, s + this.perPage); },
    paginationStart() { return Math.min((this.currentPage - 1) * this.perPage + 1, this.filteredData.length); },
    paginationEnd() { return Math.min(this.currentPage * this.perPage, this.filteredData.length); },
    visiblePages() {
      const pages = []; const start = Math.max(1, this.currentPage - 2); const end = Math.min(this.totalPages, start + 4);
      for (let i = start; i <= end; i++) pages.push(i); return pages;
    },
  },

  mounted() {
    this.initialize();
    eventBus.on("closeLayawayPlansDialog", () => { this.initialize(); });
  },

  beforeUnmount() { eventBus.off("closeLayawayPlansDialog"); },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
      else { this.sortKey = key; this.sortDir = 'asc'; }
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    formatNumber(v) {
      if (v === null || v === undefined) return '0.00';
      return Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatStatus(s) { if (!s) return '—'; return s.charAt(0).toUpperCase() + s.slice(1); },
    formatMethod(m) {
      if (!m) return '—';
      return m.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },
    getProgress(item) {
      if (!item.numberOfPayments) return 0;
      return Math.min(100, (item.paymentsMade / item.numberOfPayments) * 100);
    },
    getProgressClass(item) {
      const p = this.getProgress(item);
      if (p >= 100) return 'prog-done';
      if (p >= 50) return 'prog-mid';
      if (p >= 25) return 'prog-low';
      return 'prog-start';
    },
    isOverdue(d) {
      if (!d) return false;
      const due = new Date(d); due.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return today > due;
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/layaway-plans", "GET")
        .then(res => { if (res && res.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: 'error', header: 'Error', message: 'Failed to load layaway plans', top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    viewPlan(item) {
      this.viewData = { ...item };
      this.planPayments = [];
      this.dialogView = true;
      this.loadingPayments = true;
      this.axiosCall("/layaway-payments/plan/" + item.id, "GET")
        .then(res => { if (res && res.data) this.planPayments = res.data; })
        .catch(() => {})
        .finally(() => { this.loadingPayments = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/layaway-plans/" + this.deleteData.id, "DELETE")
        .then(res => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: 'success', header: 'Deleted', message: 'Layaway plan deleted', top: 10 };
            this.dialogConfirmDelete = false; this.deleteData = null; this.initialize();
          }
        })
        .catch(e => { this.fadeAwayMessage = { show: true, type: 'error', header: 'Error', message: e?.response?.data?.message || 'Failed to delete', top: 10 }; })
        .finally(() => { this.deleting = false; });
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; }
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
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 960px; }
.cust-table thead th { text-align: left; padding: 10px 14px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; cursor: pointer; user-select: none; }
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 14px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
td.mono, .mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
td.dim, .dim { color: #9A7858; font-size: 12px; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.cust-name { font-weight: 500; }
.amt-col { font-weight: 600; color: #9B6B3A; }
.bal-due { color: #B84040; font-weight: 600; }
.bal-zero { color: #3D7A5A; font-weight: 600; }
.overdue-date { color: #B84040; font-size: 12px; font-weight: 600; }
.overdue-dot { font-size: 8px; }

/* Progress */
.prog-wrap { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.prog-track { flex: 1; height: 6px; background: #EDE0CC; border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.prog-start { background: #C4A882; }
.prog-low   { background: #9B6B3A; }
.prog-mid   { background: #4A9B6B; }
.prog-done  { background: #3D7A5A; }
.prog-label { font-size: 11px; color: #9A7858; white-space: nowrap; }

/* Status badges */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.s-active    { background: rgba(61,122,90,0.1);   color: #3D7A5A; }
.s-completed { background: rgba(155,107,58,0.1);  color: #9B6B3A; }
.s-defaulted { background: rgba(184,64,64,0.1);   color: #B84040; }
.s-cancelled { background: rgba(120,120,140,0.12); color: #5A5A72; }

/* Method badge */
.method-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; background: rgba(155,107,58,0.08); color: #9A7858; }

/* Action Buttons */
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.view-btn:hover { border-color: #4A9B6B; color: #3D7A5A; background: rgba(61,122,90,0.08); }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.act-btn[disabled] { opacity: 0.3; cursor: default; }

/* Pagination */
.cust-pagination { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-top: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; }
.pg-info { font-size: 12px; color: #9A7858; }
.pg-btns { display: flex; align-items: center; gap: 3px; }
.pg-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; font-family: 'Outfit', sans-serif; }
.pg-btn:hover:not([disabled]) { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.pg-btn[disabled] { opacity: 0.3; cursor: default; }
.pg-btn.cur { background: #9B6B3A; color: #FDFAF6; border-color: #9B6B3A; font-weight: 600; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }

/* Dialog Buttons */
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer; transition: all 0.12s; margin-right: 8px; }
.btn-cancel-proto:hover { border-color: rgba(155,107,58,0.35); color: #6B4A30; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background 0.12s; }
.btn-danger-proto:hover { background: #c95252; }
.btn-danger-proto[disabled] { opacity: 0.5; cursor: default; }

/* View Modal */
.ph-card { border-radius: 16px !important; border: 1px solid rgba(155,107,58,0.16) !important; overflow: hidden; background: #FDFAF6 !important; font-family: 'Outfit', sans-serif; }
.ph-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px; background: #F5EFE4; border-bottom: 1px solid rgba(155,107,58,0.16); position: relative; }
.ph-avatar { width: 46px; height: 46px; border-radius: 50%; background: #9B6B3A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ph-info { flex: 1; min-width: 0; }
.ph-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #3A2515; }
.ph-meta { font-size: 12px; color: #9A7858; margin-top: 2px; }
.ph-dot { margin: 0 5px; opacity: 0.5; }
.ph-close { position: absolute; top: 14px; right: 14px; background: none; border: none; cursor: pointer; color: #9A7858; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 7px; transition: all 0.12s; }
.ph-close:hover { background: rgba(155,107,58,0.12); color: #6B4A30; }
.ph-stats { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid rgba(155,107,58,0.1); }
.ph-stat { flex: 1; text-align: center; }
.ph-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #3A2515; }
.ph-stat-lbl { font-size: 10px; color: #9A7858; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
.ph-stat-div { width: 1px; height: 36px; background: rgba(155,107,58,0.16); }
.ph-progress-wrap { padding: 14px 24px; border-bottom: 1px solid rgba(155,107,58,0.1); }
.ph-progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #9A7858; margin-bottom: 7px; }
.ph-progress-track { height: 6px; background: #EDE0CC; border-radius: 3px; overflow: hidden; }
.ph-progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.ph-progress-fill.prog-start { background: #C4A882; }
.ph-progress-fill.prog-low   { background: #9B6B3A; }
.ph-progress-fill.prog-mid   { background: #4A9B6B; }
.ph-progress-fill.prog-done  { background: #3D7A5A; }
.ph-tier-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #9A7858; }
.ph-history-header { display: flex; align-items: center; gap: 7px; padding: 12px 24px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9A7858; }
.ph-count-badge { background: #EDE0CC; color: #9B6B3A; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px; }
.ph-table-wrap { padding: 0 16px 16px; max-height: 280px; overflow-y: auto; }
.ph-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 32px; color: #9A7858; font-size: 13px; }
.ph-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px; color: #C4A882; font-size: 13px; }
.ph-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ph-table thead th { text-align: left; padding: 8px 10px; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; position: sticky; top: 0; }
.ph-table tbody tr { border-top: 1px solid rgba(155,107,58,0.1); }
.ph-table tbody tr:hover { background: #EDE0CC; }
.ph-table tbody td { padding: 9px 10px; color: #3A2515; white-space: nowrap; }
</style>
