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
        <button class="btn-export" @click="exportCustomers()" :disabled="exporting">
          <v-icon size="13" color="#9B6B3A">{{ exporting ? 'mdi-loading mdi-spin' : 'mdi-file-excel-outline' }}</v-icon>
          {{ exporting ? "Exporting..." : "Export Customers" }}
        </button>
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
              <th @click="sortBy('instagram')">Instagram</th>
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
                <span v-if="item.instagram" class="ig-badge">
                  <v-icon size="12">mdi-instagram</v-icon> {{ item.instagram }}
                </span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span class="repeat-badge" :class="item.isRepeatBuyer ? 'r-yes' : 'r-no'">
                  {{ item.isRepeatBuyer ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="text-right">
                <span class="amt-col">₱{{ formatNumber(item.totalPurchases) }}</span>
              </td>
              <td class="text-center">{{ item.purchaseCount || 0 }}</td>
              <td class="dim">{{ formatDate(item.lastPurchaseAt) || 'Never' }}</td>
              <td class="dim">{{ formatDate(item.registeredAt) || '—' }}</td>
              <td>
                <div class="act-btns">
                  <button class="act-btn view-btn" title="View History" @click="viewCustomer(item)">
                    <v-icon size="14">mdi-history</v-icon>
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
              <td colspan="11">
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

    <!-- Purchase History Modal -->
    <v-dialog v-model="dialogView" max-width="720px">
      <v-card v-if="viewData" class="ph-card">
        <!-- Header -->
        <div class="ph-header">
          <div class="ph-avatar">{{ viewData.firstName?.charAt(0) }}{{ viewData.lastName?.charAt(0) }}</div>
          <div class="ph-info">
            <div class="ph-name">{{ viewData.firstName }} {{ viewData.lastName }}</div>
            <div class="ph-meta">
              <span v-if="viewData.customerCode" class="mono">{{ viewData.customerCode }}</span>
              <span v-if="viewData.phone" class="ph-dot">·</span>
              <span v-if="viewData.phone">{{ viewData.phone }}</span>
              <span v-if="viewData.email" class="ph-dot">·</span>
              <span v-if="viewData.email" class="dim">{{ viewData.email }}</span>
              <span v-if="viewData.instagram" class="ph-dot">·</span>
              <span v-if="viewData.instagram" class="dim"><v-icon size="11">mdi-instagram</v-icon> {{ viewData.instagram }}</span>
            </div>
          </div>
          <div class="ph-tier-wrap">
            <div class="ph-tier" :class="getTierClass(viewData.purchaseCount)">
              <v-icon size="13" style="margin-right:4px">{{ getTierIcon(viewData.purchaseCount) }}</v-icon>
              {{ getTierLabel(viewData.purchaseCount) }}
            </div>
            <div v-if="viewData.isRepeatBuyer" class="ph-repeat-tag">
              <v-icon size="11">mdi-repeat</v-icon> Repeat Buyer
            </div>
          </div>
          <button class="ph-close" @click="dialogView = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>

        <!-- Stats Row -->
        <div class="ph-stats">
          <div class="ph-stat">
            <div class="ph-stat-val">₱{{ formatNumber(viewData.totalPurchases) }}</div>
            <div class="ph-stat-lbl">Total Spent</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val">{{ viewData.purchaseCount || 0 }}</div>
            <div class="ph-stat-lbl">Purchases</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val">{{ viewData.purchaseCount > 0 ? '₱' + formatNumber(viewData.totalPurchases / viewData.purchaseCount) : '—' }}</div>
            <div class="ph-stat-lbl">Avg. Order</div>
          </div>
          <div class="ph-stat-div"></div>
          <div class="ph-stat">
            <div class="ph-stat-val">{{ formatDate(viewData.lastPurchaseAt) || 'Never' }}</div>
            <div class="ph-stat-lbl">Last Purchase</div>
          </div>
        </div>

        <!-- Tier Progress -->
        <div class="ph-progress-wrap">
          <div class="ph-progress-label">
            <span>Loyalty Tier</span>
            <span class="dim" style="font-size:11px">{{ viewData.purchaseCount || 0 }} purchase{{ viewData.purchaseCount !== 1 ? 's' : '' }}</span>
          </div>
          <div class="ph-progress-track">
            <div class="ph-progress-fill" :style="{ width: getTierProgress(viewData.purchaseCount) + '%' }" :class="getTierClass(viewData.purchaseCount)"></div>
          </div>
          <div class="ph-tier-labels">
            <span :class="{ active: viewData.purchaseCount >= 0 }">New</span>
            <span :class="{ active: viewData.purchaseCount >= 2 }">Regular</span>
            <span :class="{ active: viewData.purchaseCount >= 5 }">Silver</span>
            <span :class="{ active: viewData.purchaseCount >= 10 }">Gold</span>
          </div>
        </div>

        <!-- Purchase History Table -->
        <div class="ph-history-header">
          <v-icon size="14" color="#9B6B3A">mdi-receipt-text-outline</v-icon>
          Purchase History
          <span class="ph-count-badge" v-if="!loadingSales">{{ customerSales.length }}</span>
        </div>

        <div class="ph-table-wrap">
          <div v-if="loadingSales" class="ph-loading">
            <v-progress-circular indeterminate color="#9B6B3A" size="24" />
            <span>Loading history...</span>
          </div>
          <div v-else-if="customerSales.length === 0" class="ph-empty">
            <v-icon size="28" color="#C4A882">mdi-receipt-text-remove-outline</v-icon>
            <div>No purchase records found</div>
          </div>
          <table v-else class="ph-table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in customerSales" :key="sale.id">
                <td class="mono">{{ sale.saleNumber }}</td>
                <td class="dim">{{ formatDate(sale.saleDate) }}</td>
                <td>{{ sale.branch?.branchName || '—' }}</td>
                <td class="amt-col">₱{{ formatNumber(sale.totalAmount) }}</td>
                <td>₱{{ formatNumber(sale.amountPaid) }}</td>
                <td>
                  <span class="s-badge" :class="'s-' + sale.paymentStatus">
                    {{ sale.paymentStatus }}
                  </span>
                </td>
                <td>
                  <span class="s-badge s-type">{{ sale.saleType }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </v-dialog>

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
import * as XLSX from "xlsx";
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
    exporting: false,
    action: null,
    dialogConfirmDelete: false,
    dialogView: false,
    viewData: null,
    customerSales: [],
    loadingSales: false,
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
          [c.firstName, c.lastName, c.customerCode, c.phone, c.email, c.instagram]
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

    viewCustomer(item) {
      this.viewData = { ...item };
      this.customerSales = [];
      this.dialogView = true;
      this.loadingSales = true;
      this.axiosCall("/sales/customer/" + item.id, "GET")
        .then((res) => {
          if (res && res.data) {
            this.customerSales = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load purchase history:", error);
        })
        .finally(() => {
          this.loadingSales = false;
        });
    },

    getTierLabel(count) {
      if (count >= 10) return "Gold";
      if (count >= 5) return "Silver";
      if (count >= 2) return "Regular";
      return "New";
    },

    getTierClass(count) {
      if (count >= 10) return "tier-gold";
      if (count >= 5) return "tier-silver";
      if (count >= 2) return "tier-regular";
      return "tier-new";
    },

    getTierIcon(count) {
      if (count >= 10) return "mdi-star";
      if (count >= 5) return "mdi-star-half-full";
      if (count >= 2) return "mdi-account-check";
      return "mdi-account-outline";
    },

    getTierProgress(count) {
      if (count >= 10) return 100;
      if (count >= 5) return 75;
      if (count >= 2) return 50;
      if (count >= 1) return 25;
      return 5;
    },

    addNew() {
      this.updateData = { id: null };
      this.action = "Add";
    },

    exportCustomers() {
      if (!this.filteredData.length) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.header = "Nothing to Export";
        this.fadeAwayMessage.message = "There are no customers matching the current filters.";
        return;
      }

      this.exporting = true;
      try {
        const rows = this.filteredData.map((c) => ({
          ID: c.id,
          "Customer Code": c.customerCode || "",
          "First Name": c.firstName || "",
          "Last Name": c.lastName || "",
          Email: c.email || "",
          Phone: c.phone || "",
          Address: c.address || "",
          Instagram: c.instagram || "",
          "Date of Birth": c.dateOfBirth ? this.formatDate(c.dateOfBirth) : "",
          "Repeat Buyer": c.isRepeatBuyer ? "Yes" : "No",
          "Total Purchases": Number(c.totalPurchases || 0),
          Orders: c.purchaseCount || 0,
          "Last Purchase": c.lastPurchaseAt ? this.formatDate(c.lastPurchaseAt) : "",
          Registered: c.registeredAt ? this.formatDate(c.registeredAt) : "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        worksheet["!cols"] = [
          { wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 26 },
          { wch: 16 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
          { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `theia-gems-customers-${today}.xlsx`);

        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "success";
        this.fadeAwayMessage.header = "Export Complete";
        this.fadeAwayMessage.message = `${rows.length} customer record(s) exported successfully.`;
      } catch (error) {
        console.error("Failed to export customers:", error);
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.header = "Error";
        this.fadeAwayMessage.message = "Failed to export customer data";
      } finally {
        this.exporting = false;
      }
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

.btn-export {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #FDFAF6;
  color: #9B6B3A;
  border: 1px solid rgba(155,107,58,0.3);
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: all 0.13s;
}

.btn-export:hover {
  background: #EDE0CC;
  border-color: #9B6B3A;
}

.btn-export[disabled] {
  opacity: 0.6;
  cursor: wait;
}

.ig-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9A7858;
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
  min-width: 980px;
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

/* ─── Purchase History Modal ─── */
.ph-card {
  border-radius: 16px !important;
  border: 1px solid rgba(155,107,58,0.16) !important;
  overflow: hidden;
  background: #FDFAF6 !important;
  font-family: 'Outfit', sans-serif;
}

.ph-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: #F5EFE4;
  border-bottom: 1px solid rgba(155,107,58,0.16);
  position: relative;
}

.ph-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #9B6B3A;
  color: #FDFAF6;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Cormorant Garamond', serif;
}

.ph-info {
  flex: 1;
  min-width: 0;
}

.ph-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: #3A2515;
}

.ph-meta {
  font-size: 12px;
  color: #9A7858;
  margin-top: 2px;
}

.ph-dot {
  margin: 0 5px;
  opacity: 0.5;
}

.ph-tier-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.ph-tier {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.tier-new    { background: rgba(155,107,58,0.1); color: #9A7858; }
.tier-regular{ background: rgba(61,122,90,0.1);  color: #3D7A5A; }
.tier-silver { background: rgba(120,120,140,0.12); color: #5A5A72; }
.tier-gold   { background: rgba(196,148,85,0.15); color: #9B6B3A; }

.ph-repeat-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #3D7A5A;
  background: rgba(61,122,90,0.08);
  padding: 3px 8px;
  border-radius: 20px;
}

.ph-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9A7858;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  transition: all 0.12s;
}

.ph-close:hover {
  background: rgba(155,107,58,0.12);
  color: #6B4A30;
}

.ph-stats {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(155,107,58,0.1);
}

.ph-stat {
  flex: 1;
  text-align: center;
}

.ph-stat-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  color: #3A2515;
}

.ph-stat-lbl {
  font-size: 10px;
  color: #9A7858;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2px;
}

.ph-stat-div {
  width: 1px;
  height: 36px;
  background: rgba(155,107,58,0.16);
}

.ph-progress-wrap {
  padding: 14px 24px;
  border-bottom: 1px solid rgba(155,107,58,0.1);
}

.ph-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9A7858;
  margin-bottom: 7px;
}

.ph-progress-track {
  height: 6px;
  background: #EDE0CC;
  border-radius: 3px;
  overflow: hidden;
}

.ph-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.ph-progress-fill.tier-new     { background: #C4A882; }
.ph-progress-fill.tier-regular { background: #3D7A5A; }
.ph-progress-fill.tier-silver  { background: #7B7B9A; }
.ph-progress-fill.tier-gold    { background: #C49455; }

.ph-tier-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 9px;
  color: #C4A882;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ph-tier-labels span.active {
  color: #9B6B3A;
  font-weight: 600;
}

.ph-history-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 24px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9A7858;
}

.ph-count-badge {
  background: #EDE0CC;
  color: #9B6B3A;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

.ph-table-wrap {
  padding: 0 16px 16px;
  max-height: 280px;
  overflow-y: auto;
}

.ph-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  color: #9A7858;
  font-size: 13px;
}

.ph-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: #C4A882;
  font-size: 13px;
}

.ph-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ph-table thead th {
  text-align: left;
  padding: 8px 10px;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9A7858;
  font-weight: 600;
  background: #F5EFE4;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.ph-table tbody tr {
  border-top: 1px solid rgba(155,107,58,0.1);
}

.ph-table tbody tr:hover {
  background: #EDE0CC;
}

.ph-table tbody td {
  padding: 9px 10px;
  color: #3A2515;
  white-space: nowrap;
}

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
.s-unpaid   { background: rgba(184,64,64,0.1);   color: #B84040; }
.s-refunded { background: rgba(120,120,140,0.12); color: #5A5A72; }
.s-type     { background: rgba(155,107,58,0.08); color: #9A7858; }

.amt-col {
  font-weight: 600;
  color: #9B6B3A;
}
</style>
