<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Categories</div>
        <div class="page-sub">Manage product categories and sub-categories</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search categories..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()"><v-icon size="13" color="white">mdi-plus</v-icon> Add Category</button>
      </div>
    </div>
    <div class="cust-table-card">
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead><tr><th>ID</th><th>Category Name</th><th>Parent Category</th><th>Description</th><th>Stock Status</th><th>Created At</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id" class="cat-row" @click="viewItems(item)">
              <td class="mono">{{ item.id }}</td>
              <td><span class="cust-name">{{ item.categoryName }}</span></td>
              <td><span v-if="item.parentCategory" class="repeat-badge r-primary">{{ item.parentCategory.categoryName }}</span><span v-else class="dim">—</span></td>
              <td><span v-if="item.description" class="dim txt-truncate">{{ item.description }}</span><span v-else class="dim">—</span></td>
              <td><span class="status-badge" :class="getStockStatus(getStockCount(item.id)).cls">{{ getStockStatus(getStockCount(item.id)).label }}</span><span class="dim stock-count">({{ getStockCount(item.id) }})</span></td>
              <td class="dim">{{ formatDate(item.createdAt) }}</td>
              <td><div class="act-btns"><button class="act-btn" @click.stop="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button><button class="act-btn del" @click.stop="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button></div></td>
            </tr>
            <tr v-if="filteredData.length === 0"><td colspan="7"><div class="empty-state"><div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-shape-outline</v-icon></div><div class="empty-title">No categories found</div></div></td></tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state"><v-progress-circular indeterminate color="#9B6B3A" size="32" /><div class="empty-title">Loading...</div></div>
      </div>
    </div>
    <CategoriesDialog :data="updateData" :action="action" />
    <v-dialog v-model="dialogConfirmDelete" max-width="500"><v-card style="border-radius:16px;border:1px solid rgba(155,107,58,0.16)"><v-card-title class="text-h6" style="font-family:'Cormorant Garamond',serif">Confirm Deletion</v-card-title><v-card-text style="color:#6B4A30">Delete "{{ deleteData?.categoryName }}"? This may affect subcategories.</v-card-text><v-card-actions><v-spacer /><button class="btn-cancel-proto" @click="dialogConfirmDelete=false">Cancel</button><button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button></v-card-actions></v-card></v-dialog>
    <v-dialog v-model="dialogViewItems" max-width="880px">
      <v-card class="cat-items-card">
        <div class="cat-items-hdr">
          <div><div class="cat-items-title">{{ viewCategoryData?.categoryName }}</div><div class="cat-items-sub">{{ categoryItems.length }} item(s) in this category</div></div>
          <button class="ph-close" @click="dialogViewItems=false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="cat-items-tbl-wrap">
          <div v-if="categoryItemsLoading" class="empty-state"><v-progress-circular indeterminate color="#9B6B3A" size="28" /><div class="empty-title">Loading items...</div></div>
          <table v-else-if="categoryItems.length" class="cust-table">
            <thead><tr><th>Item Code</th><th>Name</th><th>Material</th><th class="text-right">Price</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="ci in categoryItems" :key="ci.id">
                <td class="mono">{{ ci.itemCode }}</td>
                <td><span class="cust-name">{{ ci.name || '—' }}</span></td>
                <td class="dim">{{ ci.material || '—' }}</td>
                <td class="text-right amt-col">₱{{ formatNumber(ci.price) }}</td>
                <td class="dim">{{ ci.branch?.branchName || '—' }}</td>
                <td><span class="status-badge" :class="'st-' + ci.status">{{ formatItemStatus(ci.status) }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state"><div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-diamond-stone</v-icon></div><div class="empty-title">No items found in this category</div></div>
        </div>
      </v-card>
    </v-dialog>
    <fade-away-message-component displayType="variation2" v-model="fadeAwayMessage.show" :message="fadeAwayMessage.message" :header="fadeAwayMessage.header" :top="fadeAwayMessage.top" :type="fadeAwayMessage.type" />
  </v-container>
</template>
<script>
import CategoriesDialog from "../../components/Dialogs/Forms/CategoriesDialog.vue";
import eventBus from "@/eventBus";
export default {
  components: { CategoriesDialog },
  data: () => ({ search: "", data: [], deleteData: null, updateData: null, loading: false, deleting: false, options: {}, action: null, dialogConfirmDelete: false, dialogViewItems: false, viewCategoryData: null, categoryItems: [], categoryItemsLoading: false, stockCounts: {}, fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 } }),
  computed: { filteredData() { if (!this.search) return this.data; const q = this.search.toLowerCase(); return this.data.filter((c) => [c.categoryName, c.description, c.parentCategory?.categoryName].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))); } },
  watch: { options: { handler() { this.initialize(); }, deep: true } },
  mounted() { this.initialize(); this.loadStockCounts(); eventBus.on("closeCategoriesDialog", () => this.initialize()); },
  beforeUnmount() { eventBus.off("closeCategoriesDialog"); },
  methods: {
    formatDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); },
    formatNumber(v) { if (v === null || v === undefined) return "0.00"; return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    formatItemStatus(s) { if (!s) return "—"; return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); },
    loadStockCounts() {
      this.axiosCall("/jewelry-items?status=IN_STOCK", "GET").then((r) => {
        if (!r || !r.data) return;
        const counts = {};
        for (const it of r.data) { if (it.categoryId) counts[it.categoryId] = (counts[it.categoryId] || 0) + 1; }
        this.stockCounts = counts;
      }).catch(() => {});
    },
    getStockCount(categoryId) { return this.stockCounts[categoryId] || 0; },
    getStockStatus(count) {
      if (count <= 20) return { label: "Low Stock", cls: "st-low" };
      if (count <= 100) return { label: "Adequate Stock", cls: "st-adequate" };
      return { label: "Well Stocked", cls: "st-well" };
    },
    viewItems(item) {
      this.viewCategoryData = item;
      this.categoryItems = [];
      this.dialogViewItems = true;
      this.categoryItemsLoading = true;
      this.axiosCall("/jewelry-items?categoryId=" + item.id, "GET")
        .then((r) => { if (r && r.data) this.categoryItems = r.data; })
        .catch(() => {})
        .finally(() => { this.categoryItemsLoading = false; });
    },
    initialize() { this.loading = true; this.axiosCall("/categories", "GET").then((r) => { if (r && r.data) this.data = r.data; }).catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load", top: 10 }; }).finally(() => { this.loading = false; }); },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(i) { this.updateData = { ...i }; this.action = "Update"; },
    deleteItem(i) { this.dialogConfirmDelete = true; this.deleteData = i; },
    confirmDelete() { this.deleting = true; this.axiosCall("/categories/" + this.deleteData.id, "DELETE").then((r) => { if (r && (r.status === 200 || r.status === 204)) { this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Deleted", top: 10 }; this.dialogConfirmDelete = false; this.deleteData = null; this.initialize(); } }).catch((e) => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: e?.response?.data?.message || "Failed", top: 10 }; }).finally(() => { this.deleting = false; }); },
  },
};
</script>
<style scoped>
.theia-view{font-family:'Outfit',sans-serif;color:#3A2515;position:relative;z-index:1}.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}.page-heading{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#3A2515}.page-sub{font-size:12px;color:#9A7858;margin-top:2px}.header-actions{display:flex;align-items:center;gap:10px}.search-wrap{display:flex;align-items:center;gap:8px;background:#FDFAF6;border:1px solid rgba(155,107,58,.16);border-radius:9px;padding:8px 13px;box-shadow:0 1px 6px rgba(80,30,10,.08);min-width:210px}.search-input-proto{border:none;background:none;outline:none;font-size:13px;font-family:'Outfit';color:#3A2515;width:100%}.search-input-proto::placeholder{color:#9A7858}.btn-add{display:flex;align-items:center;gap:7px;background:#9B6B3A;color:#FDFAF6;border:none;padding:9px 16px;border-radius:9px;font-size:12px;font-weight:600;font-family:'Outfit';cursor:pointer;letter-spacing:.04em;box-shadow:0 2px 8px rgba(155,107,58,.3);transition:background .13s}.btn-add:hover{background:#C49455}.cust-table-card{background:#FDFAF6;border:1px solid rgba(155,107,58,.16);border-radius:16px;box-shadow:0 2px 14px rgba(80,30,10,.08);overflow:hidden}.tbl-wrap{overflow-x:auto}.cust-table{width:100%;border-collapse:collapse;font-size:13px;min-width:700px}.cust-table thead th{text-align:left;padding:10px 16px;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#9A7858;font-weight:600;background:#F5EFE4;white-space:nowrap}.cust-table tbody tr{border-top:1px solid rgba(155,107,58,.16);transition:background .1s}.cust-table tbody tr:hover{background:#EDE0CC}.cust-table tbody td{padding:11px 16px;color:#3A2515;white-space:nowrap;vertical-align:middle}td.mono{font-family:monospace;font-size:12px;color:#9B6B3A;font-weight:600}.dim{color:#9A7858;font-size:12px}.cust-name{font-weight:500}.txt-truncate{max-width:200px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.repeat-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500}.r-primary{background:rgba(155,107,58,.12);color:#9B6B3A}.act-btns{display:flex;align-items:center;gap:4px}.act-btn{width:27px;height:27px;border-radius:7px;border:1px solid rgba(155,107,58,.16);background:#F5EFE4;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s;color:#9A7858}.act-btn:hover{border-color:#C49455;color:#9B6B3A;background:#EDE0CC}.act-btn.del:hover{border-color:rgba(184,64,64,.4);color:#B84040;background:rgba(184,64,64,.06)}.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 20px;gap:10px;color:#9A7858}.empty-icon{width:48px;height:48px;border-radius:13px;background:#EDE0CC;display:flex;align-items:center;justify-content:center}.empty-title{font-size:14px;font-weight:500;color:#6B4A30}.btn-cancel-proto{background:none;border:1px solid rgba(155,107,58,.16);padding:8px 16px;border-radius:8px;font-size:13px;font-family:'Outfit';color:#9A7858;cursor:pointer;margin-right:8px}.btn-danger-proto{background:#B84040;color:#FDFAF6;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:'Outfit';cursor:pointer}
.cat-row{cursor:pointer}
.cat-items-card{border-radius:16px!important;border:1px solid rgba(155,107,58,.16)!important;overflow:hidden;background:#FDFAF6!important;font-family:'Outfit',sans-serif}
.cat-items-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;background:#F5EFE4;border-bottom:1px solid rgba(155,107,58,.16);position:relative}
.cat-items-title{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#3A2515}
.cat-items-sub{font-size:12px;color:#9A7858;margin-top:2px}
.ph-close{background:none;border:none;cursor:pointer;color:#9A7858;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;transition:all .12s}
.ph-close:hover{background:rgba(155,107,58,.12);color:#6B4A30}
.cat-items-tbl-wrap{max-height:60vh;overflow-y:auto}
.text-right{text-align:right}
.amt-col{color:#9B6B3A;font-weight:600}
.status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500}
.st-IN_STOCK{background:rgba(61,122,90,.1);color:#3D7A5A}
.st-SOLD{background:rgba(91,124,156,.12);color:#5B7C9C}
.st-TRANSFERRED{background:rgba(204,122,53,.12);color:#C4720E}
.st-CONSIGNMENT{background:rgba(140,110,180,.14);color:#7A569B}
.st-LAYAWAY{background:rgba(46,142,156,.12);color:#2E8E9C}
.st-INSTALLMENT{background:rgba(91,124,156,.12);color:#5B7C9C}
.st-PULLED_OUT{background:rgba(120,120,140,.12);color:#5A5A72}
.st-RESERVED{background:rgba(196,148,85,.15);color:#9B6B3A}
.st-FOR_PREORDER{background:rgba(155,107,58,.1);color:#9B6B3A}
.stock-count{margin-left:6px;font-size:11px}
.st-low{background:rgba(184,64,64,.1);color:#B84040}
.st-adequate{background:rgba(196,148,85,.15);color:#9B6B3A}
.st-well{background:rgba(61,122,90,.1);color:#3D7A5A}
</style>
