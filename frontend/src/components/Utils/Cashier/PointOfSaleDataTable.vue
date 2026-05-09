<template>
  <div class="pos-layout">
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
      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;color:#9A7858">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchCode"
          class="pos-search-input"
          type="text"
          placeholder="Enter item code or scan product..."
          @keyup.enter="addItemByCode"
        />
      </div>

      <!-- Items Table -->
      <div class="pos-tbl-wrap">
        <table class="pos-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in cartItems" :key="idx">
              <td>
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">{{ item.material || '' }} {{ item.code }}</div>
              </td>
              <td>
                <div class="qty-ctrl">
                  <button class="qty-btn" @click="changeQty(idx, -1)">-</button>
                  <span class="qty-num">{{ item.qty }}</span>
                  <button class="qty-btn" @click="changeQty(idx, 1)">+</button>
                </div>
              </td>
              <td class="dim">{{ formatCurrency(item.price) }}</td>
              <td class="amt-col">{{ formatCurrency(item.price * item.qty) }}</td>
              <td><button class="rm-btn" @click="removeItem(idx)">&times;</button></td>
            </tr>
            <tr v-if="cartItems.length === 0">
              <td colspan="5" class="empty-cart">
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
        <span>Item Count: <strong>{{ totalQty }}</strong></span>
        <span>Sub Total: <strong>{{ formatCurrency(subtotal) }}</strong></span>
      </div>
    </div>

    <!-- ═══ RIGHT: PAYMENT PANEL ═══ -->
    <div class="pay-card">
      <!-- Payment Type Tabs -->
      <div class="pay-type-tabs">
        <button class="pay-type-tab" :class="{ active: payMode === 'full' }" @click="payMode = 'full'">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M2 4h12M2 12h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          Full Payment
        </button>
        <button class="pay-type-tab" :class="{ active: payMode === 'install' }" @click="payMode = 'install'">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 7h14M5 7v6" stroke="currentColor" stroke-width="1.3"/></svg>
          Installment
        </button>
      </div>

      <!-- ── FULL PAYMENT ── -->
      <div v-if="payMode === 'full'" class="pay-form">
        <div class="fld-lbl">Discount Code</div>
        <input v-model="discountCode" class="fld-inp" type="text" placeholder="Enter promo code (optional)" />

        <div class="pay-divider"></div>

        <div class="brk-row"><span>Subtotal</span><span class="brk-val">{{ formatCurrency(subtotal) }}</span></div>
        <div class="brk-row"><span>Discount</span><span class="brk-discount">- {{ formatCurrency(discount) }}</span></div>
        <div class="brk-row"><span>Tax (12% VAT)</span><span class="brk-val">{{ formatCurrency(tax) }}</span></div>

        <div class="grand-row">
          <div class="grand-lbl">GRAND TOTAL</div>
          <div class="grand-amt">{{ formatCurrency(grandTotal) }}</div>
        </div>

        <div class="pay-section">
          <div class="fld-lbl">Payment Method</div>
          <div class="pay-meths">
            <button class="pay-meth" :class="{ sel: payMethod === 'cash' }" @click="payMethod = 'cash'">Cash</button>
            <button class="pay-meth" :class="{ sel: payMethod === 'card' }" @click="payMethod = 'card'">Card</button>
            <button class="pay-meth" :class="{ sel: payMethod === 'gcash' }" @click="payMethod = 'gcash'">GCash</button>
          </div>
        </div>

        <div class="pay-section">
          <div class="fld-lbl">Amount Tendered</div>
          <input v-model.number="amountTendered" class="fld-inp" type="number" placeholder="0.00" />
        </div>

        <div v-if="change > 0" class="change-row">
          <span>Change</span>
          <span class="change-amt">{{ formatCurrency(change) }}</span>
        </div>

        <button class="btn-charge" @click="processCharge">CHARGE {{ formatCurrency(grandTotal) }}</button>
        <button class="btn-ghost">Print Preview</button>
      </div>

      <!-- ── INSTALLMENT ── -->
      <div v-if="payMode === 'install'" class="pay-form">
        <div class="install-notice">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Customer information is required for installment purchases.
        </div>

        <div class="fld-lbl">Customer <span class="req">*</span></div>
        <input v-model="instCustomer" class="fld-inp" type="text" placeholder="Search customer name or code..." />

        <div class="grid-2">
          <div>
            <div class="fld-lbl">Contact No. <span class="req">*</span></div>
            <input v-model="instPhone" class="fld-inp" type="text" placeholder="+63 9XX XXX XXXX" />
          </div>
          <div>
            <div class="fld-lbl">Valid ID Type <span class="req">*</span></div>
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

        <div class="fld-lbl">Address <span class="req">*</span></div>
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
              <option>Cash</option>
              <option>Card</option>
              <option>GCash</option>
            </select>
          </div>
        </div>

        <!-- Installment Summary -->
        <div v-if="instDP && instTerm" class="install-summary">
          <div class="inst-sum-row"><span>Balance after DP</span><span>{{ formatCurrency(instBalance) }}</span></div>
          <div class="inst-sum-row"><span>Total with Interest</span><span>{{ formatCurrency(instTotalWithInterest) }}</span></div>
          <div class="inst-sum-row highlight"><span>Monthly Payment</span><span>{{ formatCurrency(instMonthly) }}</span></div>
        </div>

        <div class="fld-lbl" style="margin-top:12px">Notes / Remarks</div>
        <input v-model="instNotes" class="fld-inp" type="text" placeholder="Optional notes..." />

        <button class="btn-charge btn-install">CONFIRM INSTALLMENT</button>
        <button class="btn-ghost">Print Agreement</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentTime: "--:--",
      searchCode: "",
      cartItems: [
        { name: "Necklace GLD", code: "NCK-001", material: "Gold Plated", qty: 1, price: 75000 },
        { name: "Ring SLV", code: "RNG-002", material: "Sterling Silver", qty: 2, price: 15000 },
        { name: "Bracelet BRZ", code: "BRC-003", material: "Bronze", qty: 1, price: 5000 },
        { name: "Earrings GLD", code: "ERG-004", material: "Gold Drop", qty: 3, price: 12000 },
        { name: "Watch STN", code: "WTC-005", material: "Stone Dial", qty: 1, price: 25000 },
      ],
      payMode: "full",
      discountCode: "",
      discount: 0,
      payMethod: "cash",
      amountTendered: null,
      // installment
      instCustomer: "",
      instPhone: "",
      instIdType: "",
      instAddress: "",
      instDP: null,
      instTerm: null,
      instRate: 0,
      instPayMethod: "Cash",
      instNotes: "",
      timeInterval: null,
    };
  },
  computed: {
    subtotal() {
      return this.cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    tax() {
      return (this.subtotal - this.discount) * 0.12;
    },
    grandTotal() {
      return this.subtotal - this.discount + this.tax;
    },
    totalQty() {
      return this.cartItems.reduce((sum, i) => sum + i.qty, 0);
    },
    change() {
      if (!this.amountTendered) return 0;
      return Math.max(0, this.amountTendered - this.grandTotal);
    },
    instBalance() {
      return Math.max(0, this.grandTotal - (this.instDP || 0));
    },
    instTotalWithInterest() {
      return this.instBalance * (1 + (this.instRate || 0) / 100);
    },
    instMonthly() {
      if (!this.instTerm) return 0;
      return this.instTotalWithInterest / this.instTerm;
    },
  },
  mounted() {
    this.updateClock();
    this.timeInterval = setInterval(this.updateClock, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timeInterval);
  },
  methods: {
    updateClock() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    },
    formatCurrency(val) {
      if (!val && val !== 0) return "₱0.00";
      return "₱" + Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    changeQty(idx, delta) {
      this.cartItems[idx].qty = Math.max(1, this.cartItems[idx].qty + delta);
    },
    removeItem(idx) {
      this.cartItems.splice(idx, 1);
    },
    addItemByCode() {
      // TODO: look up item by code from API
      this.searchCode = "";
    },
    processCharge() {
      // TODO: process sale via API
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

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 20px;
  border-bottom: 1px solid rgba(155,107,58,0.16);
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

/* Table */
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
.dim { color: #9A7858; font-size: 12px; }
.amt-col { color: #9B6B3A; font-weight: 600; }

.empty-cart {
  text-align: center;
  padding: 40px 20px !important;
  color: #9A7858;
  font-size: 13px;
}

.empty-cart-icon {
  margin-bottom: 8px;
}

/* Qty Controls */
.qty-ctrl { display: flex; align-items: center; gap: 5px; }
.qty-btn {
  width: 22px; height: 22px;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 5px; background: #F5EFE4;
  color: #6B4A30; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.11s; font-family: 'Outfit', sans-serif;
}
.qty-btn:hover { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; }
.qty-num { font-size: 13px; min-width: 18px; text-align: center; font-weight: 500; }

.rm-btn {
  background: none; border: none; color: #9A7858;
  cursor: pointer; font-size: 18px; padding: 2px 6px;
  transition: color 0.11s;
}
.rm-btn:hover { color: #B84040; }

/* Footer */
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
  margin-bottom: 16px;
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
}
.fld-inp:focus { border-color: #9B6B3A; }
.fld-inp::placeholder { color: #9A7858; }

.req { color: #B84040; }

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
.pay-meths { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 7px; }
.pay-meth {
  background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16);
  border-radius: 8px; padding: 8px 6px; font-size: 11px;
  font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer;
  text-align: center; transition: all 0.12s;
}
.pay-meth:hover { border-color: #C49455; color: #9B6B3A; }
.pay-meth.sel { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }

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
}
.btn-charge:hover { background: #C49455; }
.btn-install { background: #5A7A9B; }
.btn-install:hover { background: #6B8DAE; }

.btn-ghost {
  margin-top: 7px; width: 100%; background: none;
  border: 1px solid rgba(155,107,58,0.16); padding: 9px;
  border-radius: 8px; font-size: 12px; font-family: 'Outfit', sans-serif;
  color: #9A7858; cursor: pointer; transition: all 0.12s;
}
.btn-ghost:hover { border-color: #C49455; color: #9B6B3A; }

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

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(155,107,58,0.22); border-radius: 4px; }
</style>
