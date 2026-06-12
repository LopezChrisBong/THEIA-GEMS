<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Sales</div>
        <div class="page-sub">View and manage sales transactions</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search sales..." class="search-input-proto" />
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterStatus === null }" @click="filterStatus = null">All</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'paid' }" @click="filterStatus = 'paid'">Paid</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'layaway' }" @click="filterStatus = 'layaway'">Layaway</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'partial' }" @click="filterStatus = 'partial'">Partial</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'refunded' }" @click="filterStatus = 'refunded'">Refunded</button>
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
              <th @click="sortBy('saleNumber')">Sale #</th>
              <th @click="sortBy('branch')">Branch</th>
              <th @click="sortBy('customer')">Customer</th>
              <th @click="sortBy('cashier')">Cashier</th>
              <th @click="sortBy('saleDate')">Date</th>
              <th @click="sortBy('totalAmount')">Total</th>
              <th @click="sortBy('paymentStatus')">Payment</th>
              <th @click="sortBy('saleType')">Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.saleNumber }}</td>
              <td>
                <span v-if="item.branch" class="repeat-badge r-primary">{{ item.branch.branchName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span v-if="item.customer" class="cust-name">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
                <span v-else class="dim">Walk-in</span>
              </td>
              <td>
                <span v-if="item.cashier">{{ item.cashier.firstName || '' }} {{ item.cashier.lastName || '' }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="dim">{{ formatDateTime(item.saleDate) }}</td>
              <td class="amount-col">₱{{ formatNumber(item.totalAmount) }}</td>
              <td>
                <span class="repeat-badge" :class="getPaymentClass(item.paymentStatus)">
                  {{ formatStatus(item.paymentStatus) }}
                </span>
              </td>
              <td>
                <span class="repeat-badge" :class="getTypeClass(item.saleType)">
                  {{ formatStatus(item.saleType) }}
                </span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn view-btn" title="View Sale" @click="viewSale(item)">
                    <v-icon size="14">mdi-eye-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-receipt-text-outline</v-icon></div>
                  <div class="empty-title">No sales found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading sales...</div>
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

    <!-- View Sale Modal -->
    <v-dialog v-model="dialogView" max-width="660px">
      <v-card v-if="viewData" class="sale-view-card">
        <!-- Header -->
        <div class="sv-header">
          <div>
            <div class="sv-title">
              <v-icon size="16" color="#9B6B3A" style="margin-right:8px">mdi-receipt-text-outline</v-icon>
              Sale Details
            </div>
            <div class="sv-sub mono">{{ viewData.saleNumber }}</div>
          </div>
          <button class="sv-close" @click="dialogView = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>

        <div class="sv-body">
          <!-- Meta info -->
          <div class="sv-section">
            <div class="sv-row">
              <span class="sv-lbl">Date</span>
              <span class="sv-val">{{ formatDateTime(viewData.saleDate) }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Branch</span>
              <span class="sv-val">{{ viewData.branch?.branchName || '—' }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Cashier</span>
              <span class="sv-val">{{ viewData.cashier ? (viewData.cashier.firstName + ' ' + viewData.cashier.lastName) : '—' }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Customer</span>
              <span class="sv-val">{{ viewData.customer ? (viewData.customer.firstName + ' ' + viewData.customer.lastName) : 'Walk-in' }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Type</span>
              <span class="sv-val">
                <span class="repeat-badge" :class="getTypeClass(viewData.saleType)">{{ formatStatus(viewData.saleType) }}</span>
              </span>
            </div>
          </div>

          <div class="sv-divider"></div>

          <!-- Financial Breakdown -->
          <div class="sv-section-title">Financial Summary</div>
          <div class="sv-section">
            <div class="sv-row">
              <span class="sv-lbl">Subtotal</span>
              <span class="sv-val">₱{{ formatNumber(viewData.subtotal) }}</span>
            </div>
            <div class="sv-row" v-if="Number(viewData.discountAmount) > 0">
              <span class="sv-lbl">Discount</span>
              <span class="sv-val sv-discount">- ₱{{ formatNumber(viewData.discountAmount) }}</span>
            </div>
            <div class="sv-row" v-if="Number(viewData.taxAmount) > 0">
              <span class="sv-lbl">VAT (12%)</span>
              <span class="sv-val">₱{{ formatNumber(viewData.taxAmount) }}</span>
            </div>
          </div>

          <div class="sv-total-row">
            <span>TOTAL</span>
            <span class="sv-total-amt">₱{{ formatNumber(viewData.totalAmount) }}</span>
          </div>

          <div class="sv-section" style="margin-top:8px">
            <div class="sv-row">
              <span class="sv-lbl">Amount Paid</span>
              <span class="sv-val">₱{{ formatNumber(viewData.amountPaid) }}</span>
            </div>
            <div class="sv-row" v-if="Number(viewData.changeAmount) > 0">
              <span class="sv-lbl">Change</span>
              <span class="sv-val">₱{{ formatNumber(viewData.changeAmount) }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Payment Status</span>
              <span class="sv-val">
                <span class="repeat-badge" :class="getPaymentClass(viewData.paymentStatus)">{{ formatStatus(viewData.paymentStatus) }}</span>
              </span>
            </div>
          </div>

          <!-- Notes -->
          <template v-if="viewData.notes">
            <div class="sv-divider"></div>
            <div class="sv-section-title">Notes</div>
            <div class="sv-notes">{{ viewData.notes }}</div>
          </template>

          <div class="sv-divider"></div>

          <!-- Items -->
          <div class="sv-section-title">
            Items
            <span v-if="loadingSaleItems" class="sv-loading">loading...</span>
            <span v-else-if="saleItems.length" class="sv-loading" style="color:#9B6B3A">{{ saleItems.length }} item{{ saleItems.length > 1 ? 's' : '' }}</span>
          </div>
          <div v-if="saleItems.length === 0 && !loadingSaleItems" class="sv-empty">No item records for this sale</div>
          <div class="sv-items-wrap" v-if="saleItems.length > 0">
            <table class="sv-items-tbl">
              <thead>
                <tr>
                  <th>Code / Barcode</th>
                  <th>Brand / Description</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Cost</th>
                  <th class="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="si in saleItems" :key="si.id">
                  <td>
                    <div class="mono">{{ si.jewelryItem?.itemCode || '—' }}</div>
                    <div class="dim" style="font-size:11px">{{ si.jewelryItem?.barcode || '' }}</div>
                  </td>
                  <td>
                    <div style="font-size:13px">{{ si.jewelryItem?.brand || '—' }}</div>
                    <div class="dim" style="font-size:11px">{{ si.jewelryItem?.material || '' }}</div>
                  </td>
                  <td class="text-right amount-col">₱{{ formatNumber(si.unitPrice) }}</td>
                  <td class="text-right dim">{{ si.unitCost != null ? '₱' + formatNumber(si.unitCost) : '—' }}</td>
                  <td class="text-right"
                    :style="{ color: si.grossMargin > 0 ? '#3D7A5A' : si.grossMargin < 0 ? '#B84040' : '', fontWeight: '600' }">
                    {{ si.grossMargin != null ? '₱' + formatNumber(si.grossMargin) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="sv-divider"></div>

          <!-- Payments -->
          <div class="sv-section-title">
            Payments
            <span v-if="loadingPayments" class="sv-loading">loading...</span>
          </div>
          <div v-if="payments.length === 0 && !loadingPayments" class="sv-empty">No payment records found</div>
          <div class="sv-section" v-if="payments.length > 0">
            <div class="sv-row sv-pay-hdr">
              <span>Method</span><span>Type</span><span>Amount</span><span>Date</span>
            </div>
            <div class="sv-row sv-pay-row" v-for="p in payments" :key="p.id">
              <span style="text-transform:capitalize">{{ (p.paymentMethod || '').replace(/_/g,' ') }}</span>
              <span style="text-transform:capitalize">{{ (p.paymentType || '').replace(/_/g,' ') }}</span>
              <span class="amount-col">₱{{ formatNumber(p.amount) }}</span>
              <span class="dim" style="font-size:11px">{{ formatDateTime(p.paymentDate) }}</span>
            </div>
          </div>

          <div class="sv-divider"></div>

          <!-- Receipt -->
          <div class="sv-section-title">
            Receipt
            <span v-if="loadingReceipt" class="sv-loading">loading...</span>
          </div>
          <div v-if="!receipt && !loadingReceipt" class="sv-empty">No receipt linked to this sale</div>
          <div class="sv-section" v-if="receipt">
            <div class="sv-row">
              <span class="sv-lbl">Receipt #</span>
              <span class="sv-val mono">{{ receipt.receiptNumber }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Status</span>
              <span class="sv-val">
                <span class="repeat-badge" :class="receipt.printedAt ? 'r-printed' : 'r-not-printed'">
                  {{ receipt.printedAt ? 'Printed' : 'Not Printed' }}
                </span>
              </span>
            </div>
            <div class="sv-row" v-if="receipt.printedAt">
              <span class="sv-lbl">Printed At</span>
              <span class="sv-val">{{ formatDateTime(receipt.printedAt) }}</span>
            </div>
            <div class="sv-row" v-if="receipt.printer">
              <span class="sv-lbl">Printed By</span>
              <span class="sv-val">{{ receipt.printer.firstName }} {{ receipt.printer.lastName }}</span>
            </div>
            <div class="sv-row">
              <span class="sv-lbl">Reprints</span>
              <span class="sv-val">{{ receipt.reprintCount || 0 }}</span>
            </div>
          </div>
        </div>
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
export default {
  data: () => ({
    search: "",
    filterStatus: null,
    page: 1,
    perPage: 10,
    sortKey: "saleDate",
    sortDir: "desc",
    data: [],
    loading: false,
    dialogView: false,
    viewData: null,
    payments: [],
    receipt: null,
    saleItems: [],
    loadingPayments: false,
    loadingReceipt: false,
    loadingSaleItems: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),

  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterStatus) result = result.filter((s) => s.paymentStatus === this.filterStatus);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((s) =>
          [
            s.saleNumber,
            s.branch?.branchName,
            s.customer ? s.customer.firstName + ' ' + s.customer.lastName : 'walk-in',
            s.cashier ? s.cashier.firstName + ' ' + s.cashier.lastName : '',
            s.paymentStatus,
            s.saleType,
          ].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = a[this.sortKey] ?? "";
        let vb = b[this.sortKey] ?? "";
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
    visiblePages() {
      const p = [];
      const s = Math.max(1, this.page - 2);
      for (let i = s; i <= Math.min(this.totalPages, s + 4); i++) p.push(i);
      return p;
    },
  },

  mounted() {
    this.initialize();
  },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      else { this.sortKey = key; this.sortDir = "asc"; }
    },

    formatDateTime(d) {
      if (!d) return "—";
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    },

    formatNumber(v) {
      if (v == null) return "0.00";
      return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatStatus(s) {
      if (!s) return "—";
      return s.charAt(0).toUpperCase() + s.slice(1);
    },

    getPaymentClass(status) {
      const map = { paid: "r-paid", partial: "r-partial", layaway: "r-layaway", refunded: "r-refunded" };
      return map[status] || "r-default";
    },

    getTypeClass(type) {
      const map = { regular: "r-regular", layaway: "r-layaway", consignment: "r-consign" };
      return map[type] || "r-default";
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/sales", "GET")
        .then((res) => { if (res?.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load sales", top: 10 }; })
        .finally(() => { this.loading = false; });
    },

    viewSale(item) {
      this.viewData = item;
      this.payments = [];
      this.receipt = null;
      this.saleItems = [];
      this.dialogView = true;

      this.loadingPayments = true;
      this.axiosCall("/payments/sale/" + item.id, "GET")
        .then((res) => { this.payments = res?.data || []; })
        .catch(() => { this.payments = []; })
        .finally(() => { this.loadingPayments = false; });

      this.loadingReceipt = true;
      this.axiosCall("/receipts/sale/" + item.id, "GET")
        .then((res) => { this.receipt = res?.data || null; })
        .catch(() => { this.receipt = null; })
        .finally(() => { this.loadingReceipt = false; });

      this.loadingSaleItems = true;
      this.axiosCall("/sale-items/sale/" + item.id, "GET")
        .then((res) => { this.saleItems = res?.data || []; })
        .catch(() => { this.saleItems = []; })
        .finally(() => { this.loadingSaleItems = false; });
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

.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit', sans-serif; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }

.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 860px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; cursor: pointer; user-select: none; }
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.amount-col { font-weight: 600; color: #9B6B3A; }

.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.r-paid { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-partial { background: rgba(200,150,40,0.12); color: #9B6B3A; }
.r-layaway { background: rgba(90,122,155,0.12); color: #5A7A9B; }
.r-refunded { background: rgba(184,64,64,0.08); color: #B84040; }
.r-regular { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-consign { background: rgba(130,80,160,0.1); color: #7A4A9B; }
.r-default { background: rgba(150,150,150,0.1); color: #888; }
.r-printed { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-not-printed { background: rgba(155,107,58,0.1); color: #9B6B3A; }

.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn.view-btn:hover { border-color: #5A7A9B; color: #5A7A9B; background: rgba(90,122,155,0.06); }

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

/* ── View Sale Modal ── */
.sale-view-card {
  border-radius: 16px !important;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  background: #FDFAF6;
}
.sv-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px;
  background: #F5EFE4;
  border-bottom: 1px solid rgba(155,107,58,0.16);
}
.sv-title { font-size: 15px; font-weight: 600; color: #3A2515; display: flex; align-items: center; }
.sv-sub { font-size: 12px; color: #9B6B3A; margin-top: 3px; padding-left: 24px; }
.sv-close { background: none; border: none; cursor: pointer; color: #9A7858; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color 0.12s; }
.sv-close:hover { color: #B84040; }

.sv-body { padding: 16px 20px; max-height: 70vh; overflow-y: auto; }
.sv-divider { height: 1px; background: rgba(155,107,58,0.16); margin: 12px 0; }
.sv-section-title { font-size: 10px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; margin-bottom: 6px; }
.sv-section { margin-bottom: 4px; }
.sv-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 13px; color: #3A2515;
  border-bottom: 1px solid rgba(155,107,58,0.08);
}
.sv-row:last-child { border-bottom: none; }
.sv-lbl { color: #9A7858; font-size: 12px; flex-shrink: 0; }
.sv-val { font-weight: 500; text-align: right; }
.sv-discount { color: #3D7A5A; }
.sv-total-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 10px 0 4px;
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: #3A2515;
}
.sv-total-amt {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 600; color: #9B6B3A;
}
.sv-pay-hdr { font-size: 10px; color: #9A7858; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(155,107,58,0.2) !important; }
.sv-pay-row { font-size: 12px; }
.sv-notes { font-size: 13px; color: #6B4A30; background: rgba(155,107,58,0.06); border-radius: 8px; padding: 8px 12px; margin-bottom: 4px; line-height: 1.5; }
.sv-empty { font-size: 12px; color: #9A7858; padding: 8px 0; margin-bottom: 4px; }
.sv-loading { font-size: 11px; color: #9A7858; margin-left: 8px; }

/* Items table inside sale modal */
.sv-items-wrap { overflow-x: auto; margin-bottom: 4px; }
.sv-items-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.sv-items-tbl thead th {
  text-align: left; padding: 6px 10px; font-size: 9px; letter-spacing: 0.12em;
  text-transform: uppercase; color: #9A7858; font-weight: 600;
  background: #F5EFE4; white-space: nowrap;
}
.sv-items-tbl thead th.text-right { text-align: right; }
.sv-items-tbl tbody tr { border-top: 1px solid rgba(155,107,58,0.1); }
.sv-items-tbl tbody tr:hover { background: #F5EFE4; }
.sv-items-tbl tbody td { padding: 7px 10px; color: #3A2515; vertical-align: middle; white-space: nowrap; }
.sv-items-tbl .text-right { text-align: right; }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,107,58,0.22); border-radius: 4px; }
</style>
