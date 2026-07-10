<template>
  <v-container fluid class="theia-view">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Inventory Report</div>
        <div class="page-sub">View and export inventory items by status</div>
      </div>
      <button class="btn-export" @click="exportExcel" :disabled="loading || items.length === 0">
        <v-icon size="13" color="white">mdi-microsoft-excel</v-icon>
        Export to Excel
      </button>
    </div>

    <!-- Filters Card -->
    <div class="settings-card">
      <div class="filter-row">

        <!-- Status -->
        <div class="filter-group">
          <div class="filter-label">Item Status</div>
          <div class="select-wrap">
            <select v-model="selectedStatus" @change="loadItems" class="theia-select">
              <option value="">All Items</option>
              <option value="IN_STOCK">On-hand / Available</option>
              <option value="SOLD">Sold</option>
              <option value="PULLED_OUT">Pull-out</option>
            </select>
          </div>
        </div>

        <div class="filter-sep" />

        <!-- Branch -->
        <div class="filter-group">
          <div class="filter-label">Branch</div>
          <div class="select-wrap">
            <select v-model="selectedBranchId" @change="loadItems" class="theia-select">
              <option :value="null">All Branches</option>
              <option v-for="b in branchList" :key="b.branchId" :value="b.branchId">{{ b.branchName }}</option>
            </select>
          </div>
        </div>

        <div class="filter-spacer" />

        <div class="result-count" v-if="!loading">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} found
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="tbl-wrap">
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading items...</div>
        </div>

        <table v-else class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Stone Type</th>
              <th>Jewelry Type</th>
              <th>Color (Gold Type)</th>
              <th>Karat</th>
              <th>Ring Size</th>
              <th>Band Width</th>
              <th>Price (₱)</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in items" :key="item.id">
              <td class="dim">{{ idx + 1 }}</td>
              <td class="mono">{{ item.itemCode }}</td>
              <td>
                <span class="item-name">{{ item.brand || '—' }}</span>
                <div v-if="item.description" class="item-desc">{{ item.description }}</div>
              </td>
              <td>{{ item.category ? item.category.categoryName : '—' }}</td>
              <td>{{ item.stoneType ? item.stoneType.name : '—' }}</td>
              <td>{{ item.jewelryType ? item.jewelryType.name : '—' }}</td>
              <td>{{ formatGoldType(item.goldType) }}</td>
              <td>{{ item.karat || '—' }}</td>
              <td>{{ item.ringSize || '—' }}</td>
              <td>{{ item.bandWidth || '—' }}</td>
              <td class="text-right">{{ item.price != null ? '₱' + formatNumber(item.price) : '—' }}</td>
              <td>
                <span class="status-badge" :class="'s-' + (item.status || '').toLowerCase()">
                  {{ formatStatus(item.status) }}
                </span>
              </td>
              <td>{{ item.branch ? item.branch.branchName : '—' }}</td>
              <td>{{ item.supplier ? item.supplier.supplierName : '—' }}</td>
            </tr>

            <tr v-if="items.length === 0">
              <td colspan="14">
                <div class="empty-state">
                  <div class="empty-icon">
                    <v-icon size="20" color="#9B6B3A">mdi-diamond-outline</v-icon>
                  </div>
                  <div class="empty-title">No items found</div>
                  <div class="empty-sub">Try adjusting the filters above</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <fade-away-message-component
      displayType="variation2"
      v-model="toast.show"
      :message="toast.message"
      :header="toast.header"
      :top="toast.top"
      :type="toast.type"
    />
  </v-container>
</template>

<script>
import * as XLSX from 'xlsx';

const STATUS_LABELS = {
  IN_STOCK:    'On-hand / Available',
  SOLD:        'Sold',
  PULLED_OUT:  'Pull-out',
  TRANSFERRED: 'Transferred',
  CONSIGNMENT: 'Consignment',
  LAYAWAY:     'Layaway',
  RESERVED:    'Reserved',
};

const GOLD_TYPE_LABELS = {
  YG:        'Yellow Gold',
  WG:        'White Gold',
  RG:        'Rose Gold',
  TWO_TONED: 'Two-Toned',
};

export default {
  name: 'InventoryReport',
  data: () => ({
    items: [],
    branchList: [],
    selectedStatus: 'IN_STOCK',
    selectedBranchId: null,
    loading: false,
    toast: { show: false, type: 'success', header: '', message: '', top: 10 },
  }),

  mounted() {
    this.loadBranches();
    this.loadItems();
  },

  methods: {
    loadBranches() {
      this.axiosCall('/branches', 'GET').then((r) => {
        if (r && r.data) this.branchList = r.data;
      });
    },

    loadItems() {
      this.loading = true;
      const params = [];
      if (this.selectedStatus) params.push(`status=${this.selectedStatus}`);
      if (this.selectedBranchId) params.push(`branchId=${this.selectedBranchId}`);
      const url = '/jewelry-items' + (params.length ? '?' + params.join('&') : '');

      this.axiosCall(url, 'GET')
        .then((r) => { if (r && r.data) this.items = r.data; })
        .catch(() => {
          this.toast = { show: true, type: 'error', header: 'Error', message: 'Failed to load items', top: 10 };
        })
        .finally(() => { this.loading = false; });
    },

    formatStatus(s) { return STATUS_LABELS[s] || s || '—'; },
    formatGoldType(g) { return GOLD_TYPE_LABELS[g] || g || '—'; },
    formatNumber(v) {
      if (v == null) return '0.00';
      return Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    exportExcel() {
      const statusLabel = this.selectedStatus ? STATUS_LABELS[this.selectedStatus] : 'All Items';
      const branchLabel = this.selectedBranchId
        ? (this.branchList.find((b) => b.branchId === this.selectedBranchId)?.branchName || 'Branch')
        : 'All Branches';
      const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

      const wb = XLSX.utils.book_new();

      const rows = [
        ['THEIA GEMS — INVENTORY REPORT'],
        [`Status: ${statusLabel}`, '', `Branch: ${branchLabel}`, '', `Generated: ${today}`],
        [],
        [
          '#', 'Item Code', 'Name', 'Category', 'Stone Type', 'Jewelry Type',
          'Color (Gold Type)', 'Karat', 'Carat', 'Ring Size', 'Band Width',
          'Gold Weight', 'Price (₱)', 'Status', 'Branch', 'Supplier',
          'Barcode', 'Supplier Code', 'Date Added',
        ],
        ...this.items.map((item, idx) => [
          idx + 1,
          item.itemCode || '',
          item.brand || '',
          item.category?.categoryName || '',
          item.stoneType?.name || '',
          item.jewelryType?.name || '',
          GOLD_TYPE_LABELS[item.goldType] || item.goldType || '',
          item.karat || '',
          item.carat || '',
          item.ringSize || '',
          item.bandWidth || '',
          item.goldWeight || '',
          item.price != null ? Number(Number(item.price).toFixed(2)) : '',
          STATUS_LABELS[item.status] || item.status || '',
          item.branch?.branchName || '',
          item.supplier?.supplierName || '',
          item.barcode || '',
          item.supplierCode || '',
          item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-PH') : '',
        ]),
      ];

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Inventory');

      const slug = statusLabel.replace(/[/ ]+/g, '-').toLowerCase();
      const dateSlug = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Inventory-Report-${slug}-${dateSlug}.xlsx`);

      this.toast = { show: true, type: 'success', header: 'Exported', message: `${this.items.length} item(s) exported to Excel`, top: 10 };
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }

/* Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }
.btn-export { display: flex; align-items: center; gap: 7px; background: #3D7A5A; color: #FDFAF6; border: none; padding: 9px 18px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(61,122,90,0.28); transition: background 0.13s; }
.btn-export:hover { background: #2F5E44; }
.btn-export:disabled { opacity: 0.45; cursor: default; pointer-events: none; }

/* Filter card */
.settings-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 14px; box-shadow: 0 2px 10px rgba(80,30,10,0.06); padding: 16px 20px; margin-bottom: 16px; }
.filter-row { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9A7858; }
.select-wrap { display: flex; align-items: center; }
.theia-select { border: 1px solid rgba(155,107,58,0.22); border-radius: 8px; background: #F5EFE4; color: #3A2515; font-family: 'Outfit'; font-size: 13px; padding: 7px 12px; outline: none; cursor: pointer; min-width: 180px; }
.theia-select:focus { border-color: #9B6B3A; }
.filter-sep { width: 1px; height: 36px; background: rgba(155,107,58,0.16); }
.filter-spacer { flex: 1; }
.result-count { font-size: 12px; color: #9A7858; white-space: nowrap; }

/* Table card */
.table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 14px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.tbl-wrap { overflow-x: auto; }
.inv-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1200px; }
.inv-table thead th { text-align: left; padding: 10px 14px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; border-bottom: 1px solid rgba(155,107,58,0.16); }
.inv-table tbody tr { border-top: 1px solid rgba(155,107,58,0.10); transition: background 0.1s; }
.inv-table tbody tr:hover { background: #FAF5EE; }
.inv-table tbody td { padding: 10px 14px; color: #3A2515; vertical-align: middle; white-space: nowrap; }
.text-right { text-align: right; }
.dim { color: #9A7858; font-size: 12px; }
.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.item-name { font-weight: 500; }
.item-desc { font-size: 11px; color: #9A7858; margin-top: 2px; white-space: normal; max-width: 200px; }

/* Status badges */
.status-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.s-in_stock    { background: rgba(61,122,90,0.1);   color: #3D7A5A; }
.s-sold        { background: rgba(90,122,155,0.1);  color: #5A7A9B; }
.s-pulled_out  { background: rgba(155,107,58,0.1);  color: #9B6B3A; }
.s-transferred { background: rgba(100,80,160,0.1);  color: #6450A0; }
.s-consignment { background: rgba(155,120,58,0.1);  color: #9B783A; }
.s-layaway     { background: rgba(58,120,155,0.1);  color: #3A789B; }
.s-reserved    { background: rgba(155,58,58,0.1);   color: #9B3A3A; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.empty-sub { font-size: 12px; color: #9A7858; }
</style>
