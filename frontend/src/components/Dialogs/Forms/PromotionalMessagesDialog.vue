<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="PromotionalMessagesFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Promotional Message</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Message Settings -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Message Settings
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="messageType"
                    :items="messageTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Message Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Type of message"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="sendMethod"
                    :items="sendMethodOptions"
                    item-title="label"
                    item-value="value"
                    label="Send Method"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="How to send"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Message status"
                    persistent-hint
                  />
                </v-col>

                <!-- Recipient -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Recipient
                  </h3>
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-autocomplete
                    v-model="customerId"
                    :items="customers"
                    :item-title="(item) => `${item.firstName} ${item.lastName} ${item.email ? '(' + item.email + ')' : ''}`"
                    item-value="id"
                    label="Customer"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Select customer (leave empty for broadcast)"
                    persistent-hint
                  />
                </v-col>

                <!-- Content -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Message Content
                  </h3>
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-text-field
                    v-model="subject"
                    label="Subject"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Email subject line (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="messageContent"
                    label="Message Content"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    rows="5"
                    hint="The message to send"
                    persistent-hint
                  />
                </v-col>

                <!-- Schedule -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Schedule
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="scheduledDate"
                    label="Scheduled Date"
                    type="datetime-local"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="When to send (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="sentAt"
                    label="Sent At"
                    type="datetime-local"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="When message was sent"
                    persistent-hint
                    :disabled="status !== 'sent'"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-divider />

          <!-- Actions -->
          <v-card-actions class="px-6 py-4 justify-end">
            <v-btn
              variant="text"
              color="red"
              rounded="lg"
              elevation="1"
              @click="closeD"
            >
              Cancel
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="action === 'Add'"
              color="primary"
              @click="add"
              rounded
              elevation="2"
              :loading="loading"
            >
              <v-icon left>mdi-check-circle</v-icon>
              Add
            </v-btn>

            <v-btn
              v-else-if="action === 'Update'"
              variant="text"
              color="primary"
              rounded="lg"
              elevation="1"
              @click="update"
              :loading="loading"
            >
              Update
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </div>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  props: {
    data: Object,
    action: String,
  },
  data() {
    return {
      dialog: false,
      loading: false,

      id: null,
      messageType: 'promotional',
      customerId: null,
      sendMethod: 'email',
      subject: null,
      messageContent: null,
      scheduledDate: null,
      status: 'draft',
      sentAt: null,

      customers: [],

      messageTypeOptions: [
        { label: "Promotional", value: "promotional" },
        { label: "Reminder", value: "reminder" },
        { label: "Announcement", value: "announcement" },
      ],

      sendMethodOptions: [
        { label: "Email", value: "email" },
        { label: "SMS", value: "sms" },
        { label: "Both", value: "both" },
      ],

      statusOptions: [
        { label: "Draft", value: "draft" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],

      fadeAwayMessage: {
        show: false,
        type: "success",
        header: "Successfully Added!",
        message: "",
        top: 10,
      },
    };
  },
  watch: {
    data: {
      handler(data) {
        this.dialog = true;
        this.loadDropdownData();
        this.$refs.PromotionalMessagesFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.messageType = data.messageType || 'promotional';
          this.customerId = data.customerId;
          this.sendMethod = data.sendMethod || 'email';
          this.subject = data.subject;
          this.messageContent = data.messageContent;
          this.scheduledDate = data.scheduledDate ? this.formatDateTimeForInput(data.scheduledDate) : null;
          this.status = data.status || 'draft';
          this.sentAt = data.sentAt ? this.formatDateTimeForInput(data.sentAt) : null;
        } else {
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.messageType = 'promotional';
      this.customerId = null;
      this.sendMethod = 'email';
      this.subject = null;
      this.messageContent = null;
      this.scheduledDate = null;
      this.status = 'draft';
      this.sentAt = null;
    },

    formatDateTimeForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    loadDropdownData() {
      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.customers = res.data;
          }
        })
        .catch((error) => console.error("Failed to load customers:", error));
    },

    closeD() {
      eventBus.emit("closePromotionalMessagesDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.PromotionalMessagesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        messageType: this.messageType,
        customerId: this.customerId || null,
        sendMethod: this.sendMethod,
        subject: this.subject || null,
        messageContent: this.messageContent,
        scheduledDate: this.scheduledDate ? new Date(this.scheduledDate).toISOString() : null,
        status: this.status,
        sentAt: this.sentAt ? new Date(this.sentAt).toISOString() : null,
        createdBy: Number(this.$store.state.user.userID),
      };

      this.axiosCall("/promotional-messages", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Promotional message created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create promotional message";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create promotional message";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.PromotionalMessagesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        messageType: this.messageType,
        customerId: this.customerId || null,
        sendMethod: this.sendMethod,
        subject: this.subject || null,
        messageContent: this.messageContent,
        scheduledDate: this.scheduledDate ? new Date(this.scheduledDate).toISOString() : null,
        status: this.status,
        sentAt: this.sentAt ? new Date(this.sentAt).toISOString() : null,
        createdBy: Number(this.$store.state.user.userID),
      };

      this.axiosCall("/promotional-messages/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Promotional message updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update promotional message";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update promotional message";
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>

<style scoped>
.dialog-header {
  min-height: 56px;
}

.v-text-field {
  font-size: 1rem;
}

.v-card {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

.v-card-actions > .v-btn {
  min-width: 120px;
}
</style>
