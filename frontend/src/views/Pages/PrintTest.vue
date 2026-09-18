<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Receipt Print Test</div>
        <div class="page-sub">Preview and print sample or real receipts to test your printer/layout — for testing only, nothing here is saved</div>
      </div>
    </div>

    <!-- ── SECTION A: QUICK SAMPLE PRINT ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Quick Sample Print</div>
          <div class="section-sub">Prints the exact same 80mm receipt layout used in production, filled with sample data — no real sale needed</div>
        </div>
      </div>

      <div class="job-grid">
        <div class="job-card" v-for="preset in presets" :key="preset.key">
          <div class="job-icon"><v-icon size="18" color="#9B6B3A">{{ preset.icon }}</v-icon></div>
          <div class="job-title">{{ preset.title }}</div>
          <div class="job-desc">{{ preset.desc }}</div>
          <div class="job-btn-row">
            <button class="btn-run" @click="printPreset(preset)">Print</button>
            <button class="btn-run btn-run-pdf" :disabled="savingPresetKey === preset.key" @click="savePresetPdf(preset)">
              <span v-if="savingPresetKey === preset.key" class="spin"></span>
              {{ savingPresetKey === preset.key ? "Saving..." : "Save PDF" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION B: PRINT AN EXISTING RECEIPT ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Print an Existing Receipt</div>
          <div class="section-sub">Reprints a real receipt with its real data — test mode, so it won't increment the reprint count or "printed at" on the record</div>
        </div>
      </div>

      <div class="tester-grid">
        <div>
          <div class="fld-lbl">Receipt</div>
          <select v-model="selectedReceiptId" class="fld-inp">
            <option :value="null">Select a receipt…</option>
            <option v-for="r in receiptList" :key="r.id" :value="r.id">
              {{ r.receiptNumber }} — {{ r.sale?.saleNumber || 'no sale#' }}
            </option>
          </select>
        </div>
      </div>

      <div class="btn-row">
        <button
          class="btn-send"
          :disabled="!selectedReceiptId || loadingReceipt"
          @click="printSelectedReceipt"
        >
          <span v-if="loadingReceipt" class="spin"></span>
          {{ loadingReceipt ? "Loading..." : "Print (Test)" }}
        </button>
        <button
          class="btn-send btn-send-pdf"
          :disabled="!selectedReceiptId || savingReceiptPdf"
          @click="savePdfSelectedReceipt"
        >
          <span v-if="savingReceiptPdf" class="spin"></span>
          {{ savingReceiptPdf ? "Saving..." : "Save PDF (Test)" }}
        </button>
      </div>
    </div>

    <!-- ── ACTIVITY LOG ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Activity Log</div>
          <div class="section-sub">Prints from this session — cleared on page reload</div>
        </div>
        <button class="btn-clear" v-if="activityLog.length" @click="activityLog = []">Clear</button>
      </div>

      <div v-if="activityLog.length === 0" class="empty-state">
        <v-icon size="20" color="#C4A882">mdi-printer-off-outline</v-icon>
        <div class="empty-title">No test prints yet</div>
      </div>
      <div v-else class="log-list">
        <div v-for="(log, i) in activityLog" :key="i" class="log-row" :class="log.success ? 'ok' : 'err'">
          <v-icon size="14">{{ log.success ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}</v-icon>
          <div class="log-body">
            <div class="log-title">{{ log.title }}</div>
            <div class="log-msg">{{ log.message }}</div>
          </div>
          <div class="log-time">{{ log.time }}</div>
        </div>
      </div>
    </div>

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
import { downloadReceiptPdf } from "@/utils/receiptPdf";

export default {
  name: "PrintTest",

  data() {
    return {
      receiptList: [],
      selectedReceiptId: null,
      loadingReceipt: false,
      savingReceiptPdf: false,
      savingPresetKey: null,
      activityLog: [],
      fadeAwayMessage: { show: false, type: "success", header: "", message: "", top: 10 },

      presets: [
        {
          key: "regular",
          title: "Regular Sale",
          desc: "A straightforward paid-in-full sale with two items, no discount.",
          icon: "mdi-receipt-text-outline",
        },
        {
          key: "discount",
          title: "With Discount & VAT",
          desc: "Tests the discount and 12% VAT lines rendering correctly.",
          icon: "mdi-sale-outline",
        },
        {
          key: "layaway",
          title: "Layaway / Installment",
          desc: "Tests the partial-payment and installment-plan footer.",
          icon: "mdi-calendar-clock-outline",
        },
        {
          key: "reprint",
          title: "Reprint (#2)",
          desc: "Tests the 'Reprint #2' notice that appears on reprinted receipts.",
          icon: "mdi-printer-check",
        },
      ],
    };
  },

  created() {
    // Owner/admin only — branch-scoped staff accounts get redirected out.
    if (this.$store.state.user?.branchId) {
      this.$router.replace("/employee");
    }
  },

  mounted() {
    if (!this.$store.state.user?.branchId) this.loadReceipts();
  },

  methods: {
    nowLabel() {
      return new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    },

    addLog(title, success, message) {
      this.activityLog.unshift({ title, success, message, time: this.nowLabel() });
      if (this.activityLog.length > 50) this.activityLog.pop();
    },

    notify(success, header, message) {
      this.fadeAwayMessage.show = true;
      this.fadeAwayMessage.type = success ? "success" : "error";
      this.fadeAwayMessage.header = header;
      this.fadeAwayMessage.message = message;
    },

    loadReceipts() {
      this.axiosCall("/receipts", "GET")
        .then((res) => { this.receiptList = res?.data || []; })
        .catch(() => { this.receiptList = []; });
    },

    fmt(v) {
      return "₱" + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // Builds the same 80mm receipt HTML used in production (ReceiptsDataTable.vue's printReceipt).
    buildReceiptHtml(d) {
      const itemLines = d.items.length
        ? d.items.map((it) =>
            `<div class="row"><span class="iname">${it.name}</span><span class="iprice">${this.fmt(it.price)}</span></div>` +
            `<div class="icode">${it.code || ""}</div>` +
            (it.details ? `<div class="icode" style="margin-bottom:4px">${it.details}</div>` : "")
          ).join("")
        : '<div class="icode">No item details recorded</div>';

      let payLines = `<div class="row"><span>Amount Paid</span><span>${this.fmt(d.amountPaid)}</span></div>`;
      if (d.changeAmt > 0) payLines += `<div class="row"><span>Change</span><span>${this.fmt(d.changeAmt)}</span></div>`;
      payLines += `<div class="row"><span>Status</span><span style="text-transform:capitalize">${(d.paymentStatus || "").replace("_", " ")}</span></div>`;
      if (d.isInstallment) payLines += `<div class="row bold"><span>INSTALLMENT PLAN</span></div>`;

      return `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><title>Receipt ${d.receiptNumber}</title>
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
  .test-banner { text-align: center; font-size: 9px; color: #B84040; border: 1px dashed #B84040; padding: 3px; margin-bottom: 6px; }
</style>
</head><body>
${d.isTest ? '<div class="test-banner">*** TEST PRINT — NOT A REAL RECEIPT ***</div>' : ""}
<div class="center">
  <div class="brand">THEIA GEMS</div>
  <div class="sub">FINE JEWELRY</div>
</div>
<hr class="hrs">
<div class="meta">Receipt: <b>${d.receiptNumber}</b></div>
<div class="meta">Sale No: ${d.saleNumber || "—"}</div>
<div class="meta">Date: ${d.saleDate}</div>
${d.customerName ? `<div class="meta">Customer: ${d.customerName}</div>` : ""}
${d.reprints > 0 ? `<div class="meta" style="color:#555">Reprint #${d.reprints + 1}</div>` : ""}
<hr class="hr">
${itemLines}
<hr class="hr">
<div class="row"><span>Subtotal</span><span>${this.fmt(d.subtotal)}</span></div>
${d.discountAmt > 0 ? `<div class="row"><span>Discount</span><span>-${this.fmt(d.discountAmt)}</span></div>` : ""}
${d.taxAmt > 0 ? `<div class="row"><span>VAT (12%)</span><span>${this.fmt(d.taxAmt)}</span></div>` : ""}
<hr class="hrs">
<div class="total-row"><span>TOTAL</span><span>${this.fmt(d.totalAmount)}</span></div>
<hr class="hr">
${payLines}
<hr class="hrs">
<div class="footer">
  <div>Thank you for your purchase!</div>
  <div>Please come again.</div>
  <div style="margin-top:4px;font-size:8px">This serves as your official receipt.</div>
</div>
</body></html>`;
    },

    openPrintWindow(html) {
      const win = window.open("", "_blank", "width=340,height=700,toolbar=0,menubar=0,scrollbars=1");
      if (!win) { this.notify(false, "Popup Blocked", "Please allow popups to test printing."); return false; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.onafterprint = () => win.close();
      }, 250);
      return true;
    },

    buildPresetData(preset) {
      const now = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
      const baseItems = [
        { name: "LANA", code: "LG866", details: "Lab Grown", price: 329890 },
        { name: "NICOLE", code: "LG795", details: "Lab Grown", price: 196900 },
      ];

      if (preset.key === "regular") {
        return {
          receiptNumber: "TEST-0001", saleNumber: "SN-TEST-0001", saleDate: now,
          customerName: "Juan Dela Cruz", reprints: 0, items: baseItems,
          subtotal: 526790, discountAmt: 0, taxAmt: 0, totalAmount: 526790,
          amountPaid: 526790, changeAmt: 0, paymentStatus: "paid", isInstallment: false, isTest: true,
        };
      }
      if (preset.key === "discount") {
        const subtotal = 526790, discountAmt = 20000, taxAmt = (subtotal - discountAmt) * 0.12;
        return {
          receiptNumber: "TEST-0002", saleNumber: "SN-TEST-0002", saleDate: now,
          customerName: "Maria Santos", reprints: 0, items: baseItems,
          subtotal, discountAmt, taxAmt, totalAmount: subtotal - discountAmt + taxAmt,
          amountPaid: subtotal - discountAmt + taxAmt, changeAmt: 0, paymentStatus: "paid",
          isInstallment: false, isTest: true,
        };
      }
      if (preset.key === "layaway") {
        return {
          receiptNumber: "TEST-0003", saleNumber: "SN-TEST-0003", saleDate: now,
          customerName: "Pedro Reyes", reprints: 0, items: [baseItems[0]],
          subtotal: 329890, discountAmt: 0, taxAmt: 0, totalAmount: 329890,
          amountPaid: 100000, changeAmt: 0, paymentStatus: "partial", isInstallment: true, isTest: true,
        };
      }
      return {
        receiptNumber: "TEST-0004", saleNumber: "SN-TEST-0004", saleDate: now,
        customerName: "Ana Lim", reprints: 1, items: baseItems,
        subtotal: 526790, discountAmt: 0, taxAmt: 0, totalAmount: 526790,
        amountPaid: 526790, changeAmt: 5000, paymentStatus: "paid", isInstallment: false, isTest: true,
      };
    },

    printPreset(preset) {
      const ok = this.openPrintWindow(this.buildReceiptHtml(this.buildPresetData(preset)));
      this.addLog(`Sample: ${preset.title}`, ok, ok ? "Print window opened." : "Popup blocked.");
    },

    async savePresetPdf(preset) {
      this.savingPresetKey = preset.key;
      try {
        const html = this.buildReceiptHtml(this.buildPresetData(preset));
        await downloadReceiptPdf(html, `Receipt-${preset.key}-sample.pdf`);
        this.addLog(`Sample PDF: ${preset.title}`, true, "PDF downloaded.");
      } catch (error) {
        this.addLog(`Sample PDF: ${preset.title}`, false, "Failed to generate PDF.");
        this.notify(false, "Failed", "Failed to generate PDF.");
      } finally {
        this.savingPresetKey = null;
      }
    },

    async buildSelectedReceiptData() {
      const item = this.receiptList.find((r) => r.id === this.selectedReceiptId);
      if (!item) return null;

      let saleItems = [];
      if (item.sale?.id) {
        const r = await this.axiosCall(`/sale-items/sale/${item.sale.id}`, "GET");
        saleItems = r?.data || [];
      }

      const sale = item.sale || {};
      const customerName = sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : null;
      const rawDate = sale.saleDate || item.printedAt;

      const items = saleItems.length
        ? saleItems.map((si) => {
            const ji = si.jewelryItem || {};
            const isJewelry = !!(ji.jewelryTypeId || ji.stoneTypeId);
            const name = ji.name || ji.description || ji.itemCode || "—";
            const details = isJewelry
              ? [ji.stoneType?.name].filter(Boolean).join(" · ")
              : [ji.name, ji.description ? ji.description.substring(0, 40) : ""].filter(Boolean).join(" · ");
            return { name, code: ji.itemCode || "", details, price: si.lineTotal };
          })
        : [];

      return {
        item,
        d: {
          receiptNumber: item.receiptNumber,
          saleNumber: sale.saleNumber,
          saleDate: rawDate ? new Date(rawDate).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "",
          customerName,
          reprints: item.reprintCount || 0,
          items,
          subtotal: sale.subtotal,
          discountAmt: Number(sale.discountAmount || 0),
          taxAmt: Number(sale.taxAmount || 0),
          totalAmount: sale.totalAmount,
          amountPaid: sale.amountPaid,
          changeAmt: Number(sale.changeAmount || 0),
          paymentStatus: sale.paymentStatus,
          isInstallment: sale.saleType === "layaway",
          isTest: true,
        },
      };
    },

    async printSelectedReceipt() {
      this.loadingReceipt = true;
      try {
        const result = await this.buildSelectedReceiptData();
        if (!result) return;
        const ok = this.openPrintWindow(this.buildReceiptHtml(result.d));
        this.addLog(`Existing: ${result.item.receiptNumber}`, ok, ok ? "Print window opened (not recorded as a reprint)." : "Popup blocked.");
      } catch (error) {
        const msg = error?.response?.data?.message || "Failed to load receipt data";
        this.addLog("Existing receipt", false, msg);
        this.notify(false, "Failed", msg);
      } finally {
        this.loadingReceipt = false;
      }
    },

    async savePdfSelectedReceipt() {
      this.savingReceiptPdf = true;
      try {
        const result = await this.buildSelectedReceiptData();
        if (!result) return;
        await downloadReceiptPdf(this.buildReceiptHtml(result.d), `Receipt-${result.item.receiptNumber}.pdf`);
        this.addLog(`Existing PDF: ${result.item.receiptNumber}`, true, "PDF downloaded (not recorded as a reprint).");
      } catch (error) {
        const msg = error?.response?.data?.message || "Failed to generate PDF";
        this.addLog("Existing receipt PDF", false, msg);
        this.notify(false, "Failed", msg);
      } finally {
        this.savingReceiptPdf = false;
      }
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }

.page-header { margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }

.section-card {
  background: #FDFAF6;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(80,30,10,0.08);
  padding: 20px 22px;
  margin-bottom: 18px;
}

.section-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.section-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #3A2515; }
.section-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }

/* Job grid */
.job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.job-card {
  background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16);
  border-radius: 12px; padding: 16px;
}
.job-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(155,107,58,0.1); display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.job-title { font-size: 13px; font-weight: 600; color: #3A2515; margin-bottom: 4px; }
.job-desc { font-size: 11px; color: #9A7858; line-height: 1.5; margin-bottom: 12px; min-height: 48px; }

/* Buttons */
.btn-run, .btn-send {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; background: #9B6B3A; color: #FDFAF6; border: none;
  padding: 9px 14px; border-radius: 9px; font-size: 12px; font-weight: 600;
  font-family: 'Outfit', sans-serif; cursor: pointer; letter-spacing: 0.03em;
  transition: background 0.13s;
}
.btn-run:hover:not([disabled]), .btn-send:hover:not([disabled]) { background: #C49455; }
.btn-run[disabled], .btn-send[disabled] { opacity: 0.6; cursor: default; }
.btn-send { width: auto; padding: 10px 22px; margin-top: 14px; }

.job-btn-row { display: flex; gap: 8px; }
.btn-run-pdf { background: #6B4A30; }
.btn-run-pdf:hover:not([disabled]) { background: #8A6142; }

.btn-row { display: flex; gap: 10px; margin-top: 14px; }
.btn-row .btn-send { margin-top: 0; }
.btn-send-pdf { background: #6B4A30; }
.btn-send-pdf:hover:not([disabled]) { background: #8A6142; }

.btn-clear {
  background: none; border: 1px solid rgba(155,107,58,0.16); padding: 6px 12px;
  border-radius: 7px; font-size: 11px; color: #9A7858; cursor: pointer; transition: all 0.12s;
}
.btn-clear:hover { border-color: rgba(155,107,58,0.35); color: #6B4A30; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin {
  display: inline-block; width: 11px; height: 11px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}

/* Tester forms */
.tester-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fld-lbl { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #9A7858; margin-bottom: 5px; }
.fld-inp {
  width: 100%; background: #F5EFE4; border: 1px solid rgba(155,107,58,0.16);
  border-radius: 8px; padding: 9px 11px; font-size: 13px;
  font-family: 'Outfit', sans-serif; color: #3A2515; outline: none;
  transition: border-color 0.13s; box-sizing: border-box;
}
.fld-inp:focus { border-color: #9B6B3A; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 20px; gap: 8px; color: #9A7858; }
.empty-title { font-size: 13px; font-weight: 500; color: #6B4A30; }

/* Log */
.log-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
.log-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 12px; border-radius: 9px; background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.12);
}
.log-row.ok { color: #3D7A5A; }
.log-row.err { color: #B84040; }
.log-body { flex: 1; min-width: 0; }
.log-title { font-size: 12px; font-weight: 600; color: #3A2515; }
.log-msg { font-size: 11px; color: #6B4A30; margin-top: 1px; word-break: break-word; }
.log-time { font-size: 10px; color: #9A7858; white-space: nowrap; flex-shrink: 0; }
</style>
