<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Customers</div>
        <div class="page-sub">Manage customer information and purchase history</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Search customers..."
            class="search-input-proto"
          />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Customer
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="cust-table-card">
      <!-- Filter Row -->
      <div class="filter-row">
        <button
          class="filter-chip"
          :class="{ on: filterType === 'all' }"
          @click="filterType = 'all'"
        >All</button>
        <button
          class="filter-chip"
          :class="{ on: filterType === 'repeat' }"
          @click="filterType = 'repeat'"
        >Repeat Buyers</button>
        <button
          class="filter-chip"
          :class="{ on: filterType === 'new' }"
          @click="filterType = 'new'"
        >New Customers</button>
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
              <th @click="sortBy('id')">ID</th>
              <th @click="sortBy('customerCode')">Code</th>
              <th @click="sortBy('firstName')">Name</th>
              <th @click="sortBy('phone')">Phone</th>
              <th @click="sortBy('isRepeatBuyer')">Repeat Buyer</th>
              <th @click="sortBy('totalPurchases')">Total Purchases</th>
              <th @click="sortBy('purchaseCount')">Orders</th>
              <th @click="sortBy('lastPurchaseAt')">Last Purchase</th>
              <th @click="sortBy('registeredAt')">Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.id }}</td>
              <td class="mono">{{ item.customerCode || '—' }}</td>
              <td>
                <span class="cust-name">{{ item.firstName }} {{ item.lastName }}</span>
                <br v-if="item.email">
                <span v-if="item.email" class="dim">{{ item.email }}</span>
              </td>
              <td>{{ item.phone || '—' }}</td>
              <td>
                <span class="repeat-badge" :class="item.isRepeatBuyer ? 'r-yes' : 'r-no'">
                  {{ item.isRepeatBuyer ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="text-right">
                <span class="font-weight-medium">${{ formatNumber(item.totalPurchases) }}</span>
              </td>
              <td class="text-center">{{ item.purchaseCount || 0 }}</td>
              <td class="dim">{{ formatDate(item.lastPurchaseAt) || 'Never' }}</td>
              <td class="dim">{{ formatDate(item.registeredAt) || '—' }}</td>
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
              <td colspan="10">
                <div class="empty-state">
                  <div class="empty-icon">
                    <v-icon size="20" color="#9B6B3A">mdi-account-search</v-icon>
                  </div>
                  <div class="empty-title">No customers found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading -->
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading customers...</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="cust-pagination" v-if="filteredData.length > 0">
        <div class="pg-info">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredData.length }}
        </div>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage = 1">&laquo;</button>
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">&lsaquo;</button>
          <button
            v-for="p in visiblePages"
            :key="p"
            class="pg-btn"
            :class="{ cur: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">&rsaquo;</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <CustomersDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1" style="color: #6B4A30;">
          Are you sure you want to delete this customer?
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

    <!-- Fade Message -->
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
import CustomersDialog from "../../components/Dialogs/Forms/CustomersDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    CustomersDialog,
  },

  data: () => ({
    search: "",
    filterType: "all",
    currentPage: 1,
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
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "Successfully Deleted!",
      message: "",
      top: 10,
    },
  }),

  computed: {
    filteredData() {
      let result = [...this.data];

      // Filter by type
      if (this.filterType === "repeat") {
        result = result.filter((c) => c.isRepeatBuyer);
      } else if (this.filterType === "new") {
        result = result.filter((c) => !c.isRepeatBuyer);
      }

      // Search
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((c) =>
          [c.firstName, c.lastName, c.customerCode, c.phone, c.email]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q))
        );
      }

      // Sort
      result.sort((a, b) => {
        let va = a[this.sortKey];
        let vb = b[this.sortKey];
        if (va == null) va = "";
        if (vb == null) vb = "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return this.sortDir === "asc" ? -1 : 1;
        if (va > vb) return this.sortDir === "asc" ? 1 : -1;
        return 0;
      });

      return result;
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredData.length / this.perPage));
    },

    paginatedData() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredData.slice(start, start + this.perPage);
    },

    paginationStart() {
      return Math.min((this.currentPage - 1) * this.perPage + 1, this.filteredData.length);
    },

    paginationEnd() {
      return Math.min(this.currentPage * this.perPage, this.filteredData.length);
    },

    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + 4);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
  },

  mounted() {
    this.initialize();
    eventBus.on("closeCustomersDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeCustomersDialog");
  },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDir = "asc";
      }
    },

    formatDate(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },

    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      return Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    initialize() {
      this.loading = true;
      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load customers:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load customers";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    addNew() {
      this.updateData = { id: null };
      this.action = "Add";
    },

    editItem(item) {
      this.updateData = { ...item };
      this.action = "Update";
    },

    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },

    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/customers/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Customer deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete customer";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete customer";
        })
        .finally(() => {
          this.deleting = false;
        });
    },
  },
};
</script>

<style scoped>
/* ─── Prototype Design Tokens ─── */
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 9px;
  padding: 8px 13px;
  box-shadow: 0 1px 6px rgba(80,30,10,0.08);
  min-width: 210px;
}

.search-input-proto {
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  width: 100%;
}

.search-input-proto::placeholder {
  color: #9A7858;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #9B6B3A;
  color: #FDFAF6;
  border: none;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(155,107,58,0.3);
  transition: background 0.13s;
}

.btn-add:hover {
  background: #C49455;
}

/* ─── Table Card ─── */
.cust-table-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(80,30,10,0.08);
  overflow: hidden;
}

/* ─── Filter Row ─── */
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid rgba(155,107,58,0.16);
  background: #FDFAF6;
  color: #9A7858;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: all 0.12s;
}

.filter-chip:hover {
  border-color: #C49455;
  color: #9B6B3A;
}

.filter-chip.on {
  border-color: #9B6B3A;
  color: #9B6B3A;
  background: #EDE0CC;
  font-weight: 500;
}

.filter-spacer {
  flex: 1;
}

.per-pg {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #9A7858;
}

.per-pg select {
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 7px;
  background: #FDFAF6;
  color: #3A2515;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  padding: 4px 8px;
  outline: none;
  cursor: pointer;
}

/* ─── Table ─── */
.tbl-wrap {
  overflow-x: auto;
}

.cust-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 860px;
}

.cust-table thead th {
  text-align: left;
  padding: 10px 16px;
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #9A7858;
  font-weight: 600;
  background: #F5EFE4;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.cust-table thead th:hover {
  color: #9B6B3A;
}

.cust-table tbody tr {
  border-top: 1px solid rgba(155,107,58,0.16);
  transition: background 0.1s;
}

.cust-table tbody tr:hover {
  background: #EDE0CC;
}

.cust-table tbody td {
  padding: 11px 16px;
  color: #3A2515;
  white-space: nowrap;
  vertical-align: middle;
}

td.mono {
  font-family: monospace;
  font-size: 12px;
  color: #9B6B3A;
  font-weight: 600;
}

td.dim {
  color: #9A7858;
  font-size: 12px;
}

.cust-name {
  font-weight: 500;
}

/* ─── Badges ─── */
.repeat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.r-yes {
  background: rgba(61,122,90,0.1);
  color: #3D7A5A;
}

.r-no {
  background: rgba(155,107,58,0.08);
  color: #9A7858;
}

/* ─── Action Buttons ─── */
.act-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.act-btn {
  width: 27px;
  height: 27px;
  border-radius: 7px;
  border: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  color: #9A7858;
}

.act-btn:hover {
  border-color: #C49455;
  color: #9B6B3A;
  background: #EDE0CC;
}

.act-btn.del:hover {
  border-color: rgba(184,64,64,0.4);
  color: #B84040;
  background: rgba(184,64,64,0.06);
}

/* ─── Pagination ─── */
.cust-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 18px;
  border-top: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
}

.pg-info {
  font-size: 12px;
  color: #9A7858;
}

.pg-btns {
  display: flex;
  align-items: center;
  gap: 3px;
}

.pg-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(155,107,58,0.16);
  background: #FDFAF6;
  color: #9A7858;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Outfit', sans-serif;
}

.pg-btn:hover:not([disabled]) {
  border-color: #C49455;
  color: #9B6B3A;
  background: #EDE0CC;
}

.pg-btn[disabled] {
  opacity: 0.3;
  cursor: default;
}

.pg-btn.cur {
  background: #9B6B3A;
  color: #FDFAF6;
  border-color: #9B6B3A;
  font-weight: 600;
}

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 52px 20px;
  gap: 10px;
  color: #9A7858;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: #EDE0CC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #6B4A30;
}

/* ─── Dialog Buttons ─── */
.btn-cancel-proto {
  background: none;
  border: 1px solid rgba(155,107,58,0.16);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: #9A7858;
  cursor: pointer;
  transition: all 0.12s;
  margin-right: 8px;
}

.btn-cancel-proto:hover {
  border-color: rgba(155,107,58,0.35);
  color: #6B4A30;
}

.btn-danger-proto {
  background: #B84040;
  color: #FDFAF6;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: background 0.12s;
}

.btn-danger-proto:hover {
  background: #c95252;
}
</style>
