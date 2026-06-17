<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Layaway Payments</div>
        <div class="page-sub">Track and record payments for active installment plans</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search payments..." class="search-input-proto" />
        </div>
        <LayawayPaymentsDialog />
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterMethod === 'all' }" @click="filterMethod = 'all'">All</button>
        <button class="filter-chip" :class="{ on: filterMethod === 'cash' }" @click="filterMethod = 'cash'">Cash</button>
        <button class="filter-chip" :class="{ on: filterMethod === 'gcash' }" @click="filterMethod = 'gcash'">GCash</button>
        <button class="filter-chip" :class="{ on: filterMethod === 'maya' }" @click="filterMethod = 'maya'">Maya</button>
        <button class="filter-chip" :class="{ on: filterMethod === 'bank_transfer' }" @click="filterMethod = 'bank_transfer'">Bank</button>
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
              <th @click="sortBy('receiptNumber')">Receipt #</th>
              <th @click="sortBy('layawayPlan')">Plan #</th>
              <th class="text-center" @click="sortBy('paymentNumber')">Payment #</th>
              <th>Customer</th>
              <th @click="sortBy('amount')" class="text-right">Amount</th>
              <th class="text-center" @click="sortBy('paymentMethod')">Method</th>
              <th @click="sortBy('balanceBefore')" class="text-right">Before</th>
              <th @click="sortBy('balanceAfter')" class="text-right">After</th>
              <th>Received By</th>
              <th @click="sortBy('paymentDate')" class="text-center">Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.receiptNumber }}</td>
              <td class="mono">{{ item.layawayPlan?.planNumber || '—' }}</td>
              <td class="text-center"><span class="pay-num">#{{ item.paymentNumber }}</span></td>
              <td>
                <span class="cust-name" v-if="item.layawayPlan?.customer">
                  {{ item.layawayPlan.customer.firstName }} {{ item.layawayPlan.customer.lastName }}
                </span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-right"><span class="amt-col">₱{{ formatNumber(item.amount) }}</span></td>
              <td class="text-center"><span class="method-badge" :class="'m-' + item.paymentMethod">{{ formatMethod(item.paymentMethod) }}</span></td>
              <td class="text-right dim">₱{{ formatNumber(item.balanceBefore) }}</td>
              <td class="text-right">
                <span :class="parseFloat(item.balanceAfter) === 0 ? 'bal-zero' : 'bal-remaining'">
                  ₱{{ formatNumber(item.balanceAfter) }}
                </span>
              </td>
              <td class="dim">
                {{ item.receiver ? (item.receiver.first_name || '') + ' ' + (item.receiver.last_name || '') : '—' }}
              </td>
              <td class="text-center dim">{{ formatDate(item.paymentDate) }}</td>
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
            <tr v-if="filteredData.length === 0">
              <td colspan="11">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-cash-multiple</v-icon></div>
                  <div class="empty-title">No layaway payments found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading payments...</div>
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

    <!-- Delete Confirm -->
    <v-dialog v-model="dialogDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this payment record?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="deleteItemConfirm">Delete</button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import eventBus from "@/eventBus";
import LayawayPaymentsDialog from "./LayawayPaymentsDialog.vue";

export default {
  name: "LayawayPaymentsDataTable",
  components: { LayawayPaymentsDialog },

  data() {
    return {
      search: "",
      filterMethod: "all",
      currentPage: 1,
      perPage: 10,
      sortKey: "paymentDate",
      sortDir: "desc",
      loading: false,
      layawayPayments: [],
      dialogDelete: false,
      deleteId: null,
    };
  },

  computed: {
    filteredData() {
      let result = [...this.layawayPayments];
      if (this.filterMethod !== "all") result = result.filter(p => p.paymentMethod === this.filterMethod);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter(p =>
          [p.receiptNumber, p.layawayPlan?.planNumber,
           p.layawayPlan?.customer?.firstName, p.layawayPlan?.customer?.lastName,
           p.receiver?.first_name, p.receiver?.last_name]
            .filter(Boolean).some(f => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = this.sortKey === 'layawayPlan' ? (a.layawayPlan?.planNumber || '') : (a[this.sortKey] ?? '');
        let vb = this.sortKey === 'layawayPlan' ? (b.layawayPlan?.planNumber || '') : (b[this.sortKey] ?? '');
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
    eventBus.on("closeLayawayPaymentsDialog", () => { this.initialize(); });
  },

  beforeUnmount() { eventBus.off("closeLayawayPaymentsDialog"); },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
      else { this.sortKey = key; this.sortDir = 'asc'; }
    },
    formatNumber(v) {
      if (v === null || v === undefined) return '0.00';
      return parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    formatMethod(m) {
      if (!m) return '—';
      return m.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },
    async initialize() {
      this.loading = true;
      try {
        const res = await this.axiosCall("/layaway-payments", "GET");
        if (res && res.data) this.layawayPayments = res.data;
      } catch (_) { /* ignore */ }
      finally { this.loading = false; }
    },
    editItem(item) { eventBus.emit("editLayawayPayment", item); },
    deleteItem(item) { this.deleteId = item.id; this.dialogDelete = true; },
    async deleteItemConfirm() {
      try {
        await this.axiosCall(`/layaway-payments/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (_) { /* ignore */ }
      finally { this.dialogDelete = false; this.deleteId = null; }
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
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit', sans-serif; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1050px; }
.cust-table thead th { text-align: left; padding: 10px 14px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; cursor: pointer; user-select: none; }
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 14px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.cust-name { font-weight: 500; }
.amt-col { font-weight: 600; color: #9B6B3A; }
.bal-zero { color: #3D7A5A; font-weight: 600; }
.bal-remaining { color: #9B6B3A; font-weight: 600; }
.pay-num { display: inline-block; background: rgba(155,107,58,0.08); color: #9B6B3A; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.method-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: rgba(155,107,58,0.08); color: #9A7858; }
.m-cash { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.m-gcash { background: rgba(26,107,192,0.1); color: #1A6BC0; }
.m-maya { background: rgba(22,155,107,0.1); color: #159B6B; }
.m-credit_card, .m-debit_card { background: rgba(90,90,114,0.1); color: #5A5A72; }
.m-bank_transfer { background: rgba(120,80,160,0.1); color: #7850A0; }
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
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer; transition: all 0.12s; margin-right: 8px; }
.btn-cancel-proto:hover { border-color: rgba(155,107,58,0.35); color: #6B4A30; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background 0.12s; }
.btn-danger-proto:hover { background: #c95252; }
</style>
