<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Notifications Test Center</div>
        <div class="page-sub">Manually trigger and verify scheduled reminders, emails, and SMS — for testing only</div>
      </div>
    </div>

    <!-- ── SECTION A: SCHEDULED REMINDER JOBS ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Scheduled Reminder Jobs</div>
          <div class="section-sub">Runs the real daily cron logic right now, against live data in the database</div>
        </div>
      </div>

      <div class="job-grid">
        <div class="job-card" v-for="job in jobs" :key="job.key">
          <div class="job-icon"><v-icon size="18" color="#9B6B3A">{{ job.icon }}</v-icon></div>
          <div class="job-title">{{ job.title }}</div>
          <div class="job-desc">{{ job.desc }}</div>
          <button class="btn-run" :disabled="job.running" @click="runJob(job)">
            <span v-if="job.running" class="spin"></span>
            {{ job.running ? "Running..." : "Run Now" }}
          </button>
          <div v-if="job.lastResult" class="job-result" :class="job.lastError ? 'err' : 'ok'">
            {{ job.lastResult }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION B: EMAIL TEMPLATE TESTER ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Email Template Tester</div>
          <div class="section-sub">Fires any email template with sample data to an address you choose</div>
        </div>
      </div>

      <div class="tester-grid">
        <div>
          <div class="fld-lbl">Template</div>
          <select v-model="emailTemplate" class="fld-inp">
            <option v-for="t in emailTemplates" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <div class="fld-lbl">Send To (email)</div>
          <input v-model="testEmail" class="fld-inp" type="email" placeholder="you@example.com" />
        </div>
      </div>

      <div class="advanced-toggle" @click="showOverride = !showOverride">
        <v-icon size="13">{{ showOverride ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        {{ showOverride ? "Hide" : "Show" }} sample data overrides (optional)
      </div>
      <div v-if="showOverride" class="override-wrap">
        <textarea
          v-model="overrideJson"
          class="fld-inp override-area"
          rows="6"
          placeholder='{ "customerName": "Test Name", "amountDue": 1000 }'
        ></textarea>
        <div class="fld-hint">Leave blank to use built-in sample values. Must be valid JSON if filled in.</div>
      </div>

      <button class="btn-send" :disabled="sendingEmail || !testEmail" @click="sendTestEmail">
        <span v-if="sendingEmail" class="spin"></span>
        {{ sendingEmail ? "Sending..." : "Send Test Email" }}
      </button>
    </div>

    <!-- ── SECTION C: SMS TESTER ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">SMS Tester</div>
          <div class="section-sub">Sends a real SMS via Semaphore to verify text reminders</div>
        </div>
      </div>

      <div class="tester-grid">
        <div>
          <div class="fld-lbl">Quick Template</div>
          <select v-model="smsPreset" class="fld-inp" @change="applySmsPreset">
            <option value="custom">Custom message</option>
            <option value="layaway_reminder">Layaway Reminder (sample)</option>
            <option value="layaway_overdue">Layaway Overdue (sample)</option>
          </select>
        </div>
        <div>
          <div class="fld-lbl">Recipient Phone</div>
          <input v-model="testPhone" class="fld-inp" type="text" placeholder="09171234567" />
        </div>
      </div>

      <div class="fld-lbl" style="margin-top:10px">Message</div>
      <textarea v-model="testSmsMessage" class="fld-inp override-area" rows="5"></textarea>

      <button class="btn-send" :disabled="sendingSms || !testPhone || !testSmsMessage" @click="sendTestSms">
        <span v-if="sendingSms" class="spin"></span>
        {{ sendingSms ? "Sending..." : "Send Test SMS" }}
      </button>
    </div>

    <!-- ── ACTIVITY LOG ── -->
    <div class="section-card">
      <div class="section-hdr">
        <div>
          <div class="section-title">Activity Log</div>
          <div class="section-sub">Results from this session — cleared on page reload</div>
        </div>
        <button class="btn-clear" v-if="activityLog.length" @click="activityLog = []">Clear</button>
      </div>

      <div v-if="activityLog.length === 0" class="empty-state">
        <v-icon size="20" color="#C4A882">mdi-test-tube-empty</v-icon>
        <div class="empty-title">No tests run yet</div>
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
export default {
  name: "NotificationsTest",

  data() {
    return {
      jobs: [
        {
          key: "run-all",
          title: "Run All Daily Checks",
          desc: "Upcoming + overdue layaway reminders and aged consignment alert, in one sweep.",
          icon: "mdi-calendar-sync-outline",
          endpoint: "/scheduler/run-all",
          running: false,
          lastResult: "",
          lastError: false,
        },
        {
          key: "upcoming",
          title: "Upcoming Payment Reminders",
          desc: "Emails/SMS customers whose next layaway payment is due within 3 days.",
          icon: "mdi-bell-outline",
          endpoint: "/scheduler/upcoming-reminders",
          running: false,
          lastResult: "",
          lastError: false,
        },
        {
          key: "overdue",
          title: "Overdue Payment Alerts",
          desc: "Emails/SMS customers whose layaway payment is already past due.",
          icon: "mdi-alert-circle-outline",
          endpoint: "/scheduler/overdue-alerts",
          running: false,
          lastResult: "",
          lastError: false,
        },
        {
          key: "consignment",
          title: "Aged Consignment Alert",
          desc: "Emails the owner a digest of consignment items unsold for 40+ days.",
          icon: "mdi-clock-alert-outline",
          endpoint: "/scheduler/aged-consignment-alerts",
          running: false,
          lastResult: "",
          lastError: false,
        },
        {
          key: "sales-report",
          title: "Daily Sales Report (Owner)",
          desc: "Emails the owner today's sales broken down per branch, with every item sold attached as Excel (one sheet per branch). Runs nightly at 8 PM.",
          icon: "mdi-file-excel-outline",
          endpoint: "/scheduler/daily-sales-report",
          running: false,
          lastResult: "",
          lastError: false,
        },
      ],

      emailTemplates: [
        { value: "layaway_reminder", label: "Layaway Payment Reminder (upcoming)" },
        { value: "layaway_overdue", label: "Layaway Payment Overdue" },
        { value: "layaway_confirmation", label: "Layaway Plan Created Confirmation" },
        { value: "layaway_payment_confirmation", label: "Layaway Payment Received Confirmation" },
        { value: "transfer_notification", label: "Branch Transfer Notification" },
        { value: "consignment_auth", label: "Consignment Authenticity Result" },
        { value: "consignment_sold", label: "Consignment Item Sold Payout" },
        { value: "aged_consignment", label: "Aged Consignment Alert (Owner)" },
        { value: "promotional", label: "Promotional / Marketing Email" },
      ],
      emailTemplate: "layaway_reminder",
      testEmail: "",
      showOverride: false,
      overrideJson: "",
      sendingEmail: false,

      smsPreset: "custom",
      testPhone: "",
      testSmsMessage: "",
      sendingSms: false,

      activityLog: [],

      fadeAwayMessage: {
        show: false,
        type: "success",
        header: "",
        message: "",
        top: 10,
      },
    };
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

    async runJob(job) {
      job.running = true;
      job.lastError = false;
      try {
        const res = await this.axiosCall(job.endpoint, "POST", {});
        const data = res?.data;
        const summary = this.summarizeJobResult(data);
        job.lastResult = summary;
        this.addLog(job.title, true, summary);
        this.notify(true, "Job Complete", summary);
      } catch (error) {
        const msg = error?.response?.data?.message || "Failed to run job";
        job.lastResult = msg;
        job.lastError = true;
        this.addLog(job.title, false, msg);
        this.notify(false, "Job Failed", msg);
      } finally {
        job.running = false;
      }
    },

    summarizeJobResult(data) {
      if (!data) return "Done.";
      if (data.message) return data.message;
      if (data.upcoming || data.overdue || data.agedConsignment || data.salesReport) {
        const parts = [];
        if (data.upcoming) parts.push(`Upcoming: ${data.upcoming.message}`);
        if (data.overdue) parts.push(`Overdue: ${data.overdue.message}`);
        if (data.agedConsignment) parts.push(`Aged Consignment: ${data.agedConsignment.message}`);
        if (data.salesReport) parts.push(`Sales Report: ${data.salesReport.message}`);
        return parts.join(" / ");
      }
      return JSON.stringify(data);
    },

    async sendTestEmail() {
      let payload;
      if (this.overrideJson && this.overrideJson.trim()) {
        try {
          payload = JSON.parse(this.overrideJson);
        } catch (e) {
          this.notify(false, "Invalid JSON", "Sample data overrides must be valid JSON.");
          return;
        }
      }

      this.sendingEmail = true;
      try {
        await this.axiosCall("/mail/test-send", "POST", {
          template: this.emailTemplate,
          to: this.testEmail,
          payload,
        });
        const label = this.emailTemplates.find((t) => t.value === this.emailTemplate)?.label || this.emailTemplate;
        const msg = `Sent "${label}" to ${this.testEmail}`;
        this.addLog("Email Test", true, msg);
        this.notify(true, "Email Sent", msg);
      } catch (error) {
        const msg = error?.response?.data?.message || "Failed to send test email";
        this.addLog("Email Test", false, Array.isArray(msg) ? msg.join(", ") : msg);
        this.notify(false, "Send Failed", Array.isArray(msg) ? msg.join(", ") : msg);
      } finally {
        this.sendingEmail = false;
      }
    },

    applySmsPreset() {
      if (this.smsPreset === "layaway_reminder") {
        this.testSmsMessage = `Layaway Reminder!\n\nHi Juan Dela Cruz! 💎✨\n\nJust a gentle reminder that your next payment for your layaway item amounting to ₱2,500.00 is due on June 25, 2026.\n\nIf you've already settled this payment, please disregard this message. Should you need any assistance, feel free to reach out. 🤍\n\nThank you for choosing Theia Gems.\n\nWear your Memories. Wear Theia Gems.\nCristy`;
      } else if (this.smsPreset === "layaway_overdue") {
        this.testSmsMessage = `Overdue Reminder!\n\nHi Juan Dela Cruz! 💎✨\n\nA gentle reminder that your payment for your layaway item amounting to ₱2,500.00 is already overdue.\n\nKindly settle the payment at your earliest convenience to avoid any delays with your layaway plan. If payment has already been made, please disregard this message.\n\nThank you! 🤍\nTheia Gems`;
      } else {
        this.testSmsMessage = "";
      }
    },

    async sendTestSms() {
      this.sendingSms = true;
      try {
        await this.axiosCall("/sms/sendSmsSemaphore", "POST", {
          recipient: this.testPhone,
          message: this.testSmsMessage,
        });
        const msg = `Sent SMS to ${this.testPhone}`;
        this.addLog("SMS Test", true, msg);
        this.notify(true, "SMS Sent", msg);
      } catch (error) {
        const msg = error?.response?.data?.message || error?.message || "Failed to send test SMS";
        this.addLog("SMS Test", false, msg);
        this.notify(false, "Send Failed", msg);
      } finally {
        this.sendingSms = false;
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
.job-result {
  margin-top: 10px; font-size: 11px; padding: 6px 9px; border-radius: 7px;
}
.job-result.ok { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.job-result.err { background: rgba(184,64,64,0.1); color: #B84040; }

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
.fld-inp::placeholder { color: #9A7858; }
.override-area { font-family: monospace; font-size: 12px; resize: vertical; }
.fld-hint { font-size: 11px; color: #C4A882; margin-top: 5px; }

.advanced-toggle {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #9B6B3A; cursor: pointer; margin-top: 14px; width: fit-content;
}
.advanced-toggle:hover { color: #6B4A30; }
.override-wrap { margin-top: 10px; }

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
