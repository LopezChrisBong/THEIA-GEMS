<template>
  <div class="dash-root" :class="{ dark: darkMode }">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-brand">
        <div class="brand-gem">
          <div class="gem-diamond"></div>
        </div>
        <div>
          <div class="brand-name">Theia Gems</div>
          <div class="brand-sub">Fine Jewelry · POS Dashboard</div>
        </div>
      </div>

      <div class="topbar-right">
        <div class="live-badge">
          <span class="live-dot"></span>
          Live · {{ todayLabel }}
        </div>
        <button class="mode-toggle" @click="toggleDark" :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <span v-if="darkMode" class="mode-icon">☀</span>
          <span v-else class="mode-icon">☽</span>
          {{ darkMode ? 'Light' : 'Dark' }}
        </button>
      </div>
    </div>

    <!-- PERIOD STRIP -->
    <div class="period-strip">
      <div class="period-title">Today's Performance</div>
      <div class="period-controls">
        <div class="branch-select-wrap" v-if="!userBranchId">
          <v-icon size="13" :color="accentColor">mdi-store-outline</v-icon>
          <select v-model="selectedBranch" @change="onBranchChange" class="branch-select">
            <option :value="null">All Branches</option>
            <option v-for="b in branchList" :key="b.branchId" :value="b.branchId">{{ b.branchName }}</option>
          </select>
        </div>
        <div class="branch-locked" v-else>
          <v-icon size="13" :color="accentColor">mdi-store-outline</v-icon>
          {{ lockedBranchName }}
        </div>
        <div class="period-tabs">
          <button v-for="tab in periodTabs" :key="tab.key"
            class="period-tab" :class="{ on: activePeriod === tab.key }"
            @click="activePeriod = tab.key; loadTrend()">
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- KPI ROW -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-top">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-icon">{{ kpi.icon }}</div>
        </div>
        <div class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-bottom">
          <span class="kpi-delta" :class="kpi.up ? 'up' : 'down'">
            {{ kpi.up ? '▲' : '▼' }} {{ kpi.delta }}
          </span>
          <span class="kpi-cmp">vs yesterday</span>
          <svg class="kpi-spark" viewBox="0 0 110 34" preserveAspectRatio="none">
            <path :d="kpi.sparkArea" :fill="kpi.up ? 'rgba(136,176,127,0.2)' : 'rgba(184,100,100,0.2)'"></path>
            <path :d="kpi.sparkLine" fill="none" :stroke="kpi.up ? '#88B07F' : '#B86464'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- MAIN GRID: TREND + DONUT -->
    <div class="grid-2 grid-trend">
      <!-- REVENUE TREND -->
      <div class="dash-card">
        <div class="card-header">
          <div>
            <div class="card-title">Revenue Trend</div>
            <div class="card-sub">Gross sales · {{ periodTabs.find(t=>t.key===activePeriod)?.label }}</div>
          </div>
          <div class="card-head-right">
            <div class="big-num">₱{{ formatNumber(trendTotal) }}</div>
            <div class="card-sub" style="text-align:right">total this period</div>
          </div>
        </div>
        <div class="trend-chart-wrap" v-if="!trendLoading && trendData.length">
          <svg :viewBox="`0 0 ${chartW} 200`" width="100%" style="display:block;overflow:visible;">
            <defs>
              <linearGradient id="tg-emp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="accentColor" stop-opacity="0.35"></stop>
                <stop offset="100%" :stop-color="accentColor" stop-opacity="0"></stop>
              </linearGradient>
            </defs>
            <line v-for="y in gridYLines" :key="y.val" x1="40" :x2="chartW-8" :y1="y.py" :y2="y.py"
              :stroke="darkMode ? 'rgba(201,163,91,0.09)' : 'rgba(155,107,58,0.12)'" stroke-width="1" />
            <text v-for="y in gridYLines" :key="'l'+y.val" x="34" :y="y.py+4" text-anchor="end"
              :font-family="darkMode ? 'Hanken Grotesk' : 'Outfit'" font-size="10" font-weight="500"
              :fill="darkMode ? '#6E6452' : '#9A7858'">{{ y.label }}</text>
            <path :d="trendAreaPath" fill="url(#tg-emp)"></path>
            <path :d="trendLinePath" fill="none" :stroke="accentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"></path>
            <circle v-for="(pt, i) in trendPoints" :key="i"
              :cx="pt.x" :cy="pt.y" r="3" :fill="accentColor"
              :stroke="darkMode ? '#14110E' : '#FDFAF6'" stroke-width="2"></circle>
            <text v-for="(pt, i) in trendPoints" :key="'xl'+i"
              :x="pt.x" y="195" text-anchor="middle"
              :font-family="darkMode ? 'Hanken Grotesk' : 'Outfit'" font-size="9" font-weight="500"
              :fill="darkMode ? '#6E6452' : '#9A7858'">{{ pt.label }}</text>
          </svg>
        </div>
        <div class="chart-empty" v-else-if="trendLoading">
          <v-progress-circular indeterminate :color="accentColor" size="24" />
        </div>
        <div class="chart-empty" v-else>No trend data available</div>
      </div>

      <!-- PAYMENT STATUS DONUT -->
      <div class="dash-card">
        <div class="card-title">Sales by Type</div>
        <div class="card-sub" style="margin-top:3px;margin-bottom:16px">Revenue share this period</div>
        <div class="donut-wrap">
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="70" fill="none"
              :stroke="darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'" stroke-width="22"></circle>
            <g transform="rotate(-90 100 100)">
              <circle v-for="(seg, i) in donutSegments" :key="i"
                cx="100" cy="100" r="70" fill="none"
                :stroke="seg.color" stroke-width="22"
                :stroke-dasharray="seg.dash"
                :stroke-dashoffset="seg.offset"></circle>
            </g>
          </svg>
          <div class="donut-center">
            <div class="donut-lbl">TOTAL</div>
            <div class="donut-val">{{ donutTotal }}</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="donut-row" v-for="seg in donutSegments" :key="seg.label">
            <span class="donut-dot" :style="{ background: seg.color }"></span>
            <span class="donut-name">{{ seg.label }}</span>
            <span class="donut-pct">{{ seg.pct }}%</span>
            <span class="donut-amount">{{ seg.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN GRID: TRANSACTIONS + INVENTORY -->
    <div class="grid-2 grid-bottom">
      <!-- RECENT TRANSACTIONS -->
      <div class="dash-card">
        <div class="card-header">
          <div>
            <div class="card-title">Recent Transactions</div>
            <div class="card-sub">Latest sales activity</div>
          </div>
          <span class="count-pill" v-if="recentSales.length">{{ recentSales.length }}</span>
        </div>
        <div class="txn-table-wrap">
          <div class="txn-loading" v-if="salesLoading">
            <v-progress-circular indeterminate :color="accentColor" size="20" />
          </div>
          <table class="txn-table" v-else>
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Customer</th>
                <th>Type</th>
                <th class="text-right">Amount</th>
                <th class="text-center">Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in recentSales" :key="s.id" class="txn-row">
                <td class="mono">{{ s.saleNumber }}</td>
                <td>{{ s.customer ? s.customer.firstName + ' ' + s.customer.lastName : 'Walk-in' }}</td>
                <td><span class="type-pill" :class="'t-'+s.saleType">{{ s.saleType }}</span></td>
                <td class="text-right amt">₱{{ formatNumber(s.totalAmount) }}</td>
                <td class="text-center">
                  <span class="status-pip" :class="'p-'+s.paymentStatus">{{ s.paymentStatus }}</span>
                </td>
                <td class="dim">{{ fmtDate(s.saleDate) }}</td>
              </tr>
              <tr v-if="recentSales.length === 0">
                <td colspan="6" class="txn-empty">No recent transactions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- INVENTORY + LAYAWAY -->
      <div style="display:flex;flex-direction:column;gap:18px;">
        <!-- INVENTORY -->
        <div class="dash-card">
          <div class="card-title">Inventory Snapshot</div>
          <div class="card-sub" style="margin-top:3px;margin-bottom:14px">Current stock status</div>
          <div class="inv-grid">
            <div class="inv-stat" v-for="st in inventoryStats" :key="st.label">
              <div class="inv-val">{{ st.value }}</div>
              <div class="inv-lbl">{{ st.label }}</div>
            </div>
          </div>
        </div>

        <!-- ACTIVE LAYAWAYS -->
        <div class="dash-card">
          <div class="card-title">Active Layaway Plans</div>
          <div class="card-sub" style="margin-top:3px;margin-bottom:14px">Ongoing installment plans</div>
          <div class="inv-grid">
            <div class="inv-stat">
              <div class="inv-val">{{ layawayStats.active }}</div>
              <div class="inv-lbl">Active Plans</div>
            </div>
            <div class="inv-stat">
              <div class="inv-val">₱{{ formatNumber(layawayStats.totalBalance) }}</div>
              <div class="inv-lbl">Total Remaining</div>
            </div>
            <div class="inv-stat">
              <div class="inv-val warn-val">{{ layawayStats.overdue }}</div>
              <div class="inv-lbl">Overdue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmployeeDashboard",

  data() {
    return {
      darkMode: localStorage.getItem("theia-dark") === "true",
      activePeriod: "7d",
      periodTabs: [
        { key: "7d", label: "7 Days" },
        { key: "30d", label: "30 Days" },
        { key: "90d", label: "90 Days" },
      ],
      todayLabel: new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),

      // Branch
      branchList: [],
      selectedBranch: null,

      kpis: [
        { label: "Today's Sales", icon: "💰", value: "—", delta: "—", up: true, sparkLine: "", sparkArea: "" },
        { label: "Orders Today", icon: "🧾", value: "—", delta: "—", up: true, sparkLine: "", sparkArea: "" },
        { label: "Total Customers", icon: "👤", value: "—", delta: "—", up: true, sparkLine: "", sparkArea: "" },
        { label: "Active Layaways", icon: "📋", value: "—", delta: "—", up: true, sparkLine: "", sparkArea: "" },
      ],

      trendLoading: false,
      trendData: [],
      chartW: 720,

      salesLoading: false,
      recentSales: [],

      donutSegments: [],
      donutTotal: "—",

      inventoryStats: [
        { label: "In Stock", value: "—" },
        { label: "On Layaway", value: "—" },
        { label: "Consignment", value: "—" },
      ],

      layawayStats: { active: 0, overdue: 0, totalBalance: 0 },
    };
  },

  computed: {
    accentColor() { return this.darkMode ? "#C9A35B" : "#9B6B3A"; },

    userBranchId() {
      const id = this.$store.state.user?.branchId;
      return id ? Number(id) : null;
    },

    lockedBranchName() {
      const b = this.branchList.find((br) => br.branchId === this.userBranchId);
      return b ? b.branchName : "My Branch";
    },

    trendTotal() {
      return this.trendData.reduce((s, d) => s + (d.totalAmount || 0), 0);
    },

    trendPoints() {
      if (!this.trendData.length) return [];
      const vals = this.trendData.map(d => d.totalAmount || 0);
      const max = Math.max(...vals, 1);
      const n = vals.length;
      const pad = 48; const w = this.chartW - pad - 8;
      return vals.map((v, i) => ({
        x: pad + (i / Math.max(n - 1, 1)) * w,
        y: 175 - (v / max) * 155,
        label: this.trendData[i]?.label || "",
      }));
    },

    trendLinePath() {
      const pts = this.trendPoints;
      if (pts.length < 2) return "";
      return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    },

    trendAreaPath() {
      const pts = this.trendPoints;
      if (pts.length < 2) return "";
      const last = pts[pts.length - 1];
      const first = pts[0];
      return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
        + ` L${last.x.toFixed(1)},180 L${first.x.toFixed(1)},180 Z`;
    },

    gridYLines() {
      if (!this.trendData.length) return [];
      const vals = this.trendData.map(d => d.totalAmount || 0);
      const max = Math.max(...vals, 1);
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const val = (max / steps) * i;
        const py = 175 - (val / max) * 155;
        return { val, py, label: val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val.toFixed(0)}` };
      }).reverse();
    },
  },

  mounted() {
    if (this.userBranchId) this.selectedBranch = this.userBranchId;
    this.loadBranches();
    this.loadAll();
  },

  methods: {
    toggleDark() {
      this.darkMode = !this.darkMode;
      localStorage.setItem("theia-dark", String(this.darkMode));
    },

    loadBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res && res.data) {
          this.branchList = res.data;
        }
      });
    },

    onBranchChange() {
      this.loadAll();
    },

    formatNumber(v) {
      if (!v && v !== 0) return "0.00";
      return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    fmtDate(d) {
      if (!d) return "—";
      return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    },

    async loadAll() {
      await Promise.all([
        this.loadTodayKPIs(),
        this.loadTrend(),
        this.loadRecentSales(),
        this.loadInventory(),
        this.loadLayaways(),
        this.loadCustomers(),
      ]);
    },

    async loadTodayKPIs() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const branchParam = this.selectedBranch ? `&branchId=${this.selectedBranch}` : "";
        const res = await this.axiosCall(`/sales/daily-summary?date=${today}${branchParam}`, "GET");
        if (res && res.data) {
          const d = res.data;
          this.kpis[0].value = `₱${this.formatNumber(d.totalAmount || 0)}`;
          this.kpis[0].delta = `${d.saleCount || 0} sales`;
          this.kpis[0].up = (d.totalAmount || 0) > 0;
          this.kpis[0].sparkLine = this.flatSparkLine(d.totalAmount || 0);
          this.kpis[0].sparkArea = this.flatSparkArea(d.totalAmount || 0);

          this.kpis[1].value = String(d.saleCount || 0);
          this.kpis[1].delta = `₱${this.formatNumber((d.totalAmount || 0) / Math.max(d.saleCount || 1, 1))} avg`;
          this.kpis[1].up = (d.saleCount || 0) > 0;
          this.kpis[1].sparkLine = this.flatSparkLine(d.saleCount || 0);
          this.kpis[1].sparkArea = this.flatSparkArea(d.saleCount || 0);
        }
      } catch (_) { /* ignore */ }
    },

    async loadCustomers() {
      try {
        const res = await this.axiosCall("/customers", "GET");
        if (res && res.data) {
          const count = res.data.length;
          const repeat = res.data.filter(c => c.isRepeatBuyer).length;
          this.kpis[2].value = String(count);
          this.kpis[2].delta = `${repeat} repeat buyers`;
          this.kpis[2].up = true;
          this.kpis[2].sparkLine = this.flatSparkLine(count);
          this.kpis[2].sparkArea = this.flatSparkArea(count);
        }
      } catch (_) { /* ignore */ }
    },

    async loadTrend() {
      this.trendLoading = true;
      try {
        const days = this.activePeriod === "7d" ? 7 : this.activePeriod === "30d" ? 30 : 90;
        const end = new Date();
        const start = new Date(); start.setDate(start.getDate() - days + 1);
        const startStr = start.toISOString().slice(0, 10);
        const endStr = end.toISOString().slice(0, 10);
        const branchParam = this.selectedBranch ? `&branchId=${this.selectedBranch}` : "";
        const res = await this.axiosCall(`/sales/report?period=daily&startDate=${startStr}&endDate=${endStr}${branchParam}`, "GET");
        if (res && res.data && res.data.grouped) {
          this.trendData = res.data.grouped.map(g => ({
            label: g.label ? g.label.split(" ").slice(0, 2).join(" ") : "",
            totalAmount: g.revenue || 0,
          }));
          this.buildDonut(res.data.sales || []);
        }
      } catch (_) { /* ignore */ }
      finally { this.trendLoading = false; }
    },

    buildDonut(sales) {
      const totals = {};
      let grand = 0;
      for (const s of sales) {
        const t = s.saleType || "regular";
        totals[t] = (totals[t] || 0) + Number(s.totalAmount || 0);
        grand += Number(s.totalAmount || 0);
      }
      const palette = {
        regular: this.darkMode ? "#C9A35B" : "#9B6B3A",
        layaway: "#5B7C9C",
        consignment: "#5E8C73",
      };
      let offset = 0;
      const circ = 2 * Math.PI * 70;
      this.donutSegments = Object.entries(totals).map(([type, val]) => {
        const pct = grand > 0 ? val / grand : 0;
        const dash = circ * pct;
        const seg = {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          color: palette[type] || "#9A8B70",
          dash: `${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`,
          offset: `-${offset.toFixed(2)}`,
          pct: (pct * 100).toFixed(0),
          value: `₱${this.formatNumber(val)}`,
        };
        offset += dash;
        return seg;
      });
      this.donutTotal = grand > 0 ? `₱${this.formatNumber(grand)}` : "—";
    },

    async loadRecentSales() {
      this.salesLoading = true;
      try {
        const url = this.selectedBranch ? `/sales/branch/${this.selectedBranch}` : "/sales";
        const res = await this.axiosCall(url, "GET");
        if (res && res.data) {
          this.recentSales = res.data.slice(0, 10);
        }
      } catch (_) { /* ignore */ }
      finally { this.salesLoading = false; }
    },

    async loadInventory() {
      try {
        const url = this.selectedBranch ? `/jewelry-items?branchId=${this.selectedBranch}` : "/jewelry-items";
        const res = await this.axiosCall(url, "GET");
        if (res && res.data) {
          const all = res.data;
          const inStock = all.filter(i => i.status === "IN_STOCK").length;
          const layaway = all.filter(i => i.status === "LAYAWAY").length;
          const consign = all.filter(i => i.status === "CONSIGNMENT").length;
          this.inventoryStats = [
            { label: "On Hand / Available", value: String(inStock) },
            { label: "On Layaway", value: String(layaway) },
            { label: "Consignment", value: String(consign) },
          ];
        }
      } catch (_) { /* ignore */ }
    },

    async loadLayaways() {
      try {
        const url = this.selectedBranch ? `/layaway-plans/branch/${this.selectedBranch}` : "/layaway-plans";
        const res = await this.axiosCall(url, "GET");
        if (res && res.data) {
          const plans = res.data;
          const active = plans.filter(p => p.status === "active");
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const overdue = active.filter(p => {
            if (!p.nextPaymentDate) return false;
            const due = new Date(p.nextPaymentDate); due.setHours(0, 0, 0, 0);
            return today > due;
          }).length;
          const totalBalance = active.reduce((s, p) => s + Number(p.remainingBalance || 0), 0);
          this.layawayStats = { active: active.length, overdue, totalBalance };

          this.kpis[3].value = String(active.length);
          this.kpis[3].delta = `${overdue} overdue`;
          this.kpis[3].up = overdue === 0;
          this.kpis[3].sparkLine = this.flatSparkLine(active.length);
          this.kpis[3].sparkArea = this.flatSparkArea(active.length);
        }
      } catch (_) { /* ignore */ }
    },

    flatSparkLine(finalVal) {
      const pts = [0.4, 0.55, 0.45, 0.65, 0.5, 0.72, 0.6, 0.78, 0.68, 0.85, 0.9, 1.0];
      const scaleY = finalVal > 0 ? 28 : 10;
      const step = 110 / (pts.length - 1);
      return pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(34 - v * scaleY).toFixed(1)}`).join(" ");
    },

    flatSparkArea(finalVal) {
      const pts = [0.4, 0.55, 0.45, 0.65, 0.5, 0.72, 0.6, 0.78, 0.68, 0.85, 0.9, 1.0];
      const scaleY = finalVal > 0 ? 28 : 10;
      const step = 110 / (pts.length - 1);
      const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(34 - v * scaleY).toFixed(1)}`).join(" ");
      return `${line} L110,34 L0,34 Z`;
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');

.dash-root {
  font-family: 'Outfit', system-ui, sans-serif;
  min-height: 100vh;
  padding: 28px 36px 52px;
  transition: background 0.3s ease, color 0.3s ease;
  background: #F5EFE4;
  color: #3A2515;
}
.dash-root.dark {
  background: radial-gradient(1200px 600px at 80% -10%, rgba(201,163,91,0.07), transparent 60%), #14110E;
  color: #F2ECE0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.topbar-brand { display: flex; align-items: center; gap: 14px; }
.brand-gem {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 11px;
  border: 1px solid rgba(155,107,58,0.4);
  background: rgba(155,107,58,0.07);
  transition: background 0.3s, border-color 0.3s;
}
.dark .brand-gem { border-color: rgba(201,163,91,0.5); background: rgba(201,163,91,0.07); }
.gem-diamond {
  width: 15px; height: 15px;
  background: linear-gradient(135deg, #E3C485, #C9A35B);
  transform: rotate(45deg);
  border-radius: 2px;
}
.brand-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px; font-weight: 600; letter-spacing: 0.04em; line-height: 1;
  color: #3A2515; transition: color 0.3s;
}
.dark .brand-name { color: #F4EEE2; }
.brand-sub {
  font-size: 10px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: #9A7858; margin-top: 4px; transition: color 0.3s;
}
.dark .brand-sub { color: #9A8B70; }

.topbar-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.live-badge {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 500; color: #9A7858; transition: color 0.3s;
}
.dark .live-badge { color: #857859; }
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #88B07F; box-shadow: 0 0 8px rgba(136,176,127,0.7);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.mode-toggle {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600;
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s;
  letter-spacing: 0.04em;
  background: #FDFAF6; border: 1px solid rgba(155,107,58,0.25); color: #9B6B3A;
  box-shadow: 0 1px 6px rgba(80,30,10,0.08);
}
.mode-toggle:hover { background: #EDE0CC; border-color: #C49455; }
.dark .mode-toggle { background: rgba(201,163,91,0.1); border-color: rgba(201,163,91,0.3); color: #E3C485; }
.dark .mode-toggle:hover { background: rgba(201,163,91,0.18); }
.mode-icon { font-size: 14px; }

.period-strip {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 18px; border-bottom: 1px solid rgba(155,107,58,0.16);
  padding-bottom: 14px; flex-wrap: wrap; gap: 12px;
}
.dark .period-strip { border-bottom-color: rgba(201,163,91,0.12); }
.period-title {
  font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600;
  line-height: 1; color: #3A2515; transition: color 0.3s;
}
.dark .period-title { color: #F4EEE2; }
.period-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.branch-select-wrap {
  display: flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 10px;
  background: #FDFAF6; border: 1px solid rgba(155,107,58,0.2); transition: background 0.3s, border-color 0.3s;
}
.dark .branch-select-wrap { background: rgba(0,0,0,0.25); border-color: rgba(201,163,91,0.2); }
.branch-select {
  border: none; background: none; outline: none; font-size: 12px; font-weight: 600;
  font-family: 'Outfit', sans-serif; color: #3A2515; cursor: pointer;
}
.dark .branch-select { color: #E3C485; }
.dark .branch-select option { background: #1E1913; color: #E3C485; }
.branch-locked {
  display: flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 10px;
  background: rgba(155,107,58,0.08); border: 1px solid rgba(155,107,58,0.14);
  font-size: 12px; font-weight: 600; color: #9B6B3A; transition: background 0.3s, border-color 0.3s, color 0.3s;
}
.dark .branch-locked { background: rgba(0,0,0,0.25); border-color: rgba(201,163,91,0.14); color: #E3C485; }
.period-tabs {
  display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 12px;
  background: rgba(155,107,58,0.08); border: 1px solid rgba(155,107,58,0.14);
  transition: background 0.3s, border-color 0.3s;
}
.dark .period-tabs { background: rgba(0,0,0,0.25); border-color: rgba(201,163,91,0.14); }
.period-tab {
  padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500;
  font-family: 'Outfit', sans-serif; cursor: pointer; border: none; background: none;
  color: #9A7858; transition: all 0.18s;
}
.dark .period-tab { color: #857859; }
.period-tab.on { background: #9B6B3A; color: #FDFAF6; font-weight: 600; box-shadow: 0 2px 8px rgba(155,107,58,0.3); }
.dark .period-tab.on { background: rgba(201,163,91,0.22); color: #E3C485; box-shadow: none; }

.kpi-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 18px;
}
@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .kpi-row { grid-template-columns: 1fr; } }

.kpi-card {
  border-radius: 18px; padding: 20px 22px 16px;
  transition: border-color 0.25s ease, background 0.3s;
  background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16);
  box-shadow: 0 2px 12px rgba(80,30,10,0.07);
}
.dark .kpi-card {
  background: linear-gradient(160deg, #1E1913, #191510);
  border-color: rgba(201,163,91,0.16); box-shadow: none;
}
.kpi-card:hover { border-color: rgba(155,107,58,0.35); }
.dark .kpi-card:hover { border-color: rgba(201,163,91,0.35); }
.kpi-top { display: flex; align-items: center; justify-content: space-between; }
.kpi-label {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em;
  text-transform: uppercase; color: #9A7858; transition: color 0.3s;
}
.dark .kpi-label { color: #9A8B70; }
.kpi-icon { font-size: 15px; }
.kpi-value {
  font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 34px;
  line-height: 1.05; letter-spacing: 0.01em; margin-top: 10px;
  color: #3A2515; transition: color 0.3s;
}
.dark .kpi-value { color: #F5EFE3; }
.kpi-bottom { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
.kpi-delta { font-size: 11px; font-weight: 600; }
.kpi-delta.up { color: #3D7A5A; }
.kpi-delta.down { color: #B84040; }
.kpi-cmp { font-size: 11px; font-weight: 500; color: #9A7858; transition: color 0.3s; flex: 1; }
.dark .kpi-cmp { color: #6E6452; }
.kpi-spark { width: 88px; height: 28px; overflow: visible; flex-shrink: 0; }

.dash-card {
  border-radius: 18px; padding: 22px 24px;
  transition: border-color 0.25s ease, background 0.3s;
  background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16);
  box-shadow: 0 2px 12px rgba(80,30,10,0.07);
}
.dark .dash-card { background: #1B1712; border-color: rgba(201,163,91,0.16); box-shadow: none; }
.dash-card:hover { border-color: rgba(155,107,58,0.3); }
.dark .dash-card:hover { border-color: rgba(201,163,91,0.3); }

.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 15px; font-weight: 600; line-height: 1.2; color: #3A2515; transition: color 0.3s; }
.dark .card-title { color: #F0E9DB; }
.card-sub { font-size: 12px; font-weight: 500; color: #9A7858; margin-top: 3px; transition: color 0.3s; }
.dark .card-sub { color: #857859; }
.card-head-right { text-align: right; }
.big-num {
  font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600;
  line-height: 1; color: #9B6B3A; transition: color 0.3s;
}
.dark .big-num { color: #E3C485; }
.count-pill {
  background: rgba(155,107,58,0.1); color: #9B6B3A;
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
  transition: background 0.3s, color 0.3s;
}
.dark .count-pill { background: rgba(201,163,91,0.1); color: #C9A35B; }

.grid-2 { display: grid; gap: 18px; margin-bottom: 18px; }
.grid-trend { grid-template-columns: 1.9fr 1fr; }
.grid-bottom { grid-template-columns: 1.6fr 1fr; }
@media (max-width: 900px) { .grid-trend, .grid-bottom { grid-template-columns: 1fr; } }

.trend-chart-wrap { margin-top: 8px; overflow: hidden; }
.chart-empty {
  height: 200px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #9A7858; gap: 10px;
}
.dark .chart-empty { color: #6E6452; }

.donut-wrap { position: relative; display: flex; justify-content: center; margin-bottom: 10px; }
.donut-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; pointer-events: none;
}
.donut-lbl {
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  color: #9A7858; transition: color 0.3s;
}
.dark .donut-lbl { color: #9A8B70; }
.donut-val {
  font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600;
  line-height: 1.1; color: #3A2515; margin-top: 3px; transition: color 0.3s;
}
.dark .donut-val { color: #F4EEE2; }
.donut-legend { display: flex; flex-direction: column; gap: 2px; }
.donut-row {
  display: flex; align-items: center; gap: 10px; padding: 6px 8px;
  border-radius: 9px; font-size: 12.5px; transition: background 0.15s;
}
.donut-row:hover { background: rgba(155,107,58,0.06); }
.dark .donut-row:hover { background: rgba(201,163,91,0.05); }
.donut-dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
.donut-name { flex: 1; color: #3A2515; font-weight: 500; transition: color 0.3s; }
.dark .donut-name { color: #D8CFBE; }
.donut-pct { font-weight: 600; font-size: 12px; color: #9A7858; transition: color 0.3s; }
.dark .donut-pct { color: #857859; }
.donut-amount { font-weight: 600; font-size: 12px; min-width: 70px; text-align: right; color: #3A2515; transition: color 0.3s; }
.dark .donut-amount { color: #E9E1D2; }

.txn-table-wrap { overflow-x: auto; max-height: 380px; overflow-y: auto; }
.txn-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 520px; }
.txn-table thead th {
  text-align: left; padding: 8px 10px; font-size: 9.5px; letter-spacing: 0.13em;
  text-transform: uppercase; font-weight: 600; white-space: nowrap;
  position: sticky; top: 0;
  background: #F5EFE4; color: #9A7858; transition: background 0.3s, color 0.3s;
}
.dark .txn-table thead th { background: #1E1913; color: #857859; }
.txn-row { border-top: 1px solid rgba(155,107,58,0.1); transition: background 0.1s; }
.dark .txn-row { border-color: rgba(201,163,91,0.06); }
.txn-row:hover { background: rgba(155,107,58,0.05); }
.dark .txn-row:hover { background: rgba(201,163,91,0.05); }
.txn-table td { padding: 10px 10px; color: #3A2515; white-space: nowrap; transition: color 0.3s; }
.dark .txn-table td { color: #ECE4D4; }
.txn-loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
.txn-empty { text-align: center; padding: 32px; color: #9A7858; }
.dark .txn-empty { color: #6E6452; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.mono { font-family: monospace; font-size: 11px; color: #9B6B3A; font-weight: 600; transition: color 0.3s; }
.dark .mono { color: #C9A35B; }
.dim { color: #9A7858; font-size: 11px; transition: color 0.3s; }
.dark .dim { color: #6E6452; }
.amt { font-weight: 600; color: #9B6B3A; transition: color 0.3s; }
.dark .amt { color: #E3C485; }

.type-pill {
  display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px;
  font-weight: 500; text-transform: capitalize;
  background: rgba(155,107,58,0.08); color: #9A7858; transition: background 0.3s, color 0.3s;
}
.dark .type-pill { background: rgba(201,163,91,0.08); color: #9A8B70; }
.t-layaway { background: rgba(91,124,156,0.12); color: #5B7C9C; }
.t-consignment { background: rgba(94,140,115,0.12); color: #5E8C73; }

.status-pip { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; text-transform: capitalize; }
.p-paid { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.p-partial, .p-layaway { background: rgba(196,148,85,0.15); color: #9B6B3A; }
.dark .p-partial, .dark .p-layaway { background: rgba(201,163,91,0.12); color: #C9A35B; }
.p-refunded { background: rgba(120,120,140,0.12); color: #5A5A72; }

.inv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.inv-stat {
  background: rgba(155,107,58,0.06); border: 1px solid rgba(155,107,58,0.1);
  border-radius: 12px; padding: 12px 14px; transition: background 0.3s, border-color 0.3s;
}
.dark .inv-stat { background: rgba(0,0,0,0.2); border-color: rgba(201,163,91,0.1); }
.inv-val {
  font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600;
  line-height: 1; color: #3A2515; transition: color 0.3s;
}
.dark .inv-val { color: #F0E9DB; }
.warn-val { color: #B84040 !important; }
.dark .warn-val { color: #ff8a80 !important; }
.inv-lbl {
  font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
  color: #9A7858; margin-top: 5px; transition: color 0.3s;
}
.dark .inv-lbl { color: #857859; }

.dark ::-webkit-scrollbar { width: 7px; }
.dark ::-webkit-scrollbar-thumb { background: rgba(201,163,91,0.2); border-radius: 4px; }
.dark ::-webkit-scrollbar-track { background: transparent; }
</style>
