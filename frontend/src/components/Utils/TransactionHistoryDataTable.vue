<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Transaction History</div>
        <div class="page-sub">Complete audit trail of all system transactions</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search transactions..." class="search-input-proto" />
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filters -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterType === null }" @click="filterType = null">All</button>
        <button
          v-for="t in typeOptions" :key="t.value"
          class="filter-chip"
          :class="{ on: filterType === t.value }"
          @click="filterType = t.value"
        >{{ t.label }}</button>
        <div class="filter-spacer" />
        <div class="per-pg">
          Items per page:
          <select v-model="perPage" @change="page = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th @click="sortBy('createdAt')">Date & Time</th>
              <th @click="sortBy('transactionType')">Type</th>
              <th @click="sortBy('tableName')">Module</th>
              <th>Reference</th>
              <th @click="sortBy('action')">Action</th>
              <th>Performed By</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="dim" style="white-space:nowrap">{{ formatDateTime(item.createdAt) }}</td>
              <td>
                <span class="type-badge" :class="getTypeClass(item.transactionType)">
                  <v-icon size="11" style="margin-right:3px">{{ getTypeIcon(item.transactionType) }}</v-icon>
                  {{ item.transactionType }}
                </span>
              </td>
              <td>
                <span class="module-badge">{{ formatModule(item.tableName) }}</span>
              </td>
              <td class="mono">{{ getReferenceNumber(item) || '—' }}</td>
              <td>
                <span class="action-badge" :class="'a-' + item.action">{{ item.action }}</span>
              </td>
              <td>
                <span v-if="item.performerName" class="cust-name">{{ item.performerName }}</span>
                <span v-else-if="item.performer">{{ item.performer.email }}</span>
                <span v-else class="dim">System</span>
              </td>
              <td>
                <button class="act-btn detail-btn" title="View Details" @click="viewDetails(item)">
                  <v-icon size="14">mdi-information-outline</v-icon>
                </button>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-history</v-icon></div>
                  <div class="empty-title">No transactions found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading transactions...</div>
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

    <!-- Detail Modal -->
    <v-dialog v-model="dialogDetail" max-width="500px">
      <v-card v-if="detailData" class="detail-card">
        <div class="detail-header">
          <div>
            <div class="detail-title">Transaction Detail</div>
            <div class="detail-sub">#{{ detailData.id }}</div>
          </div>
          <button class="sv-close" @click="dialogDetail = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="detail-body">
          <div class="dv-row"><span class="dv-lbl">Type</span>
            <span class="type-badge" :class="getTypeClass(detailData.transactionType)">{{ detailData.transactionType }}</span>
          </div>
          <div class="dv-row"><span class="dv-lbl">Module</span><span class="dv-val">{{ formatModule(detailData.tableName) }}</span></div>
          <div class="dv-row"><span class="dv-lbl">Action</span>
            <span class="action-badge" :class="'a-' + detailData.action">{{ detailData.action }}</span>
          </div>
          <div class="dv-row"><span class="dv-lbl">Date & Time</span><span class="dv-val">{{ formatDateTime(detailData.createdAt) }}</span></div>
          <div class="dv-row">
            <span class="dv-lbl">Performed By</span>
            <span class="dv-val">{{ detailData.performerName || detailData.performer?.email || 'System' }}</span>
          </div>

          <template v-if="detailData.newValues && Object.keys(detailData.newValues).length">
            <div class="dv-section-lbl">New Values</div>
            <div class="dv-json-block">
              <div class="dv-json-row" v-for="(v, k) in detailData.newValues" :key="k">
                <span class="dv-key">{{ k }}</span>
                <span class="dv-val-json">{{ v }}</span>
              </div>
            </div>
          </template>

          <template v-if="detailData.oldValues && Object.keys(detailData.oldValues).length">
            <div class="dv-section-lbl">Old Values</div>
            <div class="dv-json-block">
              <div class="dv-json-row" v-for="(v, k) in detailData.oldValues" :key="k">
                <span class="dv-key">{{ k }}</span>
                <span class="dv-val-json">{{ v }}</span>
              </div>
            </div>
          </template>
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
    filterType: null,
    page: 1,
    perPage: 25,
    sortKey: "createdAt",
    sortDir: "desc",
    data: [],
    loading: false,
    dialogDetail: false,
    detailData: null,
    fadeAwayMessage: { show: false, type: "error", header: "Error", message: "", top: 10 },

    typeOptions: [
      { label: "Sales", value: "Sale Created" },
      { label: "Transfer Approved", value: "Transfer Approved" },
      { label: "Transfer Dispatched", value: "Transfer Dispatched" },
      { label: "Transfer Received", value: "Transfer Received" },
      { label: "Items Added", value: "Item Added" },
    ],
  }),

  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterType) result = result.filter((r) => r.transactionType === this.filterType);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((r) =>
          [
            r.transactionType,
            r.tableName,
            r.performerName,
            r.performer?.email,
            r.action,
            this.getReferenceNumber(r),
          ].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = a[this.sortKey] ?? "";
        let vb = b[this.sortKey] ?? "";
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
      const p = []; const s = Math.max(1, this.page - 2);
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
      else { this.sortKey = key; this.sortDir = "desc"; }
    },

    formatDateTime(d) {
      if (!d) return "—";
      return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    },

    formatModule(tableName) {
      const map = { sales: "Sales", transfers: "Transfers", jewelry_items: "Items", consignment_items: "Consignment", layaway_plans: "Layaway" };
      return map[tableName] || tableName;
    },

    getReferenceNumber(item) {
      if (!item.newValues) return null;
      return item.newValues.saleNumber || item.newValues.transferNumber || item.newValues.itemCode || item.newValues.planNumber || null;
    },

    getTypeClass(type) {
      if (!type) return "type-default";
      if (type.includes("Sale")) return "type-sale";
      if (type.includes("Dispatched")) return "type-dispatch";
      if (type.includes("Received")) return "type-receive";
      if (type.includes("Approved")) return "type-approve";
      if (type.includes("Item")) return "type-item";
      return "type-default";
    },

    getTypeIcon(type) {
      if (!type) return "mdi-circle-outline";
      if (type.includes("Sale")) return "mdi-point-of-sale";
      if (type.includes("Dispatched")) return "mdi-truck-delivery-outline";
      if (type.includes("Received")) return "mdi-package-variant-closed-check";
      if (type.includes("Approved")) return "mdi-check-circle-outline";
      if (type.includes("Item")) return "mdi-diamond-stone";
      return "mdi-circle-outline";
    },

    viewDetails(item) {
      this.detailData = item;
      this.dialogDetail = true;
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/transaction-logs", "GET")
        .then((res) => { if (res?.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load transaction history", top: 10 }; })
        .finally(() => { this.loading = false; });
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
.search-wrap { display: flex; align-items: center; gap: 8px; background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 9px; padding: 8px 13px; box-shadow: 0 1px 6px rgba(80,30,10,0.08); min-width: 220px; }
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit', sans-serif; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }

.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.12s; white-space: nowrap; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit', sans-serif; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }

.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 860px; }
.cust-table thead th { text-align: left; padding: 10px 14px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; cursor: pointer; user-select: none; }
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.12); transition: background 0.1s; }
.cust-table tbody tr:hover { background: rgba(237,224,204,0.4); }
.cust-table tbody td { padding: 10px 14px; color: #3A2515; vertical-align: middle; }
.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }

/* Type badges */
.type-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.type-sale { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.type-dispatch { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.type-receive { background: rgba(90,122,155,0.12); color: #5A7A9B; }
.type-approve { background: rgba(61,122,90,0.1); color: #2a6645; }
.type-item { background: rgba(130,80,160,0.1); color: #7A4A9B; }
.type-default { background: rgba(150,150,150,0.1); color: #888; }

/* Module badge */
.module-badge { display: inline-block; font-size: 11px; color: #6B4A30; background: rgba(155,107,58,0.08); border: 1px solid rgba(155,107,58,0.16); border-radius: 5px; padding: 2px 8px; }

/* Action badges */
.action-badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.06em; }
.a-create { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.a-update { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.a-delete { background: rgba(184,64,64,0.08); color: #B84040; }

.act-btns { display: flex; align-items: center; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn.detail-btn:hover { border-color: #5A7A9B; color: #5A7A9B; background: rgba(90,122,155,0.06); }

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

/* Detail Modal */
.detail-card { border-radius: 16px !important; font-family: 'Outfit', sans-serif; background: #FDFAF6; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px; background: #F5EFE4; border-bottom: 1px solid rgba(155,107,58,0.16); }
.detail-title { font-size: 15px; font-weight: 600; color: #3A2515; }
.detail-sub { font-size: 11px; color: #9A7858; margin-top: 2px; font-family: monospace; }
.sv-close { background: none; border: none; cursor: pointer; color: #9A7858; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color 0.12s; }
.sv-close:hover { color: #B84040; }
.detail-body { padding: 16px 20px; max-height: 65vh; overflow-y: auto; }
.dv-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; font-size: 13px; border-bottom: 1px solid rgba(155,107,58,0.08); }
.dv-row:last-child { border-bottom: none; }
.dv-lbl { color: #9A7858; font-size: 12px; flex-shrink: 0; }
.dv-val { font-weight: 500; text-align: right; color: #3A2515; }
.dv-section-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; margin: 14px 0 6px; }
.dv-json-block { background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16); border-radius: 8px; padding: 8px 12px; }
.dv-json-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed rgba(155,107,58,0.12); }
.dv-json-row:last-child { border-bottom: none; }
.dv-key { color: #9A7858; font-family: monospace; }
.dv-val-json { color: #3A2515; font-weight: 500; font-family: monospace; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,107,58,0.22); border-radius: 4px; }
</style>
