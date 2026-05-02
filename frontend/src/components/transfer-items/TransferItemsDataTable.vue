<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Transfer Items</div>
        <div class="page-sub">Manage items within transfers</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search transfer items..." class="search-input-proto" />
        </div>
        <TransferItemsDialog />
      </div>
    </div>

    <div class="cust-table-card">
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th>Transfer</th>
              <th>Item</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td>
                <span v-if="item.transfer" class="repeat-badge r-primary">{{ item.transfer.transferNumber }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span v-if="item.jewelryItem" class="cust-name">{{ item.jewelryItem.itemCode }}</span>
                <br v-if="item.jewelryItem && item.jewelryItem.brand">
                <span v-if="item.jewelryItem && item.jewelryItem.brand" class="dim">{{ item.jewelryItem.brand }}</span>
                <span v-if="!item.jewelryItem" class="dim">—</span>
              </td>
              <td>
                <span v-if="item.notes" class="dim" style="max-width: 250px; display: inline-block; white-space: normal;">{{ item.notes }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-package-variant</v-icon></div>
                  <div class="empty-title">No transfer items found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading transfer items...</div>
        </div>
      </div>
    </div>

    <v-dialog v-model="dialogDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this transfer item?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="closeDelete">Cancel</button>
          <button class="btn-danger-proto" @click="deleteItemConfirm" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import eventBus from "@/eventBus";
import TransferItemsDialog from "./TransferItemsDialog.vue";

export default {
  name: "TransferItemsDataTable",
  components: { TransferItemsDialog },
  data: () => ({
    search: "", loading: false, deleting: false, transferItems: [], dialogDelete: false, deleteId: null,
  }),
  computed: {
    filteredData() {
      if (!this.search) return this.transferItems;
      const q = this.search.toLowerCase();
      return this.transferItems.filter((t) =>
        [t.transfer?.transferNumber, t.jewelryItem?.itemCode, t.notes].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
      );
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closeTransferItemsDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closeTransferItemsDialog"); },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const r = await this.axiosCall("/transfer-items", "GET");
        if (r && r.data) this.transferItems = r.data;
      } catch (e) { console.error("Error loading transfer items:", e); }
      finally { this.loading = false; }
    },
    editItem(item) { eventBus.emit("editTransferItem", item); },
    deleteItem(item) { this.deleteId = item.id; this.dialogDelete = true; },
    closeDelete() { this.dialogDelete = false; this.deleteId = null; },
    async deleteItemConfirm() {
      this.deleting = true;
      try { await this.axiosCall("/transfer-items/" + this.deleteId, "DELETE"); this.initialize(); }
      catch (e) { console.error("Error deleting:", e); }
      finally { this.deleting = false; this.closeDelete(); }
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
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; vertical-align: middle; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-primary { background: rgba(155,107,58,0.12); color: #9B6B3A; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit'; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; }
</style>
