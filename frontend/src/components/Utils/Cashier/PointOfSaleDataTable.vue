<template>
  <div class="pos-layout" @click="onOutsideClick">
    <!-- ═══ LEFT: ITEMS LIST ═══ -->
    <div class="pos-left">
      <!-- Header -->
      <div class="pos-hdr">
        <div>
          <div class="pos-ttl">THEIA GEMS POS</div>
          <div class="pos-sub">Sales Terminal</div>
        </div>
        <div class="pos-clk">{{ currentTime }}</div>
      </div>

      <!-- Search Bar -->
      <div class="search-wrap" @click.stop>
        <div class="search-bar">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;color:#9A7858">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input
            ref="searchInput"
            v-model="searchCode"
            class="pos-search-input"
            type="text"
            placeholder="Enter item code or scan barcode..."
            @input="onSearchInput"
            @keyup.enter="addItemByCode"
            @blur="hideItemDropdown"
            autocomplete="off"
          />
          <span v-if="availableItems.length > 0" class="stock-badge">{{ availableItems.length }} available</span>
        </div>
        <div v-if="showDropdown && searchResults.length > 0" class="search-dropdown">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="search-result"
            @mousedown.prevent="addToCart(item)"
          >
            <div class="sr-left">
              <span class="sr-code">{{ item.itemCode }}</span>
              <span class="sr-name">{{ item.brand || item.material || '—' }}</span>
            </div>
            <span class="sr-price">{{ formatCurrency(item.price) }}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="pos-tbl-wrap">
        <table class="pos-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in cartItems" :key="item.id">
              <td>
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">{{ item.code }}<template v-if="item.meta"> · {{ item.meta }}</template></div>
              </td>
              <td class="amt-col">{{ formatCurrency(item.price) }}</td>
              <td><button class="rm-btn" @click="removeItem(idx)">&times;</button></td>
            </tr>
            <tr v-if="cartItems.length === 0">
              <td colspan="3" class="empty-cart">
                <div class="empty-cart-icon">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                    <path d="M1 1h2l1.5 8h8L14 3H4" stroke="#9A7858" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="6" cy="13" r="1.5" stroke="#9A7858" stroke-width="1.2"/>
                    <circle cx="11" cy="13" r="1.5" stroke="#9A7858" stroke-width="1.2"/>
                  </svg>
                </div>
                No items added yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="pos-foot">
        <span>Items: <strong>{{ cartItems.length }}</strong></span>
        <span>Subtotal: <strong>{{ formatCurrency(subtotal) }}</strong></span>
      </div>
    </div>

    <!-- ═══ RIGHT: PAYMENT PANEL ═══ -->
    <div class="pay-card" @click.stop>
      <!-- Payment Type Tabs -->
      <div class="pay-type-tabs">
        <button class="pay-type-tab" :class="{ active: payMode === 'full' }" @click="payMode = 'full'; errorMsg = ''">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M2 4h12M2 12h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          Full Payment
        </button>
        <button class="pay-type-tab" :class="{ active: payMode === 'install' }" @click="payMode = 'install'; errorMsg = ''">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 7h14M5 7v6" stroke="currentColor" stroke-width="1.3"/></svg>
          Installment
        </button>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="pos-error">{{ errorMsg }}</div>

      <!-- ── FULL PAYMENT ── -->
      <div v-if="payMode === 'full'" class="pay-form">
        <div class="fld-lbl">Sales Channel</div>
        <div class="channel-tabs">
          <button class="channel-tab" :class="{ sel: salesChannel === 'walk_in' }" @click="salesChannel = 'walk_in'">
            <v-icon size="13">mdi-store-outline</v-icon> Walk-in
          </button>
          <button class="channel-tab" :class="{ sel: salesChannel === 'ig' }" @click="salesChannel = 'ig'">
            <v-icon size="13">mdi-instagram</v-icon> Instagram
          </button>
          <button class="channel-tab" :class="{ sel: salesChannel === 'website' }" @click="salesChannel = 'website'">
            <v-icon size="13">mdi-web</v-icon> Website
          </button>
        </div>

        <div class="fld-lbl" style="margin-top:12px">Customer (optional)</div>
        <div class="cust-wrap" @click.stop>
          <input
            v-model="fullCustSearch"
            class="fld-inp"
            type="text"
            placeholder="Search customer..."
            @input="searchCustomersFull"
            @blur="hideFullCustDropdown"
            autocomplete="off"
            style="margin-bottom:0"
          />
          <div v-if="showFullCustDropdown && fullCustResults.length > 0" class="cust-dropdown">
            <div
              v-for="c in fullCustResults"
              :key="c.id"
              class="cust-result"
              @mousedown.prevent="selectFullCustomer(c)"
            >
              <span>{{ c.firstName }} {{ c.lastName }}</span>
              <span class="cust-sub">{{ c.phone || c.email || '' }}</span>
            </div>
          </div>
        </div>

        <div class="fld-lbl" style="margin-top:12px">
          Discount Amount
          <span class="fld-lbl-hint">(max {{ formatCurrency(MAX_DISCOUNT_AMOUNT) }})</span>
        </div>
        <input
          v-model.number="discountAmount"
          class="fld-inp"
          type="number"
          placeholder="0.00"
          min="0"
          :max="MAX_DISCOUNT_AMOUNT"
          @input="onDiscountInput"
        />
        <div v-if="discountCapped" class="discount-warn">
          Discount capped at {{ formatCurrency(MAX_DISCOUNT_AMOUNT) }}.
        </div>

        <div class="pay-divider"></div>

        <div class="brk-row"><span>Subtotal</span><span class="brk-val">{{ formatCurrency(subtotal) }}</span></div>
        <div class="brk-row"><span>Discount</span><span class="brk-discount">- {{ formatCurrency(discountAmount || 0) }}</span></div>

        <div class="grand-row">
          <div class="grand-lbl">GRAND TOTAL</div>
          <div class="grand-amt">{{ formatCurrency(grandTotal) }}</div>
        </div>

        <div class="pay-section">
          <div class="fld-lbl">Payment Method</div>
          <div class="pay-meths">
            <button class="pay-meth" :class="{ sel: payMethod === 'cash' }" @click="payMethod = 'cash'">Cash</button>
            <button class="pay-meth" :class="{ sel: payMethod === 'gcash' }" @click="payMethod = 'gcash'">GCash</button>
            <button class="pay-meth" :class="{ sel: payMethod === 'bank_transfer' }" @click="payMethod = 'bank_transfer'">Bank Transfer</button>
            <button class="pay-meth" :class="{ sel: payMethod === 'check' }" @click="payMethod = 'check'">Cheque</button>
          </div>
        </div>

        <div class="pay-section">
          <div class="fld-lbl">Amount Tendered</div>
          <input v-model.number="amountTendered" class="fld-inp" type="number" placeholder="0.00" min="0" />
        </div>

        <div v-if="change > 0" class="change-row">
          <span>Change</span>
          <span class="change-amt">{{ formatCurrency(change) }}</span>
        </div>

        <button class="btn-charge" @click="processCharge" :disabled="loading || cartItems.length === 0">
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Processing...' : 'CHARGE ' + formatCurrency(grandTotal) }}
        </button>
        <button class="btn-ghost" @click="clearCart" :disabled="loading">Clear</button>
      </div>

      <!-- ── INSTALLMENT ── -->
      <div v-if="payMode === 'install'" class="pay-form">
        <div class="fld-lbl">Sales Channel</div>
        <div class="channel-tabs">
          <button class="channel-tab" :class="{ sel: salesChannel === 'walk_in' }" @click="salesChannel = 'walk_in'">
            <v-icon size="13">mdi-store-outline</v-icon> Walk-in
          </button>
          <button class="channel-tab" :class="{ sel: salesChannel === 'ig' }" @click="salesChannel = 'ig'">
            <v-icon size="13">mdi-instagram</v-icon> Instagram
          </button>
          <button class="channel-tab" :class="{ sel: salesChannel === 'website' }" @click="salesChannel = 'website'">
            <v-icon size="13">mdi-web</v-icon> Website
          </button>
        </div>

        <div class="install-notice" style="margin-top:12px">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Customer information is required for installment purchases.
        </div>

        <div class="fld-lbl">Customer <span class="req">*</span></div>
        <div class="cust-wrap" @click.stop>
          <input
            v-model="instCustomer"
            class="fld-inp"
            type="text"
            placeholder="Search or enter customer name..."
            @input="searchCustomers"
            @blur="hideCustDropdown"
            autocomplete="off"
            style="margin-bottom:0"
          />
          <div v-if="showCustomerDropdown && customerResults.length > 0" class="cust-dropdown">
            <div
              v-for="c in customerResults"
              :key="c.id"
              class="cust-result"
              @mousedown.prevent="selectCustomer(c)"
            >
              <span>{{ c.firstName }} {{ c.lastName }}</span>
              <span class="cust-sub">{{ c.phone || c.email || '' }}</span>
            </div>
          </div>
        </div>

        <div class="grid-2" style="margin-top:10px">
          <div>
            <div class="fld-lbl">Contact No. <span class="req">*</span></div>
            <input v-model="instPhone" class="fld-inp" type="text" placeholder="+63 9XX XXX XXXX" />
          </div>
          <div>
            <div class="fld-lbl">Valid ID Type</div>
            <select v-model="instIdType" class="fld-inp">
              <option value="">Select ID</option>
              <option>PhilSys ID</option>
              <option>Driver's License</option>
              <option>Passport</option>
              <option>SSS / GSIS</option>
              <option>Postal ID</option>
            </select>
          </div>
        </div>

        <div class="fld-lbl">Address</div>
        <input v-model="instAddress" class="fld-inp" type="text" placeholder="Street, City, Province" />

        <div class="pay-divider"></div>

        <div class="brk-row"><span>Total Amount</span><span class="brk-val">{{ formatCurrency(grandTotal) }}</span></div>

        <div class="grid-2" style="margin-top:10px">
          <div>
            <div class="fld-lbl">Down Payment <span class="req">*</span></div>
            <input v-model.number="instDP" class="fld-inp" type="number" placeholder="0.00" />
          </div>
          <div>
            <div class="fld-lbl">Term (months) <span class="req">*</span></div>
            <select v-model.number="instTerm" class="fld-inp">
              <option value="">Select</option>
              <option :value="3">3 months</option>
              <option :value="6">6 months</option>
              <option :value="12">12 months</option>
              <option :value="18">18 months</option>
              <option :value="24">24 months</option>
            </select>
          </div>
        </div>

        <div class="grid-2" style="margin-top:10px">
          <div>
            <div class="fld-lbl">Interest Rate (%)</div>
            <input v-model.number="instRate" class="fld-inp" type="number" placeholder="e.g. 5" />
          </div>
          <div>
            <div class="fld-lbl">Payment Method</div>
            <select v-model="instPayMethod" class="fld-inp">
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="gcash">GCash</option>
            </select>
          </div>
        </div>

        <div v-if="instDP && instTerm" class="install-summary">
          <div class="inst-sum-row"><span>Balance after DP</span><span>{{ formatCurrency(instBalance) }}</span></div>
          <div class="inst-sum-row"><span>Total with Interest</span><span>{{ formatCurrency(instTotalWithInterest) }}</span></div>
          <div class="inst-sum-row highlight"><span>Monthly Payment</span><span>{{ formatCurrency(instMonthly) }}</span></div>
        </div>

        <div class="fld-lbl" style="margin-top:12px">Notes / Remarks</div>
        <input v-model="instNotes" class="fld-inp" type="text" placeholder="Optional notes..." />

        <button class="btn-charge btn-install" @click="processInstallment" :disabled="loading || cartItems.length === 0">
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Processing...' : 'CONFIRM INSTALLMENT' }}
        </button>
        <button class="btn-ghost" @click="clearCart" :disabled="loading">Clear</button>
      </div>
    </div>

    <!-- ═══ RECEIPT MODAL ═══ -->
    <div v-if="showReceipt" class="receipt-overlay">
      <div class="receipt-modal">
        <div class="receipt-hdr">
          <div class="receipt-brand">THEIA GEMS</div>
          <div class="receipt-sub">Official Receipt</div>
          <div class="receipt-num">{{ receiptData.receiptNumber }}</div>
          <div class="receipt-sale-num">{{ receiptData.saleNumber }}</div>
          <div v-if="receiptData.customerName" class="receipt-cust">{{ receiptData.customerName }}</div>
          <div class="receipt-date">{{ receiptData.saleDate }}</div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-items">
          <div v-for="item in receiptData.items" :key="item.id" class="receipt-item">
            <div class="ri-left">
              <div class="ri-name">{{ item.name }}</div>
              <div class="ri-code">{{ item.code }}</div>
            </div>
            <div class="ri-price">{{ formatCurrency(item.price) }}</div>
          </div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-break">
          <div class="rb-row"><span>Subtotal</span><span>{{ formatCurrency(receiptData.subtotal) }}</span></div>
          <div v-if="receiptData.discountAmount > 0" class="rb-row">
            <span>Discount</span><span class="rb-disc">- {{ formatCurrency(receiptData.discountAmount) }}</span>
          </div>
          <div v-if="receiptData.taxAmount > 0" class="rb-row">
            <span>VAT (12%)</span><span>{{ formatCurrency(receiptData.taxAmount) }}</span>
          </div>
        </div>

        <div class="receipt-total-row">
          <span>TOTAL</span>
          <span>{{ formatCurrency(receiptData.totalAmount) }}</span>
        </div>

        <div class="receipt-pay-info">
          <template v-if="receiptData.type === 'full'">
            <div class="rb-row"><span>Amount Paid</span><span>{{ formatCurrency(receiptData.amountPaid) }}</span></div>
            <div v-if="receiptData.change > 0" class="rb-row">
              <span>Change</span><span>{{ formatCurrency(receiptData.change) }}</span>
            </div>
            <div class="rb-row"><span>Method</span><span style="text-transform:capitalize">{{ receiptData.paymentMethod }}</span></div>
          </template>
          <template v-if="receiptData.type === 'installment'">
            <div class="rb-row"><span>Down Payment</span><span>{{ formatCurrency(receiptData.amountPaid) }}</span></div>
            <div class="rb-row">
              <span>Monthly (×{{ receiptData.term }})</span>
              <span>{{ formatCurrency(receiptData.monthlyPayment) }}</span>
            </div>
          </template>
        </div>

        <div class="receipt-actions">
          <button class="btn-ghost" style="margin-top:0;flex:1" @click="closeReceipt">Close</button>
          <button class="btn-print-rcpt" @click="printReceipt">
            <v-icon size="14" style="margin-right:5px">mdi-printer-outline</v-icon>Print
          </button>
          <button class="btn-charge" style="margin-top:0;flex:1" @click="closeReceipt">New Sale</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PointOfSaleDataTable",
  data() {
    return {
      currentTime: "--:--",
      timeInterval: null,

      searchCode: "",
      availableItems: [],
      searchResults: [],
      showDropdown: false,
      cartItems: [],

      payMode: "full",
      salesChannel: "walk_in",
      discountAmount: 0,
      discountCapped: false,
      payMethod: "cash",
      amountTendered: null,
      fullCustSearch: "",
      fullCustObj: null,
      fullCustResults: [],
      showFullCustDropdown: false,
      fullCustTimer: null,

      instCustomer: "",
      instCustomerObj: null,
      instPhone: "",
      instIdType: "",
      instAddress: "",
      instDP: null,
      instTerm: null,
      instRate: 0,
      instPayMethod: "cash",
      instNotes: "",
      customerResults: [],
      showCustomerDropdown: false,
      custTimer: null,

      loading: false,
      errorMsg: "",

      showReceipt: false,
      receiptData: null,
    };
  },
  computed: {
    branchId() {
      return Number(this.$store.state.user?.branchId) || null;
    },
    cashierId() {
      return Number(this.$store.state.user?.userID || this.$store.state.user?.id);
    },
    subtotal() {
      return this.cartItems.reduce((s, i) => s + Number(i.price), 0);
    },
    grandTotal() {
      return this.subtotal - (this.discountAmount || 0);
    },
    change() {
      return Math.max(0, (this.amountTendered || 0) - this.grandTotal);
    },
    instBalance() {
      return Math.max(0, this.grandTotal - (this.instDP || 0));
    },
    instTotalWithInterest() {
      return this.instBalance * (1 + (this.instRate || 0) / 100);
    },
    instMonthly() {
      return this.instTerm ? this.instTotalWithInterest / this.instTerm : 0;
    },
  },
  mounted() {
    this.updateClock();
    this.timeInterval = setInterval(this.updateClock, 1000);
    this.loadAvailableItems();
    this.$nextTick(() => this.focusSearch());
    this._scanListener = this.handleGlobalKey;
    window.addEventListener('keydown', this._scanListener);
  },
  beforeUnmount() {
    clearInterval(this.timeInterval);
    clearTimeout(this.custTimer);
    clearTimeout(this.fullCustTimer);
    window.removeEventListener('keydown', this._scanListener);
  },
  methods: {
    focusSearch() {
      this.$refs.searchInput?.focus();
    },

    handleGlobalKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      this.focusSearch();
    },

    onDiscountInput() {
      const clamped = this.clampDiscount(this.discountAmount);
      this.discountCapped = Number(this.discountAmount) > this.MAX_DISCOUNT_AMOUNT;
      this.discountAmount = clamped;
    },

    updateClock() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    },
    formatCurrency(val) {
      if (!val && val !== 0) return "₱0.00";
      return (
        "₱" +
        Number(val).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    },
    onOutsideClick() {
      this.showDropdown = false;
      this.showCustomerDropdown = false;
      this.showFullCustDropdown = false;
    },
    hideItemDropdown() {
      window.setTimeout(() => { this.showDropdown = false; }, 150);
    },
    hideCustDropdown() {
      window.setTimeout(() => { this.showCustomerDropdown = false; }, 150);
    },
    hideFullCustDropdown() {
      window.setTimeout(() => { this.showFullCustDropdown = false; }, 150);
    },

    // ── ITEMS ──
    normalizeCode(raw) {
      // Strip common scanner prefixes like "S/N:", "s/n:", "SN:", then trim
      return (raw || "").replace(/^s\/?n[:\s]+/i, "").trim().toLowerCase();
    },
    async loadAvailableItems() {
      if (!this.branchId) return;
      try {
        const [stockRes, consignRes] = await Promise.all([
          this.axiosCall("/jewelry-items?branchId=" + this.branchId + "&status=IN_STOCK", "GET").catch(() => null),
          this.axiosCall("/consignment-items", "GET").catch(() => null),
        ]);
        const stockItems = stockRes?.data || [];
        const consignItems = (consignRes?.data || [])
          .filter((ci) => ci.status === "active" && ci.isAuthentic === true && ci.branchId === this.branchId && ci.jewelryItem)
          .map((ci) => ({ ...ci.jewelryItem, price: Number(ci.sellingPrice) || Number(ci.jewelryItem.price) }));
        const cartIds = new Set(this.cartItems.map((c) => c.id));
        this.availableItems = [...stockItems, ...consignItems].filter((i) => !cartIds.has(i.id));
      } catch (_) { /* ignore */ }
    },
    onSearchInput() {
      const q = this.normalizeCode(this.searchCode);
      if (!q) {
        this.showDropdown = false;
        this.searchResults = [];
        return;
      }
      this.searchResults = this.availableItems
        .filter(
          (i) =>
            (i.itemCode || "").toLowerCase().includes(q) ||
            (i.barcode || "").toLowerCase().includes(q) ||
            (i.brand || "").toLowerCase().includes(q)
        )
        .slice(0, 6);
      this.showDropdown = this.searchResults.length > 0;
    },
    async addItemByCode() {
      const raw = this.searchCode.trim();
      if (!raw) return;
      const q = this.normalizeCode(raw);

      // 1. Try exact match in pre-loaded list
      const exact = this.availableItems.find(
        (i) =>
          (i.itemCode || "").toLowerCase() === q ||
          (i.barcode || "").toLowerCase() === q
      );
      if (exact) { this.addToCart(exact); return; }

      // 2. Try first result from the live filter
      if (this.searchResults.length > 0) { this.addToCart(this.searchResults[0]); return; }

      // 3. Direct API fallback — reload cache then search
      if (!this.branchId) { this.searchCode = ""; return; }
      try {
        await this.loadAvailableItems();
        const match = this.availableItems.find(
          (i) =>
            (i.itemCode || "").toLowerCase() === q ||
            (i.barcode || "").toLowerCase() === q ||
            (i.itemCode || "").toLowerCase().includes(q) ||
            (i.barcode || "").toLowerCase().includes(q)
        );
        if (match) {
          this.addToCart(match);
        } else {
          this.errorMsg = "Item not found: " + raw;
          this.searchCode = "";
          this.$nextTick(() => this.focusSearch());
        }
      } catch {
        this.errorMsg = "Failed to look up item. Please try again.";
        this.searchCode = "";
        this.$nextTick(() => this.focusSearch());
      }
    },
    addToCart(item) {
      if (this.cartItems.find((c) => c.id === item.id)) {
        this.searchCode = "";
        this.showDropdown = false;
        return;
      }
      const name =
        item.brand ||
        item.jewelryType?.type ||
        item.category?.categoryName ||
        item.itemCode;
      const metaParts = [
        item.material,
        item.carat,
        item.category?.categoryName,
      ].filter(Boolean);
      this.cartItems.push({
        id: item.id,
        name,
        code: item.itemCode,
        meta: metaParts.join(" · "),
        price: Number(item.price) || 0,
        cost: Number(item.cost) || 0,
        isJewelry: !!(item.jewelryTypeId || item.stoneTypeId || item.designModelId),
        stoneName: item.stoneType?.name || null,
        modelName: item.designModel?.modelName || null,
        brand: item.brand || null,
        description: item.description || null,
      });
      this.availableItems = this.availableItems.filter((i) => i.id !== item.id);
      this.searchCode = "";
      this.showDropdown = false;
      this.$nextTick(() => this.focusSearch());
    },
    removeItem(idx) {
      this.cartItems.splice(idx, 1);
    },

    // ── CUSTOMER SEARCH ──
    searchCustomers() {
      clearTimeout(this.custTimer);
      this.instCustomerObj = null;
      const q = this.instCustomer.trim();
      if (q.length < 2) {
        this.customerResults = [];
        this.showCustomerDropdown = false;
        return;
      }
      this.custTimer = setTimeout(() => {
        this.axiosCall("/customers/search?q=" + encodeURIComponent(q), "GET")
          .then((res) => {
            this.customerResults = res?.data || [];
            this.showCustomerDropdown = this.customerResults.length > 0;
          })
          .catch(() => {});
      }, 300);
    },
    selectCustomer(c) {
      this.instCustomerObj = c;
      this.instCustomer = `${c.firstName} ${c.lastName}`;
      this.instPhone = c.phone || this.instPhone;
      this.instAddress = c.address || this.instAddress;
      this.showCustomerDropdown = false;
    },
    searchCustomersFull() {
      clearTimeout(this.fullCustTimer);
      this.fullCustObj = null;
      const q = this.fullCustSearch.trim();
      if (q.length < 2) {
        this.fullCustResults = [];
        this.showFullCustDropdown = false;
        return;
      }
      this.fullCustTimer = setTimeout(() => {
        this.axiosCall("/customers/search?q=" + encodeURIComponent(q), "GET")
          .then((res) => {
            this.fullCustResults = res?.data || [];
            this.showFullCustDropdown = this.fullCustResults.length > 0;
          })
          .catch(() => {});
      }, 300);
    },
    selectFullCustomer(c) {
      this.fullCustObj = c;
      this.fullCustSearch = `${c.firstName} ${c.lastName}`;
      this.showFullCustDropdown = false;
    },

    mapPayMethod(m) {
      return m;
    },

    // ── FULL PAYMENT ──
    async processCharge() {
      this.errorMsg = "";
      if (this.cartItems.length === 0) {
        this.errorMsg = "Cart is empty.";
        return;
      }
      if (!this.amountTendered || this.amountTendered < this.grandTotal) {
        this.errorMsg = "Amount tendered must be at least the grand total.";
        return;
      }
      this.loading = true;
      try {
        const saleNumRes = await this.axiosCall("/sales/generate-number", "GET");
        const saleNumber = saleNumRes.data;

        const saleRes = await this.axiosCall("/sales", "POST", {
          saleNumber,
          branchId: this.branchId,
          customerId: this.fullCustObj?.id || undefined,
          cashierId: this.cashierId,
          subtotal: this.subtotal,
          discountAmount: this.discountAmount || 0,
          taxAmount: 0,
          totalAmount: this.grandTotal,
          amountPaid: this.amountTendered,
          changeAmount: this.change,
          paymentStatus: "paid",
          saleType: "regular",
          salesChannel: this.salesChannel,
        });
        const saleId = saleRes.data.id;

        // Create sale items for item-level reporting
        for (const item of this.cartItems) {
          const lineTotal = item.price;
          const grossMargin = item.cost ? lineTotal - item.cost : null;
          await this.axiosCall("/sale-items", "POST", {
            saleId,
            jewelryItemId: item.id,
            unitPrice: item.price,
            unitCost: item.cost || null,
            discountAmount: 0,
            lineTotal,
            grossMargin,
          });
        }

        const payNumRes = await this.axiosCall("/payments/generate-number", "GET");
        await this.axiosCall("/payments", "POST", {
          paymentNumber: payNumRes.data,
          saleId,
          receivedBy: this.cashierId,
          amount: this.grandTotal,
          paymentMethod: this.mapPayMethod(this.payMethod),
          paymentType: "full",
          paymentDate: new Date().toISOString(),
        });

        for (const item of this.cartItems) {
          await this.axiosCall("/jewelry-items/" + item.id, "PATCH", {
            status: "SOLD",
            saleDate: new Date().toISOString().split("T")[0],
          });
        }

        if (this.fullCustObj?.id) {
          await this.axiosCall(
            "/customers/" + this.fullCustObj.id + "/purchase",
            "PATCH",
            { amount: this.grandTotal }
          );
        }

        const rcptNumRes = await this.axiosCall("/receipts/generate-number", "GET");
        const rcptRes = await this.axiosCall("/receipts", "POST", {
          saleId,
          receiptNumber: rcptNumRes.data,
          branchId: this.branchId,
          printedBy: this.cashierId,
        });

        this.receiptData = {
          receiptNumber: rcptRes.data.receiptNumber,
          saleNumber,
          saleDate: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
          customerName: this.fullCustObj ? `${this.fullCustObj.firstName} ${this.fullCustObj.lastName}` : null,
          items: [...this.cartItems],
          subtotal: this.subtotal,
          discountAmount: this.discountAmount || 0,
          taxAmount: 0,
          totalAmount: this.grandTotal,
          amountPaid: this.amountTendered,
          change: this.change,
          paymentMethod: this.payMethod,
          type: "full",
        };
        this.showReceipt = true;
        this.clearCart();
        this.loadAvailableItems();
        this.$nextTick(() => this.focusSearch());
      } catch (e) {
        this.errorMsg =
          e?.response?.data?.message || "Failed to process sale. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    // ── INSTALLMENT ──
    async processInstallment() {
      this.errorMsg = "";
      if (this.cartItems.length === 0) { this.errorMsg = "Cart is empty."; return; }
      if (!this.instCustomer.trim()) { this.errorMsg = "Customer name is required."; return; }
      if (!this.instPhone.trim()) { this.errorMsg = "Contact number is required."; return; }
      if (!this.instDP || this.instDP <= 0) { this.errorMsg = "Down payment is required."; return; }
      if (!this.instTerm) { this.errorMsg = "Payment term is required."; return; }

      this.loading = true;
      try {
        let customerId = this.instCustomerObj?.id;
        if (!customerId) {
          const parts = this.instCustomer.trim().split(/\s+/);
          const lastName = parts.length > 1 ? parts.pop() : "";
          const firstName = parts.join(" ") || lastName;
          const custCodeRes = await this.axiosCall("/customers/generate-code", "GET");
          const newCustRes = await this.axiosCall("/customers", "POST", {
            customerCode: custCodeRes.data,
            firstName,
            lastName,
            phone: this.instPhone,
            address: this.instAddress || undefined,
          });
          customerId = newCustRes.data.id;
        }

        const saleNumRes = await this.axiosCall("/sales/generate-number", "GET");
        const saleNumber = saleNumRes.data;

        const installTotal = this.grandTotal;

        const saleRes = await this.axiosCall("/sales", "POST", {
          saleNumber,
          branchId: this.branchId,
          customerId,
          cashierId: this.cashierId,
          subtotal: this.subtotal,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: installTotal,
          amountPaid: this.instDP,
          changeAmount: 0,
          paymentStatus: "layaway",
          saleType: "layaway",
          salesChannel: this.salesChannel,
          notes: this.instNotes || undefined,
        });
        const saleId = saleRes.data.id;

        // Create sale items for item-level reporting
        for (const item of this.cartItems) {
          const lineTotal = item.price;
          const grossMargin = item.cost ? lineTotal - item.cost : null;
          await this.axiosCall("/sale-items", "POST", {
            saleId,
            jewelryItemId: item.id,
            unitPrice: item.price,
            unitCost: item.cost || null,
            discountAmount: 0,
            lineTotal,
            grossMargin,
          });
        }

        const payNumRes = await this.axiosCall("/payments/generate-number", "GET");
        await this.axiosCall("/payments", "POST", {
          paymentNumber: payNumRes.data,
          saleId,
          receivedBy: this.cashierId,
          amount: this.instDP,
          paymentMethod: this.instPayMethod,
          paymentType: "deposit",
          paymentDate: new Date().toISOString(),
          notes: "Down payment",
        });

        const planNumRes = await this.axiosCall("/layaway-plans/generate-number", "GET");
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + this.instTerm);
        const nextDate = new Date(today);
        nextDate.setMonth(nextDate.getMonth() + 1);

        const balance = Math.max(0, installTotal - this.instDP);
        const totalWithInterest = balance * (1 + (this.instRate || 0) / 100);
        const monthly = this.instTerm ? totalWithInterest / this.instTerm : 0;

        await this.axiosCall("/layaway-plans", "POST", {
          planNumber: planNumRes.data,
          saleId,
          customerId,
          branchId: this.branchId,
          totalAmount: installTotal,
          downPayment: this.instDP,
          remainingBalance: totalWithInterest,
          monthlyPayment: monthly,
          numberOfPayments: this.instTerm,
          startDate: today.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          nextPaymentDate: nextDate.toISOString().split("T")[0],
          notes: this.instNotes || undefined,
        });

        for (const item of this.cartItems) {
          await this.axiosCall("/jewelry-items/" + item.id, "PATCH", { status: "LAYAWAY" });
        }

        await this.axiosCall("/customers/" + customerId + "/purchase", "PATCH", {
          amount: installTotal,
        });

        const rcptNumRes = await this.axiosCall("/receipts/generate-number", "GET");
        const rcptRes = await this.axiosCall("/receipts", "POST", {
          saleId,
          receiptNumber: rcptNumRes.data,
          branchId: this.branchId,
          printedBy: this.cashierId,
        });

        this.receiptData = {
          receiptNumber: rcptRes.data.receiptNumber,
          saleNumber,
          saleDate: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
          customerName: this.instCustomer.trim() || null,
          items: [...this.cartItems],
          subtotal: this.subtotal,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: installTotal,
          amountPaid: this.instDP,
          change: 0,
          type: "installment",
          monthlyPayment: monthly,
          term: this.instTerm,
          paymentMethod: this.instPayMethod,
        };
        this.showReceipt = true;
        this.clearCart();
        this.loadAvailableItems();
      } catch (e) {
        this.errorMsg =
          e?.response?.data?.message ||
          "Failed to process installment. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    clearCart() {
      this.cartItems = [];
      this.salesChannel = "walk_in";
      this.discountAmount = 0;
      this.discountCapped = false;
      this.payMethod = "cash";
      this.amountTendered = null;
      this.fullCustSearch = "";
      this.fullCustObj = null;
      this.instCustomer = "";
      this.instCustomerObj = null;
      this.instPhone = "";
      this.instIdType = "";
      this.instAddress = "";
      this.instDP = null;
      this.instTerm = null;
      this.instRate = 0;
      this.instPayMethod = "cash";
      this.instNotes = "";
      this.errorMsg = "";
    },

    closeReceipt() {
      this.showReceipt = false;
      this.receiptData = null;
    },

    printReceipt() {
      const r = this.receiptData;
      if (!r) return;
      const fmt = (v) =>
        "₱" + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const itemLines = r.items.map((item) => {
        let details = "";
        if (item.isJewelry) {
          details = [item.stoneName, item.modelName].filter(Boolean).join(" · ");
        } else {
          details = [item.brand, item.description ? item.description.substring(0, 40) : ""].filter(Boolean).join(" · ");
        }
        return `<div class="row"><span class="iname">${item.name || ""}</span><span class="iprice">${fmt(item.price)}</span></div>` +
          `<div class="icode">${item.code || ""}</div>` +
          (details ? `<div class="icode" style="margin-bottom:4px">${details}</div>` : "");
      }).join("");

      let payLines = "";
      if (r.type === "full") {
        payLines += `<div class="row"><span>Amount Paid</span><span>${fmt(r.amountPaid)}</span></div>`;
        if (r.change > 0) payLines += `<div class="row"><span>Change</span><span>${fmt(r.change)}</span></div>`;
        payLines += `<div class="row"><span>Method</span><span style="text-transform:capitalize">${r.paymentMethod}</span></div>`;
      } else {
        payLines += `<div class="row"><span>Down Payment</span><span>${fmt(r.amountPaid)}</span></div>`;
        payLines += `<div class="row"><span>Monthly ×${r.term}</span><span>${fmt(r.monthlyPayment)}</span></div>`;
        if (r.paymentMethod) payLines += `<div class="row"><span>Method</span><span style="text-transform:capitalize">${r.paymentMethod.replace("_", " ")}</span></div>`;
        payLines += `<div class="row bold"><span>INSTALLMENT PLAN</span></div>`;
      }

      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><title>Receipt ${r.receiptNumber}</title>
<style>
  @page { size: 80mm auto; margin: 4mm 3mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; width: 74mm; }
  .center { text-align: center; }
  .brand { font-size: 17px; font-weight: bold; letter-spacing: 5px; margin-bottom: 1px; }
  .sub { font-size: 9px; letter-spacing: 3px; margin-bottom: 2px; }
  .meta { font-size: 10px; margin: 2px 0; }
  .hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  .hrs { border: none; border-top: 1px solid #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
  .iname { flex: 1; padding-right: 6px; overflow: hidden; }
  .iprice { white-space: nowrap; font-weight: bold; }
  .icode { font-size: 9px; color: #444; padding-left: 4px; margin-bottom: 3px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 4px 0; }
  .bold { font-weight: bold; }
  .footer { text-align: center; margin-top: 10px; font-size: 9px; line-height: 1.6; }
</style>
</head><body>
<div class="center">
  <div class="brand">THEIA GEMS</div>
  <div class="sub">FINE JEWELRY</div>
</div>
<hr class="hrs">
<div class="meta">Receipt: <b>${r.receiptNumber}</b></div>
<div class="meta">Sale No: ${r.saleNumber}</div>
<div class="meta">Date: ${r.saleDate || ""}</div>
${r.customerName ? `<div class="meta">Customer: ${r.customerName}</div>` : ""}
<hr class="hr">
${itemLines}
<hr class="hr">
<div class="row"><span>Subtotal</span><span>${fmt(r.subtotal)}</span></div>
${r.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${fmt(r.discountAmount)}</span></div>` : ""}
<hr class="hrs">
<div class="total-row"><span>TOTAL</span><span>${fmt(r.totalAmount)}</span></div>
<hr class="hr">
${payLines}
<hr class="hrs">
<div class="footer">
  <div>Thank you for your purchase!</div>
  <div>Please come again.</div>
  <div style="margin-top:4px;font-size:8px">This serves as your official receipt.</div>
</div>
</body></html>`;

      const win = window.open("", "_blank", "width=340,height=700,toolbar=0,menubar=0,scrollbars=1");
      if (!win) { alert("Please allow popups to print receipts."); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.onafterprint = () => win.close();
      }, 250);
    },
  },
};
</script>

<style scoped>
/* ─── LAYOUT ─── */
.pos-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  height: 100%;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
}

/* ─── LEFT PANEL ─── */
.pos-left {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(80,30,10,0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pos-hdr {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pos-ttl {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: #9B6B3A;
  letter-spacing: 0.06em;
}

.pos-sub {
  font-size: 11px;
  color: #9A7858;
  margin-top: 1px;
}

.pos-clk {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 300;
  color: #3A2515;
}

/* ─── Search ─── */
.search-wrap {
  position: relative;
  border-bottom: 1px solid rgba(155,107,58,0.16);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 20px;
}

.pos-search-input {
  flex: 1;
  background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  outline: none;
  transition: border-color 0.13s;
}
.pos-search-input::placeholder { color: #9A7858; }
.pos-search-input:focus { border-color: #9B6B3A; }

.stock-badge {
  font-size: 10px;
  color: #3D7A5A;
  background: rgba(61,122,90,0.1);
  border: 1px solid rgba(61,122,90,0.2);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.2);
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 14px rgba(80,30,10,0.12);
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
}

.search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(155,107,58,0.1);
  transition: background 0.1s;
}
.search-result:last-child { border-bottom: none; }
.search-result:hover { background: #F5EFE4; }

.sr-left { display: flex; flex-direction: column; }
.sr-code { font-size: 12px; font-weight: 600; color: #9B6B3A; font-family: monospace; }
.sr-name { font-size: 11px; color: #9A7858; margin-top: 1px; }
.sr-price { font-size: 12px; font-weight: 600; color: #3A2515; }

/* ─── Table ─── */
.pos-tbl-wrap {
  flex: 1;
  overflow-y: auto;
}

.pos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.pos-table thead th {
  text-align: left;
  padding: 9px 20px;
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #9A7858;
  font-weight: 500;
  background: #F5EFE4;
}

.pos-table tbody tr {
  border-top: 1px solid rgba(155,107,58,0.16);
  transition: background 0.1s;
}
.pos-table tbody tr:hover { background: #EDE0CC; }
.pos-table tbody td { padding: 12px 20px; color: #3A2515; }

.item-name { font-weight: 500; }
.item-meta { font-size: 11px; color: #9A7858; }
.amt-col { color: #9B6B3A; font-weight: 600; }

.empty-cart {
  text-align: center;
  padding: 40px 20px !important;
  color: #9A7858;
  font-size: 13px;
}
.empty-cart-icon { margin-bottom: 8px; }

.rm-btn {
  background: none; border: none; color: #9A7858;
  cursor: pointer; font-size: 18px; padding: 2px 6px;
  transition: color 0.11s;
}
.rm-btn:hover { color: #B84040; }

/* ─── Footer ─── */
.pos-foot {
  padding: 11px 20px;
  border-top: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #9A7858;
}
.pos-foot strong { color: #3A2515; }

/* ─── RIGHT: PAYMENT PANEL ─── */
.pay-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(80,30,10,0.07);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
}

.pay-form { flex: 1; }

/* Tabs */
.pay-type-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
  background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 10px;
  padding: 4px;
}

.pay-type-tab {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; padding: 9px 10px;
  border-radius: 7px; border: 1px solid transparent;
  background: none; font-size: 12px; font-weight: 500;
  font-family: 'Outfit', sans-serif; color: #9A7858;
  cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em;
}
.pay-type-tab:hover { color: #6B4A30; }
.pay-type-tab.active {
  background: #FDFAF6;
  color: #9B6B3A;
  border-color: rgba(155,107,58,0.16);
  box-shadow: 0 1px 4px rgba(80,30,10,0.1);
}

/* Error */
.pos-error {
  background: rgba(184,64,64,0.08);
  border: 1px solid rgba(184,64,64,0.2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #B84040;
  margin-bottom: 10px;
}

/* Fields */
.fld-lbl {
  font-size: 10px; letter-spacing: 0.13em;
  text-transform: uppercase; color: #9A7858; margin-bottom: 5px;
}
.fld-inp {
  width: 100%; background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.16); border-radius: 8px;
  padding: 8px 11px; font-size: 13px;
  font-family: 'Outfit', sans-serif; color: #3A2515; outline: none;
  transition: border-color 0.13s; margin-bottom: 12px;
  box-sizing: border-box;
}
.fld-inp:focus { border-color: #9B6B3A; }
.fld-inp::placeholder { color: #9A7858; }
.req { color: #B84040; }

/* Customer Search */
.cust-wrap {
  position: relative;
  margin-bottom: 0;
}
.cust-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.2);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 10px rgba(80,30,10,0.1);
  z-index: 100;
  max-height: 160px;
  overflow-y: auto;
}
.cust-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #3A2515;
  border-bottom: 1px solid rgba(155,107,58,0.1);
  transition: background 0.1s;
}
.cust-result:last-child { border-bottom: none; }
.cust-result:hover { background: #F5EFE4; }
.cust-sub { font-size: 11px; color: #9A7858; }

.pay-divider { height: 1px; background: rgba(155,107,58,0.16); margin: 12px 0; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Breakdown */
.brk-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; font-size: 13px; color: #6B4A30;
  border-bottom: 1px solid rgba(155,107,58,0.16);
}
.brk-val { font-weight: 500; }
.brk-discount { color: #3D7A5A; }

/* Grand Total */
.grand-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 14px 0 0;
}
.grand-lbl { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9A7858; }
.grand-amt {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 500; color: #9B6B3A;
}

/* Payment Methods */
.pay-section { margin-top: 14px; }
.pay-meths { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 7px; }
.pay-meth {
  background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16);
  border-radius: 8px; padding: 8px 6px; font-size: 11px;
  font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer;
  text-align: center; transition: all 0.12s;
}
.pay-meth:hover { border-color: #C49455; color: #9B6B3A; }
.pay-meth.sel { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }

/* Sales Channel */
.channel-tabs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 7px; margin-bottom: 12px; }
.channel-tab {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16);
  border-radius: 8px; padding: 8px 4px; font-size: 11px;
  font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer;
  text-align: center; transition: all 0.12s;
}
.channel-tab:hover { border-color: #C49455; color: #9B6B3A; }
.channel-tab.sel { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }

/* Discount */
.fld-lbl-hint { text-transform: none; letter-spacing: 0; font-size: 10px; color: #C4A882; margin-left: 4px; }
.discount-warn {
  font-size: 11px; color: #B84040; margin-top: -8px; margin-bottom: 10px;
  background: rgba(184,64,64,0.08); border: 1px solid rgba(184,64,64,0.2);
  border-radius: 6px; padding: 5px 9px;
}

/* Change */
.change-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: rgba(61,122,90,0.08);
  border: 1px solid rgba(61,122,90,0.2);
  border-radius: 8px; margin-top: 8px; font-size: 13px; color: #6B4A30;
}
.change-amt { color: #3D7A5A; font-weight: 600; }

/* Buttons */
.btn-charge {
  margin-top: 14px; width: 100%; background: #9B6B3A;
  color: #FDFAF6; border: none; padding: 12px;
  border-radius: 10px; font-size: 13px; font-weight: 600;
  font-family: 'Outfit', sans-serif; cursor: pointer;
  letter-spacing: 0.07em; text-transform: uppercase;
  transition: background 0.13s;
  box-shadow: 0 2px 8px rgba(155,107,58,0.28);
  display: flex; align-items: center; justify-content: center;
}
.btn-charge:hover:not([disabled]) { background: #C49455; }
.btn-charge[disabled] { opacity: 0.6; cursor: default; }
.btn-install { background: #5A7A9B; box-shadow: 0 2px 8px rgba(90,122,155,0.28); }
.btn-install:hover:not([disabled]) { background: #6B8DAE; }

.btn-ghost {
  margin-top: 7px; width: 100%; background: none;
  border: 1px solid rgba(155,107,58,0.16); padding: 9px;
  border-radius: 8px; font-size: 12px; font-family: 'Outfit', sans-serif;
  color: #9A7858; cursor: pointer; transition: all 0.12s;
}
.btn-ghost:hover { border-color: #C49455; color: #9B6B3A; }

/* Loading Spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.btn-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
}

/* Installment Notice */
.install-notice {
  display: flex; align-items: flex-start; gap: 7px;
  background: rgba(155,107,58,0.08);
  border: 1px solid rgba(155,107,58,0.2);
  border-radius: 8px; padding: 9px 12px;
  font-size: 11px; color: #9B6B3A;
  margin-bottom: 12px; line-height: 1.5;
}

/* Installment Summary */
.install-summary {
  background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 10px; padding: 12px 14px;
  margin-top: 12px;
}
.inst-sum-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 12px; color: #6B4A30;
  border-bottom: 1px solid rgba(155,107,58,0.16);
}
.inst-sum-row:last-child { border-bottom: none; }
.inst-sum-row.highlight { color: #9B6B3A; font-weight: 600; font-size: 13px; }

/* ─── RECEIPT MODAL ─── */
.receipt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(58,37,21,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.receipt-modal {
  background: #FDFAF6;
  border-radius: 16px;
  padding: 24px;
  width: 340px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(58,37,21,0.25);
  font-family: 'Outfit', sans-serif;
}
.receipt-hdr { text-align: center; margin-bottom: 4px; }
.receipt-brand {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600;
  color: #9B6B3A; letter-spacing: 0.1em;
}
.receipt-sub {
  font-size: 10px; letter-spacing: 0.15em;
  text-transform: uppercase; color: #9A7858; margin-top: 2px;
}
.receipt-num {
  font-family: monospace; font-size: 14px;
  font-weight: 700; color: #3A2515; margin-top: 6px;
}
.receipt-sale-num {
  font-family: monospace; font-size: 11px;
  color: #9A7858; margin-top: 2px;
}
.receipt-divider { height: 1px; background: rgba(155,107,58,0.16); margin: 12px 0; }
.receipt-items { margin-bottom: 4px; }
.receipt-item {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 6px 0; border-bottom: 1px dashed rgba(155,107,58,0.14);
}
.receipt-item:last-child { border-bottom: none; }
.ri-left { flex: 1; }
.ri-name { font-size: 12px; font-weight: 500; color: #3A2515; }
.ri-code { font-size: 10px; color: #9A7858; font-family: monospace; }
.ri-price { font-size: 12px; font-weight: 600; color: #3A2515; }
.receipt-break { margin-top: 4px; }
.rb-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: #6B4A30; padding: 3px 0;
}
.rb-disc { color: #3D7A5A; }
.receipt-total-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0 8px; font-size: 15px; font-weight: 700; color: #9B6B3A;
  border-top: 1px solid rgba(155,107,58,0.2); margin-top: 6px;
}
.receipt-pay-info {
  background: #F5EFE4; border-radius: 8px;
  padding: 8px 12px; margin-top: 10px;
}
.receipt-cust { font-size: 12px; font-weight: 600; color: #3A2515; margin-top: 5px; }
.receipt-date { font-size: 10px; color: #9A7858; margin-top: 2px; }
.receipt-actions { display: flex; gap: 8px; margin-top: 16px; }
.btn-print-rcpt {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: #F5EFE4; border: 1px solid rgba(155,107,58,0.3);
  border-radius: 10px; padding: 10px 12px; font-size: 12px; font-weight: 600;
  font-family: 'Outfit', sans-serif; color: #9B6B3A; cursor: pointer;
  transition: all 0.13s; letter-spacing: 0.04em;
}
.btn-print-rcpt:hover { background: #EDE0CC; border-color: #9B6B3A; }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,107,58,0.22); border-radius: 4px; }
</style>
