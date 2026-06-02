<template>
  <v-dialog v-model="dialog" max-width="480px" persistent>
    <v-card class="action-card">
      <!-- Header -->
      <div class="action-header" :class="mode === 'dispatch' ? 'header-dispatch' : 'header-receive'">
        <v-icon size="20" color="white">{{ mode === 'dispatch' ? 'mdi-truck-delivery-outline' : 'mdi-package-variant-closed-check' }}</v-icon>
        <span class="action-title">{{ mode === 'dispatch' ? 'Dispatch Transfer' : 'Receive Transfer' }}</span>
      </div>

      <div class="action-body">
        <!-- Transfer summary -->
        <div class="transfer-summary">
          <div class="transfer-number">{{ transfer.transferNumber }}</div>
          <div class="transfer-route">
            <span class="branch-chip">{{ transfer.fromBranch?.branchName || '—' }}</span>
            <v-icon size="14" color="#9A7858">mdi-arrow-right</v-icon>
            <span class="branch-chip">{{ transfer.toBranch?.branchName || '—' }}</span>
          </div>
          <div class="transfer-meta" v-if="itemCount !== null">
            <v-icon size="12" color="#9A7858">mdi-package-variant</v-icon>
            {{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }} in this transfer
          </div>
        </div>

        <!-- Context message -->
        <div class="action-message" :class="mode === 'dispatch' ? 'msg-dispatch' : 'msg-receive'">
          <template v-if="mode === 'dispatch'">
            <strong>{{ actorName }}</strong> (<em>{{ transfer.fromBranch?.branchName }}</em>) will be recorded as the dispatcher.
            The transfer status will change to <strong>In Transit</strong>.
          </template>
          <template v-else>
            <strong>{{ actorName }}</strong> (<em>{{ transfer.toBranch?.branchName }}</em>) will be recorded as the receiver.
            Each item's branch will be updated to <strong>{{ transfer.toBranch?.branchName }}</strong> and inventory logs will be created.
          </template>
        </div>

        <!-- Action buttons -->
        <div class="action-footer">
          <button class="btn-cancel" @click="closeD">Cancel</button>
          <button
            class="btn-confirm"
            :class="mode === 'dispatch' ? 'btn-dispatch' : 'btn-receive'"
            @click="confirm"
            :disabled="loading"
          >
            <v-progress-circular v-if="loading" size="14" indeterminate color="white" class="mr-1" />
            <v-icon v-else size="15">{{ mode === 'dispatch' ? 'mdi-truck-delivery-outline' : 'mdi-check-circle-outline' }}</v-icon>
            {{ loading ? 'Processing...' : (mode === 'dispatch' ? 'Confirm Dispatch' : 'Confirm Receipt') }}
          </button>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  name: "DispatchReceiveTransferDialog",
  data() {
    return {
      dialog: false,
      loading: false,
      mode: "dispatch", // 'dispatch' | 'receive'
      transfer: {},
      itemCount: null,
    };
  },
  computed: {
    actorName() {
      const u = this.$store.state.user;
      if (!u) return "You";
      const fname = u.fname || u.firstName || "";
      const lname = u.lname || u.lastName || "";
      return [fname, lname].filter(Boolean).join(" ") || u.email || "You";
    },
    currentUserId() {
      return Number(this.$store.state.user?.userID || this.$store.state.user?.id);
    },
  },
  mounted() {
    eventBus.on("openDispatchDialog", (transfer) => {
      this.mode = "dispatch";
      this.transfer = transfer;
      this.dialog = true;
      this.loadItemCount(transfer.id);
    });
    eventBus.on("openReceiveDialog", (transfer) => {
      this.mode = "receive";
      this.transfer = transfer;
      this.dialog = true;
      this.loadItemCount(transfer.id);
    });
  },
  beforeUnmount() {
    eventBus.off("openDispatchDialog");
    eventBus.off("openReceiveDialog");
  },
  methods: {
    loadItemCount(transferId) {
      this.itemCount = null;
      this.axiosCall("/transfer-items/transfer/" + transferId + "/summary", "GET")
        .then((res) => { this.itemCount = res?.data?.totalItems ?? 0; })
        .catch(() => { this.itemCount = 0; });
    },

    closeD() {
      this.dialog = false;
      this.transfer = {};
      this.itemCount = null;
    },

    confirm() {
      this.loading = true;
      const userId = this.currentUserId;

      if (this.mode === "dispatch") {
        this.axiosCall("/transfers/" + this.transfer.id + "/in-transit", "PATCH", { transferredBy: userId })
          .then(() => {
            eventBus.emit("transferActionDone", { action: "dispatch", id: this.transfer.id });
            this.closeD();
          })
          .catch((e) => {
            eventBus.emit("transferActionError", e?.response?.data?.message || "Failed to dispatch transfer");
          })
          .finally(() => { this.loading = false; });
      } else {
        this.axiosCall("/transfers/" + this.transfer.id + "/receive", "PATCH", { receivedBy: userId })
          .then(() => {
            eventBus.emit("transferActionDone", { action: "receive", id: this.transfer.id });
            this.closeD();
          })
          .catch((e) => {
            eventBus.emit("transferActionError", e?.response?.data?.message || "Failed to receive transfer");
          })
          .finally(() => { this.loading = false; });
      }
    },
  },
};
</script>

<style scoped>
.action-card { border-radius: 16px !important; overflow: hidden; }
.action-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  font-family: 'Outfit', sans-serif;
}
.header-dispatch { background: linear-gradient(135deg, #9B6B3A, #C49455); }
.header-receive { background: linear-gradient(135deg, #3D7A5A, #5aab80); }
.action-title { font-size: 15px; font-weight: 600; color: white; }

.action-body { padding: 20px; font-family: 'Outfit', sans-serif; }

.transfer-summary {
  background: #F9F3EA;
  border: 1px solid rgba(155,107,58,0.14);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
}
.transfer-number { font-family: monospace; font-size: 13px; font-weight: 700; color: #9B6B3A; margin-bottom: 6px; }
.transfer-route { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.branch-chip {
  background: white;
  border: 1px solid rgba(155,107,58,0.2);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  color: #3A2515;
}
.transfer-meta { font-size: 11px; color: #9A7858; display: flex; align-items: center; gap: 4px; margin-top: 4px; }

.action-message {
  font-size: 13px;
  line-height: 1.5;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 20px;
}
.msg-dispatch { background: rgba(155,107,58,0.08); color: #6B4A30; border-left: 3px solid #9B6B3A; }
.msg-receive { background: rgba(61,122,90,0.08); color: #2a5a40; border-left: 3px solid #3D7A5A; }

.action-footer { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel {
  background: none;
  border: 1px solid rgba(155,107,58,0.2);
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Outfit';
  color: #9A7858;
  cursor: pointer;
}
.btn-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Outfit';
  color: white;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-confirm[disabled] { opacity: 0.6; cursor: default; }
.btn-dispatch { background: #9B6B3A; }
.btn-dispatch:hover:not([disabled]) { background: #C49455; }
.btn-receive { background: #3D7A5A; }
.btn-receive:hover:not([disabled]) { background: #5aab80; }
</style>
