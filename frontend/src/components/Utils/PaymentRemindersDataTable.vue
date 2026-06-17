<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Payment Reminders</div>
        <div class="page-sub">Manage layaway payment reminders and notification history</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search reminders..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          New Reminder
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterType === 'all' }" @click="filterType = 'all'">All</button>
        <button class="filter-chip" :class="{ on: filterType === 'upcoming' }" @click="filterType = 'upcoming'">Upcoming</button>
        <button class="filter-chip" :class="{ on: filterType === 'due' }" @click="filterType = 'due'">Due</button>
        <button class="filter-chip" :class="{ on: filterType === 'overdue' }" @click="filterType = 'overdue'">Overdue</button>
        <button class="filter-chip" :class="{ on: filterType === 'final_notice' }" @click="filterType = 'final_notice'">Final Notice</button>
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
              <th @click="sortBy('layawayPlan')">Plan #</th>
              <th @click="sortBy('customer')">Customer</th>
              <th @click="sortBy('reminderType')" class="text-center">Type</th>
              <th @click="sortBy('status')" class="text-center">Status</th>
              <th @click="sortBy('channel')" class="text-center">Channel</th>
              <th @click="sortBy('amountDue')" class="text-right">Amount Due</th>
              <th @click="sortBy('paymentDueDate')" class="text-center">Due Date</th>
              <th @click="sortBy('scheduledDate')" class="text-center">Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.layawayPlan?.planNumber || '—' }}</td>
              <td>
                <span class="cust-name" v-if="item.customer">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-center">
                <span class="type-badge" :class="'rt-' + item.reminderType">{{ formatReminderType(item.reminderType) }}</span>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="'rs-' + item.status">{{ formatStatus(item.status) }}</span>
              </td>
              <td class="text-center">
                <span class="channel-badge" :class="'ch-' + item.channel">
                  <v-icon size="11" style="margin-right:3px">{{ getChannelIcon(item.channel) }}</v-icon>
                  {{ formatChannel(item.channel) }}
                </span>
              </td>
              <td class="text-right">
                <span class="amt-col">₱{{ formatNumber(item.amountDue) }}</span>
              </td>
              <td class="text-center">
                <span v-if="item.paymentDueDate" :class="isOverdue(item.paymentDueDate) ? 'overdue-date' : 'dim'">
                  {{ formatDate(item.paymentDueDate) }}
                  <span v-if="isOverdue(item.paymentDueDate)" class="overdue-dot"> ●</span>
                </span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-center dim">{{ item.scheduledDate ? formatDateTime(item.scheduledDate) : '—' }}</td>
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
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-bell-outline</v-icon></div>
                  <div class="empty-title">No payment reminders found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading reminders...</div>
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

    <!-- Dialogs -->
    <PaymentRemindersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this payment reminder?</v-card-text>
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
import PaymentRemindersDialog from "../../components/Dialogs/Forms/PaymentRemindersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { PaymentRemindersDialog },

  data: () => ({
    search: "",
    filterType: "all",
    currentPage: 1,
    perPage: 10,
    sortKey: "paymentDueDate",
    sortDir: "asc",
    data: [],
    deleteData: null,
    updateData: null,
    loading: false,
    deleting: false,
    action: null,
    dialogConfirmDelete: false,
    fadeAwayMessage: { show: false, type: "success", header: "", message: "", top: 10 },
  }),

  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterType !== "all") result = result.filter(r => r.reminderType === this.filterType);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter(r =>
          [r.layawayPlan?.planNumber, r.customer?.firstName, r.customer?.lastName]
            .filter(Boolean).some(f => String(f).toLowerCase().includes(q))
        );
      }
      result.sort((a, b) => {
        let va = this.sortKey === 'layawayPlan' ? (a.layawayPlan?.planNumber || '') :
                 this.sortKey === 'customer' ? (a.customer?.firstName || '') : (a[this.sortKey] ?? '');
        let vb = this.sortKey === 'layawayPlan' ? (b.layawayPlan?.planNumber || '') :
                 this.sortKey === 'customer' ? (b.customer?.firstName || '') : (b[this.sortKey] ?? '');
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
    eventBus.on("closePaymentRemindersDialog", () => { this.initialize(); });
  },

  beforeUnmount() { eventBus.off("closePaymentRemindersDialog"); },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
      else { this.sortKey = key; this.sortDir = 'asc'; }
    },
    formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); },
    formatDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); },
    formatNumber(v) { if (v === null || v === undefined) return '0.00'; return Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    formatStatus(s) { if (!s) return '—'; return s.charAt(0).toUpperCase() + s.slice(1); },
    formatReminderType(t) { return { upcoming: 'Upcoming', due: 'Due', overdue: 'Overdue', final_notice: 'Final Notice' }[t] || t || '—'; },
    formatChannel(c) { return { sms: 'SMS', email: 'Email', phone_call: 'Phone', in_person: 'In Person' }[c] || c || '—'; },
    getChannelIcon(c) { return { sms: 'mdi-message-text', email: 'mdi-email-outline', phone_call: 'mdi-phone', in_person: 'mdi-account' }[c] || 'mdi-bell'; },
    isOverdue(d) {
      if (!d) return false;
      const due = new Date(d); due.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return today > due;
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/payment-reminders", "GET")
        .then(res => { if (res && res.data) this.data = res.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: 'error', header: 'Error', message: 'Failed to load reminders', top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/payment-reminders/" + this.deleteData.id, "DELETE")
        .then(res => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage = { show: true, type: 'success', header: 'Deleted', message: 'Reminder deleted', top: 10 };
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
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
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
.overdue-date { color: #B84040; font-size: 12px; font-weight: 600; }
.overdue-dot { font-size: 8px; }

/* Reminder type badges */
.type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.rt-upcoming    { background: rgba(26,107,192,0.1);  color: #1A6BC0; }
.rt-due         { background: rgba(196,148,85,0.15); color: #9B6B3A; }
.rt-overdue     { background: rgba(184,64,64,0.1);   color: #B84040; }
.rt-final_notice{ background: rgba(140,20,20,0.12);  color: #8C1414; }

/* Status badges */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.rs-pending   { background: rgba(196,148,85,0.15); color: #9B6B3A; }
.rs-sent      { background: rgba(61,122,90,0.1);   color: #3D7A5A; }
.rs-failed    { background: rgba(184,64,64,0.1);   color: #B84040; }
.rs-cancelled { background: rgba(120,120,140,0.12); color: #5A5A72; }

/* Channel badges */
.channel-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: rgba(155,107,58,0.08); color: #9A7858; }
.ch-sms      { background: rgba(26,107,192,0.1);  color: #1A6BC0; }
.ch-email    { background: rgba(61,122,90,0.1);   color: #3D7A5A; }
.ch-phone_call { background: rgba(90,150,90,0.1); color: #3D7A5A; }
.ch-in_person { background: rgba(155,107,58,0.1); color: #9B6B3A; }

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
.btn-danger-proto[disabled] { opacity: 0.5; cursor: default; }
</style>
