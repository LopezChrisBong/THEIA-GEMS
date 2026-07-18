<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Sales Report</div>
        <div class="page-sub">View and export sales data by period</div>
      </div>
      <button
        class="btn-export"
        @click="exportExcel"
        :disabled="!reportData || loading"
      >
        <v-icon size="13" color="white">mdi-microsoft-excel</v-icon>
        Export to Excel
      </button>
    </div>

    <!-- Settings Card -->
    <div class="settings-card">
      <div class="settings-top">
        <!-- Period -->
        <div class="settings-group">
          <div class="settings-label">Report Period</div>
          <div class="period-tabs">
            <button class="period-tab" :class="{ on: period === 'daily' }" @click="period = 'daily'">Daily</button>
            <button class="period-tab" :class="{ on: period === 'weekly' }" @click="period = 'weekly'">Weekly</button>
            <button class="period-tab" :class="{ on: period === 'monthly' }" @click="period = 'monthly'">Monthly</button>
            <button class="period-tab" :class="{ on: period === 'custom' }" @click="period = 'custom'">Custom</button>
          </div>
        </div>

        <div class="settings-sep" />

        <!-- Date range -->
        <div class="settings-group">
          <div class="settings-label">Date Range</div>
          <div class="date-row">
            <div class="date-field">
              <label>From</label>
              <input type="date" v-model="startDate" />
            </div>
            <span class="date-dash">—</span>
            <div class="date-field">
              <label>To</label>
              <input type="date" v-model="endDate" />
            </div>
          </div>
        </div>

        <div class="settings-sep" />

        <!-- Branch -->
        <div class="settings-group">
          <div class="settings-label">Branch</div>
          <div class="branch-select-wrap">
            <select v-model="selectedBranchId" class="branch-select">
              <option :value="null">All Branches</option>
              <option v-for="b in branchList" :key="b.branchId" :value="b.branchId">{{ b.branchName }}</option>
            </select>
          </div>
        </div>

        <div class="settings-sep" />

        <!-- Quick Presets -->
        <div class="settings-group">
          <div class="settings-label">Quick Presets</div>
          <div class="preset-row">
            <button class="preset-btn" @click="setPreset('today')">Today</button>
            <button class="preset-btn" @click="setPreset('thisWeek')">This Week</button>
            <button class="preset-btn" @click="setPreset('thisMonth')">This Month</button>
            <button class="preset-btn" @click="setPreset('lastMonth')">Last Month</button>
            <button class="preset-btn" @click="setPreset('last3months')">Last 3 Months</button>
            <button class="preset-btn" @click="setPreset('thisYear')">This Year</button>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <div class="selected-range" v-if="startDate && endDate">
          <v-icon size="13" color="#9B6B3A">mdi-calendar-range</v-icon>
          {{ formatDate(startDate) }} — {{ formatDate(endDate) }}
          &nbsp;·&nbsp;
          <strong>{{ periodLabel }}</strong> view
          <template v-if="selectedBranchId">
            &nbsp;·&nbsp;
            <v-icon size="12" color="#9B6B3A">mdi-store-outline</v-icon>
            {{ branchList.find(b => b.branchId === selectedBranchId)?.branchName }}
          </template>
        </div>
        <button class="btn-generate" @click="loadReport" :disabled="loading || !startDate || !endDate">
          <v-icon size="13" color="white">mdi-chart-bar</v-icon>
          {{ loading ? 'Generating...' : 'Generate Report' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div class="empty-state" v-if="loading">
      <v-progress-circular indeterminate color="#9B6B3A" size="32" />
      <div class="empty-title">Generating report...</div>
    </div>

    <!-- Empty Prompt -->
    <div class="empty-state" v-else-if="!reportData">
      <div class="empty-icon">
        <v-icon size="24" color="#9B6B3A">mdi-chart-bar</v-icon>
      </div>
      <div class="empty-title">No report generated yet</div>
      <div class="empty-sub">Select a period and date range, then click Generate Report</div>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#9B6B3A">mdi-receipt-text-outline</v-icon>
          </div>
          <div class="summary-val">{{ reportData.summary.totalOrders }}</div>
          <div class="summary-lbl">Total Orders</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#9B6B3A">mdi-cash-multiple</v-icon>
          </div>
          <div class="summary-val">₱{{ formatNumber(reportData.summary.totalRevenue) }}</div>
          <div class="summary-lbl">Total Revenue</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#9B6B3A">mdi-tag-outline</v-icon>
          </div>
          <div class="summary-val">₱{{ formatNumber(reportData.summary.totalDiscount) }}</div>
          <div class="summary-lbl">Total Discount</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#9B6B3A">mdi-chart-line</v-icon>
          </div>
          <div class="summary-val">₱{{ formatNumber(reportData.summary.avgOrderValue) }}</div>
          <div class="summary-lbl">Avg. Order Value</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#3D7A5A">mdi-check-circle-outline</v-icon>
          </div>
          <div class="summary-val">{{ reportData.summary.paidCount }}</div>
          <div class="summary-lbl">Paid Orders</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon-wrap">
            <v-icon size="18" color="#9B6B3A">mdi-clock-outline</v-icon>
          </div>
          <div class="summary-val">{{ reportData.summary.partialCount + reportData.summary.layawayCount }}</div>
          <div class="summary-lbl">Pending / Layaway</div>
        </div>
      </div>

      <!-- Grouped Breakdown Table -->
      <div class="report-card" v-if="reportData.grouped.length">
        <div class="report-card-header">
          <v-icon size="14" color="#9B6B3A">mdi-calendar-month-outline</v-icon>
          {{ periodLabel }} Breakdown
          <span class="count-badge">{{ reportData.grouped.length }}</span>
        </div>
        <div class="tbl-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Period</th>
                <th class="text-right">Orders</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Avg. Order</th>
                <th class="text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in reportData.grouped" :key="row.label">
                <td class="period-cell">{{ row.label }}</td>
                <td class="text-right">{{ row.orders }}</td>
                <td class="text-right amt-col">₱{{ formatNumber(row.revenue) }}</td>
                <td class="text-right dim">₱{{ formatNumber(row.discount) }}</td>
                <td class="text-right">₱{{ formatNumber(row.orders > 0 ? row.revenue / row.orders : 0) }}</td>
                <td class="text-right">
                  <div class="pct-wrap">
                    <div class="pct-bar" :style="{ width: pctOfTotal(row.revenue) + '%' }" />
                    <span class="pct-val">{{ pctOfTotal(row.revenue).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td class="text-right"><strong>{{ reportData.summary.totalOrders }}</strong></td>
                <td class="text-right amt-col"><strong>₱{{ formatNumber(reportData.summary.totalRevenue) }}</strong></td>
                <td class="text-right dim"><strong>₱{{ formatNumber(reportData.summary.totalDiscount) }}</strong></td>
                <td class="text-right"><strong>₱{{ formatNumber(reportData.summary.avgOrderValue) }}</strong></td>
                <td class="text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Item-Level Transactions Table -->
      <div class="report-card" v-if="reportData.items && reportData.items.length">
        <div class="report-card-header">
          <v-icon size="14" color="#9B6B3A">mdi-tag-multiple-outline</v-icon>
          Item Transactions
          <span class="count-badge">{{ reportData.items.length }}</span>
          <span class="header-spacer" />
          <!-- Search -->
          <div class="item-search-wrap">
            <v-icon size="13" color="#9A7858">mdi-magnify</v-icon>
            <input v-model="itemSearch" type="text" placeholder="Search items..." class="item-search-input" />
          </div>
        </div>
        <div class="tbl-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Code</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Name</th>
                <th>Description</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.saleItemId">
                <td class="mono">{{ item.saleNumber || '—' }}</td>
                <td class="dim">{{ item.saleDate ? formatDate(item.saleDate) : '—' }}</td>
                <td>{{ item.branchName || '—' }}</td>
                <td class="mono">{{ item.itemCode || '—' }}</td>
                <td class="dim small">{{ item.barcode || '—' }}</td>
                <td>
                  <span v-if="item.category" class="cat-chip">{{ item.category }}</span>
                  <span v-else class="dim">—</span>
                </td>
                <td>{{ item.brand || '—' }}</td>
                <td>{{ item.description || '—' }}</td>
                <td class="text-right amt-col">₱{{ formatNumber(item.unitPrice) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="8"><strong>Total</strong></td>
                <td class="text-right amt-col">
                  <strong>₱{{ formatNumber(filteredItems.reduce((s, r) => s + (r.unitPrice || 0), 0)) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- All Transactions Table -->
      <div class="report-card" v-if="reportData.sales.length">
        <div class="report-card-header">
          <v-icon size="14" color="#9B6B3A">mdi-format-list-bulleted</v-icon>
          All Transactions
          <span class="count-badge">{{ reportData.sales.length }}</span>
        </div>
        <div class="tbl-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Branch</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Total</th>
                <th class="text-right">Paid</th>
                <th>Status</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in reportData.sales" :key="sale.id">
                <td class="mono">{{ sale.saleNumber }}</td>
                <td class="dim">{{ formatDate(sale.saleDate) }}</td>
                <td>
                  {{ sale.customer
                    ? sale.customer.firstName + ' ' + sale.customer.lastName
                    : '—' }}
                </td>
                <td>{{ sale.branch?.branchName || '—' }}</td>
                <td class="text-right dim">₱{{ formatNumber(sale.subtotal) }}</td>
                <td class="text-right dim">₱{{ formatNumber(sale.discountAmount) }}</td>
                <td class="text-right amt-col">₱{{ formatNumber(sale.totalAmount) }}</td>
                <td class="text-right">₱{{ formatNumber(sale.amountPaid) }}</td>
                <td>
                  <span class="s-badge" :class="'s-' + sale.paymentStatus">
                    {{ sale.paymentStatus }}
                  </span>
                </td>
                <td>
                  <span class="s-badge s-type">{{ sale.saleType }}</span>
                </td>
                <td>
                  <button class="btn-view-items" @click="openSaleView(sale)">
                    <v-icon size="12">mdi-eye-outline</v-icon>
                    Items
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Per-Sale Items Dialog -->
      <v-dialog v-model="viewSaleDialog" max-width="760">
        <div class="sale-view-dialog" v-if="viewSale">
          <div class="svd-header">
            <div class="svd-title">
              <v-icon size="14" color="#9B6B3A" class="mr-1">mdi-receipt-text-outline</v-icon>
              <span class="svd-sale-num">{{ viewSale.saleNumber }}</span>
              <span class="svd-date">{{ formatDate(viewSale.saleDate) }}</span>
            </div>
            <button class="svd-close" @click="viewSaleDialog = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="svd-info-row">
            <div class="svd-info-cell">
              <div class="svd-info-label">Customer</div>
              <div class="svd-info-val">
                {{ viewSale.customer ? viewSale.customer.firstName + ' ' + viewSale.customer.lastName : 'Walk-in' }}
              </div>
            </div>
            <div class="svd-info-cell">
              <div class="svd-info-label">Branch</div>
              <div class="svd-info-val">{{ viewSale.branch?.branchName || '—' }}</div>
            </div>
            <div class="svd-info-cell">
              <div class="svd-info-label">Status</div>
              <div class="svd-info-val">
                <span class="s-badge" :class="'s-' + viewSale.paymentStatus">{{ viewSale.paymentStatus }}</span>
              </div>
            </div>
            <div class="svd-info-cell">
              <div class="svd-info-label">Type</div>
              <div class="svd-info-val">
                <span class="s-badge s-type">{{ viewSale.saleType }}</span>
              </div>
            </div>
            <div class="svd-info-cell">
              <div class="svd-info-label">Total</div>
              <div class="svd-info-val amt-col">₱{{ formatNumber(viewSale.totalAmount) }}</div>
            </div>
          </div>

          <div class="svd-divider" />

          <div class="svd-items-header">
            <v-icon size="13" color="#9B6B3A">mdi-tag-multiple-outline</v-icon>
            Items
            <span class="count-badge" v-if="!viewSaleItemsLoading">{{ viewSaleItems.length }}</span>
          </div>

          <div v-if="viewSaleItemsLoading" class="svd-loading">
            <v-progress-circular indeterminate color="#9B6B3A" size="24" />
          </div>
          <div v-else-if="!viewSaleItems.length" class="svd-empty">
            No item records for this sale
          </div>
          <div v-else class="svd-tbl-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Barcode</th>
                  <th>Name / Description</th>
                  <th class="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="si in viewSaleItems" :key="si.id">
                  <td class="mono">{{ si.jewelryItem?.itemCode || '—' }}</td>
                  <td class="dim small">{{ si.jewelryItem?.barcode || '—' }}</td>
                  <td>
                    <div>{{ si.jewelryItem?.brand || '—' }}</div>
                    <div class="dim small">{{ si.jewelryItem?.material || '' }}</div>
                  </td>
                  <td class="text-right amt-col">₱{{ formatNumber(si.unitPrice) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>Total</strong></td>
                  <td class="text-right amt-col"><strong>₱{{ formatNumber(viewSaleItems.reduce((s, r) => s + (Number(r.unitPrice) || 0), 0)) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </v-dialog>

      <!-- Zero results -->
      <div class="empty-state" v-if="reportData.sales.length === 0">
        <div class="empty-icon">
          <v-icon size="20" color="#9B6B3A">mdi-receipt-text-remove-outline</v-icon>
        </div>
        <div class="empty-title">No transactions found</div>
        <div class="empty-sub">Try a different date range or branch</div>
      </div>
    </template>

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
import * as XLSX from 'xlsx';

export default {
  name: 'SalesReportPage',

  data: () => ({
    period: 'daily',
    startDate: '',
    endDate: '',
    selectedBranchId: null,
    branchList: [],
    loading: false,
    reportData: null,
    itemSearch: '',
    viewSaleDialog: false,
    viewSale: null,
    viewSaleItems: [],
    viewSaleItemsLoading: false,
    fadeAwayMessage: {
      show: false,
      type: 'success',
      header: '',
      message: '',
      top: 10,
    },
  }),

  computed: {
    periodLabel() {
      const map = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom' };
      return map[this.period] || 'Daily';
    },

    filteredItems() {
      if (!this.reportData?.items) return [];
      const q = this.itemSearch.toLowerCase().trim();
      if (!q) return this.reportData.items;
      return this.reportData.items.filter((item) =>
        [item.saleNumber, item.itemCode, item.barcode, item.category, item.brand, item.description, item.branchName]
          .some((v) => v && String(v).toLowerCase().includes(q)),
      );
    },
  },

  created() {
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch('setUser', null);
      this.$store.dispatch('setIsAuthenticated', 0);
      this.$router.push('/');
    }
    this.loadBranches();
    this.setPreset('thisMonth');
  },

  methods: {
    loadBranches() {
      this.axiosCall('/branches', 'GET').then((res) => {
        if (res && res.data) this.branchList = res.data;
      });
    },

    setPreset(preset) {
      const today = new Date();
      const fmt = (d) => d.toISOString().slice(0, 10);

      if (preset === 'today') {
        this.startDate = fmt(today);
        this.endDate = fmt(today);
        this.period = 'daily';
      } else if (preset === 'thisWeek') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        this.startDate = fmt(start);
        this.endDate = fmt(end);
        this.period = 'daily';
      } else if (preset === 'thisMonth') {
        this.startDate = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        this.endDate = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        this.period = 'daily';
      } else if (preset === 'lastMonth') {
        this.startDate = fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        this.endDate = fmt(new Date(today.getFullYear(), today.getMonth(), 0));
        this.period = 'daily';
      } else if (preset === 'last3months') {
        this.startDate = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1));
        this.endDate = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        this.period = 'monthly';
      } else if (preset === 'thisYear') {
        this.startDate = fmt(new Date(today.getFullYear(), 0, 1));
        this.endDate = fmt(new Date(today.getFullYear(), 11, 31));
        this.period = 'monthly';
      }
    },

    loadReport() {
      if (!this.startDate || !this.endDate) return;
      this.loading = true;
      this.reportData = null;
      this.itemSearch = '';

      const apiPeriod = this.period === 'custom' ? 'daily' : this.period;
      let url = `/sales/report?period=${apiPeriod}&startDate=${this.startDate}&endDate=${this.endDate}`;
      if (this.selectedBranchId) url += `&branchId=${this.selectedBranchId}`;

      this.axiosCall(url, 'GET')
        .then((res) => {
          if (res && res.data) this.reportData = res.data;
        })
        .catch((err) => {
          console.error('Report error:', err);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = 'error';
          this.fadeAwayMessage.header = 'Error';
          this.fadeAwayMessage.message = 'Failed to generate report';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    paymentColumnKey(p) {
      const notes = (p.notes || '').toLowerCase();
      if (p.paymentMethod === 'bank_transfer') {
        if (notes.includes('bank: bpi')) return 'BT-BPI';
        if (notes.includes('bank: bdo')) return 'BT-BDO';
        if (notes.includes('bank: pnb')) return 'BT-PNB';
        return 'BT-BDO';
      }
      if (p.paymentMethod === 'credit_card') {
        if (notes.includes('terminal: bpi')) return 'CC-BPI';
        if (notes.includes('terminal: bdo')) return 'CC-BDO';
        if (notes.includes('terminal: paymaya') || notes.includes('terminal: maya')) return 'CC-PAYMAYA';
        return 'CC-BDO';
      }
      if (p.paymentMethod === 'gcash') return 'GCASH';
      if (p.paymentMethod === 'check') return 'CHEQUE';
      return 'CASH';
    },

    async exportExcel() {
      if (!this.reportData) return;

      const PAY_COLS = ['CASH', 'GCASH', 'BT-BPI', 'BT-BDO', 'BT-PNB', 'CC-BDO', 'CC-BPI', 'CC-PAYMAYA', 'CHEQUE'];

      // Fetch payment records for the selected date range
      let payments = [];
      try {
        const endDateFull = this.endDate + 'T23:59:59';
        const res = await this.axiosCall(`/payments/date-range?startDate=${this.startDate}&endDate=${endDateFull}`, 'GET');
        if (res && res.data) payments = res.data;
      } catch (e) {
        // proceed without payment breakdown if fetch fails
      }

      const wb = XLSX.utils.book_new();
      const s = this.reportData.summary;

      /* ── Sheet 1: Sales Report ── */
      const rows = [];

      // Header
      rows.push(['THEIA GEMS — SALES REPORT', '', `From: ${this.startDate}`, `To: ${this.endDate}`]);
      rows.push([`Period: ${this.periodLabel}`]);
      rows.push([]);

      // Overview
      rows.push(['OVERVIEW']);
      rows.push(['Total Orders', s.totalOrders]);
      rows.push(['Total Revenue', Number(Number(s.totalRevenue).toFixed(2))]);
      rows.push(['Total Discount', Number(Number(s.totalDiscount).toFixed(2))]);
      rows.push(['Total Tax', Number(Number(s.totalTax).toFixed(2))]);
      rows.push(['Avg. Order Value', Number(Number(s.avgOrderValue).toFixed(4))]);
      rows.push(['Paid Orders', s.paidCount]);
      rows.push(['Partial Orders', s.partialCount]);
      rows.push(['Layaway Orders', s.layawayCount]);
      rows.push([]);

      // Period breakdown
      rows.push([`${this.periodLabel.toUpperCase()} BREAKDOWN`]);
      rows.push(['Period', 'Orders', 'Revenue (₱)', 'Discount (₱)', 'Avg. Order (₱)']);
      for (const r of this.reportData.grouped) {
        const avg = r.orders > 0 ? r.revenue / r.orders : 0;
        rows.push([r.label, r.orders, Number(r.revenue.toFixed(2)), Number(r.discount.toFixed(2)), Number(avg.toFixed(2))]);
      }
      rows.push([]);
      rows.push([]);

      // Payment method breakdown
      rows.push(['PAYMENT METHOD', ...PAY_COLS]);
      const colTotals = {};
      PAY_COLS.forEach((c) => (colTotals[c] = 0));

      payments.forEach((p, idx) => {
        const col = this.paymentColumnKey(p);
        const amt = Number(p.amount);
        colTotals[col] = (colTotals[col] || 0) + amt;
        const row = [`TRANSACTION ${idx + 1}`];
        PAY_COLS.forEach((c) => row.push(c === col ? amt : ''));
        rows.push(row);
      });

      if (payments.length === 0) {
        rows.push(['No transactions recorded.', ...PAY_COLS.map(() => '')]);
      }

      rows.push([]);
      const totalRow = ['TOTAL'];
      PAY_COLS.forEach((c) => totalRow.push(colTotals[c] > 0 ? Number(colTotals[c].toFixed(2)) : 0));
      rows.push(totalRow);

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sales Report');

      /* ── Sheet 2: Item Transactions ── */
      if (this.reportData.items && this.reportData.items.length) {
        const itemRows = [
          ['Sale #', 'Date', 'Branch', 'Code', 'Barcode', 'Category', 'Name', 'Description', 'Price (₱)'],
          ...this.reportData.items.map((i) => [
            i.saleNumber || '',
            i.saleDate ? new Date(i.saleDate).toLocaleDateString('en-PH') : '',
            i.branchName || '',
            i.itemCode || '',
            i.barcode || '',
            i.category || '',
            i.brand || '',
            i.description || '',
            Number(Number(i.unitPrice).toFixed(2)),
          ]),
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemRows), 'Item Transactions');
      }

      /* ── Sheet 3: Transactions ── */
      const txRows = [
        ['Sale #', 'Date', 'Customer', 'Branch', 'Subtotal (₱)', 'Discount (₱)', 'Tax (₱)', 'Total (₱)', 'Paid (₱)', 'Change (₱)', 'Payment Status', 'Sale Type'],
        ...this.reportData.sales.map((sale) => [
          sale.saleNumber,
          sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('en-PH') : '',
          sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : 'Walk-in',
          sale.branch?.branchName || '',
          Number(Number(sale.subtotal).toFixed(2)),
          Number(Number(sale.discountAmount).toFixed(2)),
          Number(Number(sale.taxAmount).toFixed(2)),
          Number(Number(sale.totalAmount).toFixed(2)),
          Number(Number(sale.amountPaid).toFixed(2)),
          Number(Number(sale.changeAmount).toFixed(2)),
          sale.paymentStatus,
          sale.saleType,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), 'Transactions');

      const filename = `Sales-Report-${this.period}-${this.startDate}-to-${this.endDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      this.fadeAwayMessage.show = true;
      this.fadeAwayMessage.type = 'success';
      this.fadeAwayMessage.header = 'Exported';
      this.fadeAwayMessage.message = `${filename} downloaded successfully`;
    },

    openSaleView(sale) {
      this.viewSale = sale;
      this.viewSaleItems = [];
      this.viewSaleDialog = true;
      this.viewSaleItemsLoading = true;
      this.axiosCall(`/sale-items/sale/${sale.id}`, 'GET')
        .then((res) => {
          if (res && res.data) this.viewSaleItems = res.data;
        })
        .catch(() => {
          this.viewSaleItems = [];
        })
        .finally(() => {
          this.viewSaleItemsLoading = false;
        });
    },

    pctOfTotal(revenue) {
      if (!this.reportData || this.reportData.summary.totalRevenue === 0) return 0;
      return (revenue / this.reportData.summary.totalRevenue) * 100;
    },

    formatNumber(value) {
      if (value === null || value === undefined) return '0.00';
      return Number(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    formatDate(dateString) {
      if (!dateString) return '—';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
};
</script>

<style scoped>
/* ─── Base ─── */
.theia-view {
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  position: relative;
  z-index: 1;
}

/* ─── Page Header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-heading {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  font-weight: 500;
  color: #3A2515;
  letter-spacing: 0.02em;
}

.page-sub {
  font-size: 12px;
  color: #9A7858;
  margin-top: 2px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #3D7A5A;
  color: #FDFAF6;
  border: none;
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(61,122,90,0.25);
  transition: background 0.13s;
}

.btn-export:hover:not([disabled]) { background: #4e9970; }
.btn-export[disabled] { opacity: 0.4; cursor: default; }

/* ─── Settings Card ─── */
.settings-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(80,30,10,0.06);
  margin-bottom: 18px;
  overflow: hidden;
}

.settings-top {
  display: flex;
  align-items: flex-start;
  padding: 18px 20px;
  flex-wrap: wrap;
  gap: 0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 20px 0 0;
}

.settings-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
}

.settings-sep {
  width: 1px;
  background: rgba(155,107,58,0.16);
  align-self: stretch;
  margin: 0 20px 0 0;
}

/* Period tabs */
.period-tabs {
  display: flex;
  gap: 6px;
}

.period-tab {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(155,107,58,0.2);
  background: #F5EFE4;
  color: #9A7858;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: all 0.12s;
}

.period-tab:hover { border-color: #C49455; color: #9B6B3A; }
.period-tab.on {
  background: #9B6B3A;
  color: #FDFAF6;
  border-color: #9B6B3A;
}

/* Date row */
.date-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-field label {
  font-size: 10px;
  color: #9A7858;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.date-field input[type="date"] {
  border: 1px solid rgba(155,107,58,0.2);
  border-radius: 8px;
  background: #F5EFE4;
  color: #3A2515;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
}

.date-field input[type="date"]:focus {
  border-color: #9B6B3A;
}

.date-dash { color: #C4A882; font-size: 14px; margin-top: 14px; }

/* Branch select */
.branch-select-wrap {
  display: flex;
  align-items: center;
}

.branch-select {
  border: 1px solid rgba(155,107,58,0.2);
  border-radius: 8px;
  background: #F5EFE4;
  color: #3A2515;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
  cursor: pointer;
  min-width: 140px;
}

.branch-select:focus {
  border-color: #9B6B3A;
}

/* Presets */
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  border: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
  color: #9A7858;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: all 0.12s;
}

.preset-btn:hover {
  border-color: #C49455;
  color: #9B6B3A;
  background: #EDE0CC;
}

/* Settings footer */
.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(155,107,58,0.12);
  background: #F5EFE4;
}

.selected-range {
  font-size: 12px;
  color: #9A7858;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #9B6B3A;
  color: #FDFAF6;
  border: none;
  padding: 9px 20px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(155,107,58,0.25);
  transition: background 0.13s;
}

.btn-generate:hover:not([disabled]) { background: #C49455; }
.btn-generate[disabled] { opacity: 0.4; cursor: default; }

/* ─── Summary Grid ─── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 8px rgba(80,30,10,0.06);
}

.summary-card.highlight {
  border-color: rgba(155,107,58,0.4);
  background: linear-gradient(135deg, #FDFAF6 60%, #F5EFE4);
}

.summary-icon-wrap { margin-bottom: 8px; }

.summary-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: #3A2515;
  line-height: 1.1;
}

.summary-lbl {
  font-size: 10px;
  color: #9A7858;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

/* ─── Report Cards ─── */
.report-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(80,30,10,0.06);
  overflow: hidden;
  margin-bottom: 18px;
}

.report-card-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 18px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
  background: #F5EFE4;
  border-bottom: 1px solid rgba(155,107,58,0.12);
}

.header-spacer { flex: 1; }

.count-badge {
  background: #EDE0CC;
  color: #9B6B3A;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

/* Item search */
.item-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 7px;
  padding: 4px 10px;
}

.item-search-input {
  border: none;
  background: none;
  outline: none;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  width: 150px;
}

.item-search-input::placeholder { color: #9A7858; }

/* ─── Tables ─── */
.tbl-wrap { overflow-x: auto; }

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px;
}

.report-table thead th {
  text-align: left;
  padding: 10px 16px;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9A7858;
  font-weight: 600;
  background: #F5EFE4;
  white-space: nowrap;
  user-select: none;
}

.report-table thead th.text-right { text-align: right; }

.report-table tbody tr {
  border-top: 1px solid rgba(155,107,58,0.1);
  transition: background 0.1s;
}

.report-table tbody tr:hover { background: #F5EFE4; }

.report-table tbody td {
  padding: 10px 16px;
  color: #3A2515;
  white-space: nowrap;
  vertical-align: middle;
}

.report-table tfoot tr {
  border-top: 2px solid rgba(155,107,58,0.2);
  background: #F5EFE4;
}

.report-table tfoot td {
  padding: 10px 16px;
  font-size: 12px;
  color: #3A2515;
  white-space: nowrap;
}

.text-right { text-align: right !important; }

.mono {
  font-family: monospace;
  font-size: 12px;
  color: #9B6B3A;
  font-weight: 600;
}

.dim { color: #9A7858; font-size: 12px; }
.small { font-size: 11px; }
.amt-col { font-weight: 600; color: #9B6B3A; }
.period-cell { font-weight: 500; }

.cat-chip {
  display: inline-block;
  background: rgba(155,107,58,0.08);
  color: #9B6B3A;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 11px;
}

/* Percent bar */
.pct-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.pct-bar {
  height: 5px;
  background: #C49455;
  border-radius: 3px;
  min-width: 2px;
  max-width: 80px;
}

.pct-val {
  font-size: 11px;
  color: #9B6B3A;
  min-width: 38px;
  text-align: right;
}

/* Status badges */
.s-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: capitalize;
}

.s-paid     { background: rgba(61,122,90,0.1);   color: #3D7A5A; }
.s-partial  { background: rgba(196,148,85,0.15); color: #9B6B3A; }
.s-layaway  { background: rgba(80,100,160,0.1);  color: #4A5898; }
.s-refunded { background: rgba(120,120,140,0.12); color: #5A5A72; }
.s-type     { background: rgba(155,107,58,0.08); color: #9A7858; }

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
  color: #9A7858;
}

.empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #EDE0CC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: #6B4A30;
}

.empty-sub { font-size: 12px; color: #9A7858; }

/* ─── View Items Button ─── */
.btn-view-items {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Outfit', sans-serif;
  border: 1px solid rgba(155,107,58,0.22);
  background: #F5EFE4;
  color: #9B6B3A;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}
.btn-view-items:hover {
  background: #EDE0CC;
  border-color: #C49455;
}

/* ─── Sale View Dialog ─── */
.sale-view-dialog {
  background: #FDFAF6;
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
}

.svd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #F5EFE4;
  border-bottom: 1px solid rgba(155,107,58,0.12);
}

.svd-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.svd-sale-num {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: #9B6B3A;
}

.svd-date {
  font-size: 12px;
  color: #9A7858;
}

.svd-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9A7858;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: background 0.12s;
}
.svd-close:hover { background: rgba(155,107,58,0.1); }

.svd-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(155,107,58,0.1);
}

.svd-info-cell {
  flex: 1;
  min-width: 110px;
  padding-right: 16px;
}

.svd-info-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
  margin-bottom: 3px;
}

.svd-info-val {
  font-size: 13px;
  color: #3A2515;
}

.svd-divider {
  height: 1px;
  background: rgba(155,107,58,0.1);
}

.svd-items-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
  background: #F5EFE4;
  border-bottom: 1px solid rgba(155,107,58,0.1);
}

.svd-tbl-wrap {
  overflow-x: auto;
  max-height: 340px;
  overflow-y: auto;
}

.svd-loading, .svd-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  color: #9A7858;
  font-size: 13px;
  gap: 10px;
}
</style>
