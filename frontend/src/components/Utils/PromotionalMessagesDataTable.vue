<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div>
        <div class="page-heading">Promotional Messages</div>
        <div class="page-sub">Manage marketing and promotional communications</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search messages..." class="search-input-proto" />
        </div>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          New Message
        </button>
      </div>
    </div>

    <div class="cust-table-card">
      <div class="filter-row">
        <button class="filter-chip" :class="{ on: filterStatus === null }" @click="filterStatus = null">All</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'draft' }" @click="filterStatus = 'draft'">Draft</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'scheduled' }" @click="filterStatus = 'scheduled'">Scheduled</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'sent' }" @click="filterStatus = 'sent'">Sent</button>
        <button class="filter-chip" :class="{ on: filterStatus === 'failed' }" @click="filterStatus = 'failed'">Failed</button>
        <div class="filter-spacer" />
      </div>

      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th>Type</th>
              <th>Recipient</th>
              <th>Method</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Sent At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredData" :key="item.id">
              <td><span class="repeat-badge" :class="'r-type-' + item.messageType">{{ formatMessageType(item.messageType) }}</span></td>
              <td>
                <span v-if="item.customer" class="cust-name">{{ item.customer.firstName }} {{ item.customer.lastName }}</span>
                <span v-else class="dim" style="font-style: italic;">Broadcast</span>
              </td>
              <td><span class="repeat-badge r-method">{{ formatSendMethod(item.sendMethod) }}</span></td>
              <td>
                <span v-if="item.subject" style="max-width: 140px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.subject }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>
                <span style="max-width: 180px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.messageContent }}</span>
              </td>
              <td><span class="repeat-badge" :class="'r-' + item.status">{{ formatStatus(item.status) }}</span></td>
              <td class="dim">{{ formatDateTime(item.scheduledDate) }}</td>
              <td class="dim">{{ formatDateTime(item.sentAt) }}</td>
              <td>
                <div class="act-btns">
                  <button class="act-btn" title="Edit" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)" :disabled="item.status === 'sent'"><v-icon size="14">mdi-delete-outline</v-icon></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-message-text-outline</v-icon></div>
                  <div class="empty-title">No promotional messages found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading messages...</div>
        </div>
      </div>
    </div>

    <PromotionalMessagesDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text style="color: #6B4A30;">Are you sure you want to delete this promotional message?</v-card-text>
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
import PromotionalMessagesDialog from "../../components/Dialogs/Forms/PromotionalMessagesDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: { PromotionalMessagesDialog },
  data: () => ({
    search: "", filterStatus: null, data: [], deleteData: null, updateData: null,
    loading: false, deleting: false, action: null, dialogConfirmDelete: false,
    fadeAwayMessage: { show: false, type: "success", header: "Success", message: "", top: 10 },
  }),
  computed: {
    filteredData() {
      let result = [...this.data];
      if (this.filterStatus) result = result.filter((m) => m.status === this.filterStatus);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((m) =>
          [m.subject, m.messageContent, m.customer?.firstName, m.customer?.lastName, m.status].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
        );
      }
      return result;
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closePromotionalMessagesDialog", () => this.initialize());
  },
  beforeUnmount() { eventBus.off("closePromotionalMessagesDialog"); },
  methods: {
    formatDateTime(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); },
    formatStatus(s) { if (!s) return "—"; return s.charAt(0).toUpperCase() + s.slice(1); },
    formatMessageType(t) { if (!t) return "—"; return t.charAt(0).toUpperCase() + t.slice(1); },
    formatSendMethod(m) { return { email: "Email", sms: "SMS", both: "Both" }[m] || m || "—"; },
    initialize() {
      this.loading = true;
      this.axiosCall("/promotional-messages", "GET").then((r) => { if (r && r.data) this.data = r.data; })
        .catch(() => { this.fadeAwayMessage = { show: true, type: "error", header: "Error", message: "Failed to load messages", top: 10 }; })
        .finally(() => { this.loading = false; });
    },
    addNew() { this.updateData = { id: null }; this.action = "Add"; },
    editItem(item) { this.updateData = { ...item }; this.action = "Update"; },
    deleteItem(item) { this.dialogConfirmDelete = true; this.deleteData = item; },
    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/promotional-messages/" + this.deleteData.id, "DELETE")
        .then((r) => { if (r && (r.status === 200 || r.status === 204)) { this.fadeAwayMessage = { show: true, type: "success", header: "Success", message: "Message deleted", top: 10 }; this.dialogConfirmDelete = false; this.deleteData = null; this.initialize(); } })
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
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px; }
.cust-table thead th { text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4; white-space: nowrap; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }
.dim { color: #9A7858; font-size: 12px; }
.cust-name { font-weight: 500; }
.repeat-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.r-type-promotional { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-type-reminder { background: rgba(155,107,58,0.1); color: #9B6B3A; }
.r-type-announcement { background: rgba(90,122,155,0.1); color: #5A7A9B; }
.r-method { background: rgba(155,107,58,0.08); color: #9B6B3A; }
.r-draft { background: rgba(154,120,88,0.1); color: #9A7858; }
.r-scheduled { background: rgba(90,122,155,0.1); color: #5A7A9B; }
.r-sent { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.r-failed { background: rgba(184,64,64,0.08); color: #B84040; }
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn { width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; color: #9A7858; }
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }
.act-btn[disabled] { opacity: 0.3; cursor: default; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }
.btn-cancel-proto { background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: 'Outfit'; color: #9A7858; cursor: pointer; margin-right: 8px; }
.btn-danger-proto { background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; }
</style>
