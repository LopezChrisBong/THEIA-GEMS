<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Receipts</div>
        <div class="page-sub">Manage sales receipts and print history</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search receipts..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          New Receipt
        </button>
      </div>
    </div>

    <div class="cust-table-card">
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterPrint === null }" @click="filterPrint = null">All</button>
        <button class="filter-chip" :class="{ on: filterPrint === 'printed' }" @click="filterPrint = 'printed'">Printed</button>
        <button class="filter-chip" :class="{ on: filterPrint === 'not_printed' }" @click="filterPrint = 'not_printed'">Not Printed</button>
        <div class="filter-spacer" />
      </div>

      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Sale</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Printed At</th>
              <th>Printed By</th>
              <th>Reprints</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td class="mono">{{ item.receiptNumber }}</td>
              <td>
                <span v-if="item.sale" class="cust-name">{{ item.sale.saleNumber }}</span>
                <br v-if="item.sale">
                <span v-if="item.sale" class="dim">₱{{ formatNumber(item.sale.totalAmount) }}</span>
                <span v-if="!item.sale" class="dim">—</span>
              </td>
              <td>
                <span v-if="item.branch" class="repeat-badge r-primary">{{ item.branch.branchName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span class="repeat-badge" :class="item.printedAt ? 'r-printed' : 'r-not-printed'">
                  {{ item.printedAt ? 'Printed' : 'Not Printed' }}
                </span>
              </td>
              <td class="dim">{{ formatDateTime(item.printedAt) }}</td>
              <td>
                <span v-if="item.printer">{{ item.printer.firstName }} {{ item.printer.lastName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-center">
                <span class="repeat-badge" :class="getReprintClass(item.reprintCount)">{{ item.reprintCount || 0 }}</span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn view-btn" title="View Receipt" @click="viewItem(item)"><v-icon size="14">mdi-eye-outline</v-icon></button>
                  <button class="act-btn print-btn" title="Print" @click="printReceipt(item)"><v-icon size="14">mdi-printer</v-icon></button>
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-receipt-text-outline</v-icon></div>
                  <div class="empty-title">No receipts found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading receipts...</div>
        </div>
      </div>
    </div>

    <!-- View Receipt Modal -->
    <v-dialog v-model="dialogView" max-width="440px">
      <v-card v-if="viewData" class="receipt-view-card">
        <!-- Close -->
        <button class="receipt-close-btn" @click="dialogView = false">
          <v-icon size="16">mdi-close</v-icon>
        </button>

        <!-- Receipt Header -->
        <div class="rv-header">
          <div class="rv-store">THEIA GEMS</div>
          <div class="rv-store-sub">Official Receipt</div>
          <div class="rv-divider-dots">· · · · · · · · · · · · · · · · · · ·</div>
          <div class="rv-receipt-no">{{ viewData.receiptNumber }}</div>
          <div class="rv-sale-no">Sale # {{ viewData.sale?.saleNumber || '—' }}</div>
          <div class="rv-date">{{ formatDateTime(viewData.sale?.saleDate || viewData.printedAt) }}</div>
        </div>

        <div class="rv-divider"></div>

        <!-- Branch & Cashier -->
        <div class="rv-section">
          <div class="rv-row">
            <span class="rv-lbl">Branch</span>
            <span class="rv-val">{{ viewData.branch?.branchName || '—' }}</span>
          </div>
          <div class="rv-row" v-if="viewData.sale?.cashier">
            <span class="rv-lbl">Cashier</span>
            <span class="rv-val">{{ viewData.sale.cashier.firstName || '' }} {{ viewData.sale.cashier.lastName || '' }}</span>
          </div>
          <div class="rv-row" v-if="viewData.sale?.customer">
            <span class="rv-lbl">Customer</span>
            <span class="rv-val">{{ viewData.sale.customer.firstName }} {{ viewData.sale.customer.lastName }}</span>
          </div>
        </div>

        <div class="rv-divider"></div>

        <!-- Items -->
        <div class="rv-section">
          <div class="rv-items-header">Items Purchased</div>
          <div v-if="saleItemsLoading" class="rv-items-loading">
            <v-progress-circular indeterminate color="#9B6B3A" size="16" width="2" />
          </div>
          <template v-else-if="saleItems.length">
            <div class="rv-item-row" v-for="si in saleItems" :key="si.id">
              <div class="rv-item-left">
                <span class="rv-item-code">{{ si.jewelryItem?.itemCode || '—' }}</span>
                <span class="rv-item-desc">
                  {{ [si.jewelryItem?.brand, si.jewelryItem?.material].filter(Boolean).join(' · ') || si.jewelryItem?.itemCode || '—' }}
                </span>
              </div>
              <span class="rv-item-price">₱{{ formatNumber(si.lineTotal) }}</span>
            </div>
          </template>
          <div v-else class="rv-items-empty">No item details recorded</div>
        </div>

        <div class="rv-divider"></div>

        <!-- Sale Breakdown -->
        <div class="rv-section">
          <div class="rv-row">
            <span class="rv-lbl">Sale Type</span>
            <span class="rv-val" style="text-transform:capitalize">{{ viewData.sale?.saleType || '—' }}</span>
          </div>
          <div class="rv-row">
            <span class="rv-lbl">Subtotal</span>
            <span class="rv-val">₱{{ formatNumber(viewData.sale?.subtotal) }}</span>
          </div>
          <div class="rv-row" v-if="Number(viewData.sale?.discountAmount) > 0">
            <span class="rv-lbl">Discount</span>
            <span class="rv-val rv-discount">- ₱{{ formatNumber(viewData.sale?.discountAmount) }}</span>
          </div>
          <div class="rv-row" v-if="Number(viewData.sale?.taxAmount) > 0">
            <span class="rv-lbl">VAT (12%)</span>
            <span class="rv-val">₱{{ formatNumber(viewData.sale?.taxAmount) }}</span>
          </div>
        </div>

        <div class="rv-divider"></div>

        <!-- Total -->
        <div class="rv-total-row">
          <span>TOTAL</span>
          <span class="rv-total-amt">₱{{ formatNumber(viewData.sale?.totalAmount) }}</span>
        </div>

        <!-- Payment Info -->
        <div class="rv-section" style="margin-top:8px">
          <div class="rv-row">
            <span class="rv-lbl">Amount Paid</span>
            <span class="rv-val">₱{{ formatNumber(viewData.sale?.amountPaid) }}</span>
          </div>
          <div class="rv-row" v-if="Number(viewData.sale?.changeAmount) > 0">
            <span class="rv-lbl">Change</span>
            <span class="rv-val">₱{{ formatNumber(viewData.sale?.changeAmount) }}</span>
          </div>
          <div class="rv-row">
            <span class="rv-lbl">Status</span>
            <span class="rv-val" style="text-transform:capitalize">{{ viewData.sale?.paymentStatus || '—' }}</span>
          </div>
        </div>

        <div class="rv-divider"></div>

        <!-- Print Info -->
        <div class="rv-section rv-print-info">
          <div class="rv-row">
            <span class="rv-lbl">Print Status</span>
            <span class="rv-val">
              <span class="repeat-badge" :class="viewData.printedAt ? 'r-printed' : 'r-not-printed'">
                {{ viewData.printedAt ? 'Printed' : 'Not Printed' }}
              </span>
            </span>
          </div>
          <div class="rv-row" v-if="viewData.printedAt">
            <span class="rv-lbl">Printed At</span>
            <span class="rv-val">{{ formatDateTime(viewData.printedAt) }}</span>
          </div>
          <div class="rv-row" v-if="viewData.printer">
            <span class="rv-lbl">Printed By</span>
            <span class="rv-val">{{ viewData.printer.firstName }} {{ viewData.printer.lastName }}</span>
          </div>
          <div class="rv-row">
            <span class="rv-lbl">Reprints</span>
            <span class="rv-val">{{ viewData.reprintCount || 0 }}</span>
          </div>
        </div>

        <div class="rv-divider-dots" style="text-align:center;color:#C4A882;margin:12px 0 8px">· · · · · · · · · · · · · · · · · · ·</div>
        <div class="rv-footer">Thank you for shopping at Theia Gems</div>
      </v-card>
    </v-dialog>

    <ReceiptsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this receipt?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogConfirmDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <fade-away-message-component displayType="variation2" v-model="fadeAwayMessage.show" :message="fadeAwayMessage.message" :header="fadeAwayMessage.header" :top="fadeAwayMessage.top" :type="fadeAwayMessage.type" />
  </v-container>
</template>

<script>
import ReceiptsDialog from "../../components/Dialogs/Forms/ReceiptsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { ReceiptsDialog },
  data: () => ({
    search: "", filterPrint: null, data: [], deleteData: null, updateData: null,
    loading: false, deleting: false, action: null, dialogConfirmDelete: false,
    dialogView: false, viewData: null, saleItems: [], saleItemsLoading: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),
  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterPrint === "printed") result = result.filter((r) => r.printedAt);
      else if (this.filterPrint === "not_printed") result = result.filter((r) => !r.printedAt);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((r) =>
          [r.receiptNumber, r.sale?.saleNumber, r.branch?.branchName].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      return result;
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closeReceiptsDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeReceiptsDialog"); },
  methods: {
    formatDateTime(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); },
    formatNumber(v) { if (v == null) return "0.00"; return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    getReprintClass(count) {
      if (!count || count === 0) return "r-reprint-none";
      if (count >= 3) return "r-reprint-high";
      return "r-reprint-low";
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/receipts", "GET").then((r) => { if (r && r.data) this.data = r.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load receipts", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    viewItem(item) {
      this.viewData = item;
      this.saleItems = [];
      this.dialogView = true;
      if (item.sale?.id) {
        this.saleItemsLoading = true;
        this.axiosCall(`/sale-items/sale/${item.sale.id}`, 'GET')
          .then((r) => { if (r && r.data) this.saleItems = r.data; })
          .catch(() => {})
          .finally(() => { this.saleItemsLoading = false; });
      }
    },
    async printReceipt(item) {
      const fmt = (v) => "₱" + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Fetch sale items
      let saleItems = [];
      if (item.sale?.id) {
        try {
          const r = await this.axiosCall(`/sale-items/sale/${item.sale.id}`, "GET");
          saleItems = r?.data || [];
        } catch (_) { /* ignore */ }
      }

      const sale = item.sale || {};
      const customerName = sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : null;
      const rawDate = sale.saleDate || item.printedAt;
      const saleDate = rawDate ? new Date(rawDate).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "";
      const isInstallment = sale.saleType === "layaway";
      const discountAmt = Number(sale.discountAmount || 0);
      const taxAmt = Number(sale.taxAmount || 0);
      const changeAmt = Number(sale.changeAmount || 0);
      const reprints = item.reprintCount || 0;

      const itemLines = saleItems.length
        ? saleItems.map((si) => {
            const ji = si.jewelryItem || {};
            const isJewelry = !!(ji.jewelryTypeId || ji.stoneTypeId || ji.designModelId);
            const name = ji.brand || ji.description || ji.itemCode || "—";
            let details = "";
            if (isJewelry) {
              details = [ji.stoneType?.name, ji.designModel?.modelName].filter(Boolean).join(" · ");
            } else {
              details = [ji.brand, ji.description ? ji.description.substring(0, 40) : ""].filter(Boolean).join(" · ");
            }
            return `<div class="row"><span class="iname">${name}</span><span class="iprice">${fmt(si.lineTotal)}</span></div>` +
                   `<div class="icode">${ji.itemCode || ""}</div>` +
                   (details ? `<div class="icode" style="margin-bottom:4px">${details}</div>` : "");
          }).join("")
        : '<div class="icode">No item details recorded</div>';

      let payLines = `<div class="row"><span>Amount Paid</span><span>${fmt(sale.amountPaid)}</span></div>`;
      if (changeAmt > 0) payLines += `<div class="row"><span>Change</span><span>${fmt(changeAmt)}</span></div>`;
      payLines += `<div class="row"><span>Status</span><span style="text-transform:capitalize">${(sale.paymentStatus || "").replace("_", " ")}</span></div>`;
      if (isInstallment) payLines += `<div class="row bold"><span>INSTALLMENT PLAN</span></div>`;

      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><title>Receipt ${item.receiptNumber}</title>
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
<div class="meta">Receipt: <b>${item.receiptNumber}</b></div>
<div class="meta">Sale No: ${sale.saleNumber || "—"}</div>
<div class="meta">Date: ${saleDate}</div>
${customerName ? `<div class="meta">Customer: ${customerName}</div>` : ""}
${reprints > 0 ? `<div class="meta" style="color:#555">Reprint #${reprints + 1}</div>` : ""}
<hr class="hr">
${itemLines}
<hr class="hr">
<div class="row"><span>Subtotal</span><span>${fmt(sale.subtotal)}</span></div>
${discountAmt > 0 ? `<div class="row"><span>Discount</span><span>-${fmt(discountAmt)}</span></div>` : ""}
${taxAmt > 0 ? `<div class="row"><span>VAT (12%)</span><span>${fmt(taxAmt)}</span></div>` : ""}
<hr class="hrs">
<div class="total-row"><span>TOTAL</span><span>${fmt(sale.totalAmount)}</span></div>
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

      // Record the print/reprint on the backend
      const userId = this.$store?.state?.user?.userID || this.$store?.state?.user?.id;
      this.axiosCall("/receipts/" + item.id + "/print", "POST", { printedBy: userId })
        .then(() => this.initialize())
        .catch(() => {});
    },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/receipts/" + this.deleteData.id, "DELETE")
        .then((r) => { if (r && (r.status === 200 || r.status === 204)) { this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Receipt deleted", top: 10 }; this.dialogConfirmDelete = false; this.deleteData = null; this.initialize(); } })
        .catch((e) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed to delete", top: 10 }; })
        .finally(() => { this.deleting = false; });
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 9px; padding: 8px 13px; box-shadow: 0 1px 6px rgba(80,30,10,0.08); min-width: 210px; }
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit'; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }
.btn-add { display: flex; align-items: center; gap: 7px; background: #9B6B3A; color: #FDFAF6; border: none; padding: 9px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(155,107,58,0.3); transition: background 0.13s; }
.btn-add:hover { background: #C49455; }
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(155,107,58,0.16); background: #FDFAF6; color: #9A7858; cursor: pointer; font-family: 'Outfit'; transition: all 0.12s; }
.filter-chip:hover { border-color: #C49455; color: #9B6B3A; }
.filter-chip.on { border-color: #9B6B3A; color: #9B6B3A; background: #EDE0CC; font-weight: 500; }
.filter-spacer { flex: 1; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
td.mono, .mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.r-printed { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-not-printed { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-reprint-none { background: rgba(154,120,88,0.08); color: #9A7858; }
.r-reprint-low { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-reprint-high { background: rgba(184,64,64,0.08); color: #B84040; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.act-btn.print-btn:hover { border-color: #3D7A5A; color: #3D7A5A; background: rgba(61,122,90,0.06); }
.act-btn.view-btn:hover { border-color: #5A7A9B; color: #5A7A9B; background: rgba(90,122,155,0.06); }

/* ── Receipt View Modal ── */
.receipt-view-card {
  border-radius: 16px !important;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  background: #FDFAF6;
  padding: 24px 28px 20px;
  position: relative;
}
.receipt-close-btn {
  position: absolute; top: 14px; right: 14px;
  background: none; border: none; cursor: pointer;
  color: #9A7858; padding: 4px; border-radius: 6px;
  display: flex; align-items: center; transition: color 0.12s;
}
.receipt-close-btn:hover { color: #B84040; }

.rv-header { text-align: center; margin-bottom: 12px; }
.rv-store {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600;
  color: #9B6B3A; letter-spacing: 0.12em;
}
.rv-store-sub { font-size: 11px; color: #9A7858; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 2px; }
.rv-divider-dots { font-size: 11px; color: #C4A882; margin: 8px 0; letter-spacing: 0.1em; }
.rv-receipt-no { font-family: monospace; font-size: 15px; font-weight: 700; color: #3A2515; margin-top: 6px; }
.rv-sale-no { font-family: monospace; font-size: 11px; color: #9A7858; margin-top: 2px; }
.rv-date { font-size: 11px; color: #9A7858; margin-top: 3px; }

.rv-divider { height: 1px; background: rgba(155,107,58,0.16); margin: 10px 0; }

.rv-section { padding: 4px 0; }
.rv-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 13px; color: #3A2515;
  border-bottom: 1px dashed rgba(155,107,58,0.1);
}
.rv-row:last-child { border-bottom: none; }
.rv-lbl { color: #9A7858; font-size: 12px; }
.rv-val { font-weight: 500; text-align: right; }
.rv-discount { color: #3D7A5A; }

.rv-total-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 10px 0 4px;
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: #3A2515;
}
.rv-total-amt {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 600; color: #9B6B3A;
}

.rv-print-info .rv-lbl { color: #9A7858; }
.rv-footer { text-align: center; font-size: 11px; color: #9A7858; font-style: italic; padding-bottom: 4px; }

/* Items list */
.rv-items-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9A7858;
  margin-bottom: 6px;
}
.rv-item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 0;
  border-bottom: 1px dashed rgba(155,107,58,0.1);
  gap: 8px;
}
.rv-item-row:last-child { border-bottom: none; }
.rv-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.rv-item-code {
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  color: #9B6B3A;
}
.rv-item-desc {
  font-size: 12px;
  color: #3A2515;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rv-item-price {
  font-size: 13px;
  font-weight: 600;
  color: #3A2515;
  white-space: nowrap;
}
.rv-items-loading {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.rv-items-empty {
  font-size: 11px;
  color: #C4A882;
  font-style: italic;
  padding: 4px 0;
}
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit'; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; }
</style>
