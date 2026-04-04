<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="800px">
      <v-form ref="PaymentRemindersFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Payment Reminder</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- References -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    References
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="layawayPlanId"
                    :items="layawayPlans"
                    :item-title="(item) => item.planNumber"
                    item-value="id"
                    label="Layaway Plan"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select the layaway plan"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="customerId"
                    :items="customers"
                    :item-title="(item) => `${item.firstName} ${item.lastName}`"
                    item-value="id"
                    label="Customer"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select customer"
                    persistent-hint
                  />
                </v-col>

                <!-- Reminder Settings -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Reminder Settings
                  </h3>
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="reminderType"
                    :items="reminderTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Reminder Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Type of reminder"
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
                    hint="Reminder status"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="channel"
                    :items="channelOptions"
                    item-title="label"
                    item-value="value"
                    label="Channel"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Communication channel"
                    persistent-hint
                  />
                </v-col>

                <!-- Schedule & Payment -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Schedule & Payment
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="scheduledDate"
                    label="Scheduled Date"
                    type="datetime-local"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="When to send reminder"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="sentDate"
                    label="Sent Date"
                    type="datetime-local"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="When reminder was sent (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="paymentDueDate"
                    label="Payment Due Date"
                    type="date"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Due date for the payment"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="amountDue"
                    label="Amount Due"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    prefix="₱"
                    hint="Amount due for this payment"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="daysBeforeDue"
                    label="Days Before Due"
                    type="number"
                    min="0"
                    outlined
                    dense
                    color="primary"
                    hint="Days before the due date"
                    persistent-hint
                  />
                </v-col>

                <!-- Message -->
                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="message"
                    label="Message"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="3"
                    hint="Reminder message content"
                    persistent-hint
                  />
                </v-col>

                <!-- Notes -->
                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="notes"
                    label="Notes"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="2"
                    hint="Additional notes"
                    persistent-hint
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
      layawayPlanId: null,
      customerId: null,
      reminderType: 'upcoming',
      status: 'pending',
      channel: 'sms',
      scheduledDate: null,
      sentDate: null,
      message: null,
      paymentDueDate: null,
      amountDue: null,
      daysBeforeDue: 0,
      notes: null,

      layawayPlans: [],
      customers: [],

      reminderTypeOptions: [
        { label: "Upcoming", value: "upcoming" },
        { label: "Due", value: "due" },
        { label: "Overdue", value: "overdue" },
        { label: "Final Notice", value: "final_notice" },
      ],

      statusOptions: [
        { label: "Pending", value: "pending" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" },
      ],

      channelOptions: [
        { label: "SMS", value: "sms" },
        { label: "Email", value: "email" },
        { label: "Phone Call", value: "phone_call" },
        { label: "In Person", value: "in_person" },
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
        this.$refs.PaymentRemindersFormref?.resetValidation();

        if (data && data.id) {
          this.id = data.id;
          this.layawayPlanId = data.layawayPlanId;
          this.customerId = data.customerId;
          this.reminderType = data.reminderType || 'upcoming';
          this.status = data.status || 'pending';
          this.channel = data.channel || 'sms';
          this.scheduledDate = data.scheduledDate ? this.formatDateTimeForInput(data.scheduledDate) : null;
          this.sentDate = data.sentDate ? this.formatDateTimeForInput(data.sentDate) : null;
          this.message = data.message;
          this.paymentDueDate = data.paymentDueDate ? this.formatDateForInput(data.paymentDueDate) : null;
          this.amountDue = data.amountDue;
          this.daysBeforeDue = data.daysBeforeDue || 0;
          this.notes = data.notes;
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
      this.layawayPlanId = null;
      this.customerId = null;
      this.reminderType = 'upcoming';
      this.status = 'pending';
      this.channel = 'sms';
      this.scheduledDate = this.getCurrentDateTime();
      this.sentDate = null;
      this.message = null;
      this.paymentDueDate = null;
      this.amountDue = null;
      this.daysBeforeDue = 3;
      this.notes = null;
    },

    getCurrentDateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
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
      this.axiosCall("/layaway-plans", "GET")
        .then((res) => {
          if (res && res.data) {
            this.layawayPlans = res.data;
          }
        })
        .catch((error) => console.error("Failed to load layaway plans:", error));

      this.axiosCall("/customers", "GET")
        .then((res) => {
          if (res && res.data) {
            this.customers = res.data;
          }
        })
        .catch((error) => console.error("Failed to load customers:", error));
    },

    closeD() {
      eventBus.emit("closePaymentRemindersDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.PaymentRemindersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        layawayPlanId: this.layawayPlanId,
        customerId: this.customerId,
        reminderType: this.reminderType,
        status: this.status,
        channel: this.channel,
        scheduledDate: this.scheduledDate,
        sentDate: this.sentDate || null,
        message: this.message || null,
        paymentDueDate: this.paymentDueDate,
        amountDue: this.amountDue,
        daysBeforeDue: this.daysBeforeDue || 0,
        daysOverdue: 0,
        notes: this.notes || null,
      };

      this.axiosCall("/payment-reminders", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment reminder created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create payment reminder";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create payment reminder";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.PaymentRemindersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        layawayPlanId: this.layawayPlanId,
        customerId: this.customerId,
        reminderType: this.reminderType,
        status: this.status,
        channel: this.channel,
        scheduledDate: this.scheduledDate,
        sentDate: this.sentDate || null,
        message: this.message || null,
        paymentDueDate: this.paymentDueDate,
        amountDue: this.amountDue,
        daysBeforeDue: this.daysBeforeDue || 0,
        notes: this.notes || null,
      };

      this.axiosCall("/payment-reminders/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Payment reminder updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update payment reminder";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update payment reminder";
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
