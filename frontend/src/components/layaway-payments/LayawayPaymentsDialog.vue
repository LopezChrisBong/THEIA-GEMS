<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" color="primary" dark>
        <v-icon left>mdi-plus</v-icon>
        New Layaway Payment
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        <span>{{ formTitle }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeD">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.receiptNumber"
                  label="Receipt Number *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="grey-lighten-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.paymentNumber"
                  label="Payment Number *"
                  :rules="[rules.required, rules.positiveNumber]"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.layawayPlanId"
                  :items="layawayPlans"
                  item-title="displayName"
                  item-value="id"
                  label="Layaway Plan *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:modelValue="onLayawayPlanChange"
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.paymentDate"
                  label="Payment Date *"
                  :rules="[rules.required]"
                  type="datetime-local"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.amount"
                  label="Amount *"
                  :rules="[rules.required, rules.positiveNumber]"
                  type="number"
                  step="0.01"
                  min="0.01"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  @input="calculateBalanceAfter"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.paymentMethod"
                  :items="paymentMethods"
                  item-title="text"
                  item-value="value"
                  label="Payment Method *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.referenceNumber"
                  label="Reference Number"
                  variant="outlined"
                  density="compact"
                  placeholder="Check number, transaction ID, etc."
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.balanceBefore"
                  label="Balance Before"
                  type="number"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="grey-lighten-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.balanceAfter"
                  label="Balance After"
                  type="number"
                  prefix="₱"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="grey-lighten-3"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.notes"
                  label="Notes"
                  variant="outlined"
                  density="compact"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeD">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" @click="save" :disabled="!valid">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  name: "LayawayPaymentsDialog",
  data() {
    return {
      dialog: false,
      valid: false,
      editedIndex: -1,
      editedItem: {
        receiptNumber: "",
        layawayPlanId: null,
        receivedBy: null,
        amount: 0,
        paymentMethod: "cash",
        referenceNumber: "",
        paymentDate: "",
        paymentNumber: 1,
        balanceBefore: 0,
        balanceAfter: 0,
        notes: "",
      },
      defaultItem: {
        receiptNumber: "",
        layawayPlanId: null,
        receivedBy: null,
        amount: 0,
        paymentMethod: "cash",
        referenceNumber: "",
        paymentDate: "",
        paymentNumber: 1,
        balanceBefore: 0,
        balanceAfter: 0,
        notes: "",
      },
      layawayPlans: [],
      paymentMethods: [
        { text: "Cash", value: "cash" },
        { text: "Credit Card", value: "credit_card" },
        { text: "Debit Card", value: "debit_card" },
        { text: "Bank Transfer", value: "bank_transfer" },
        { text: "GCash", value: "gcash" },
        { text: "Maya", value: "maya" },
        { text: "Check", value: "check" },
        { text: "Other", value: "other" },
      ],
      rules: {
        required: (v) => !!v || v === 0 || "This field is required",
        positiveNumber: (v) => (v && v > 0) || "Must be greater than 0",
      },
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Layaway Payment" : "Edit Layaway Payment";
    },
    currentUserId() {
      return Number(this.$store.state.user?.userID || this.$store.state.user?.id) || null;
    },
  },
  watch: {
    dialog(val) {
      if (val && this.editedIndex === -1) {
        this.generateReceiptNumber();
        this.setCurrentDateTime();
        this.editedItem.receivedBy = this.currentUserId;
      }
      val || this.closeD();
    },
  },
  mounted() {
    this.loadDropdowns();
    eventBus.on("editLayawayPayment", (item) => {
      this.editedIndex = item.id;
      this.editedItem = Object.assign({}, item);
      this.editedItem.layawayPlanId = item.layawayPlan?.id || item.layawayPlanId;
      this.editedItem.receivedBy = item.receiver?.id || item.receivedBy;
      if (item.paymentDate) {
        this.editedItem.paymentDate = this.formatDateTimeLocal(item.paymentDate);
      }
      this.dialog = true;
    });
  },
  beforeUnmount() {
    eventBus.off("editLayawayPayment");
  },
  methods: {
    async loadDropdowns() {
      try {
        const plansRes = await this.axiosCall("/layaway-plans", "GET");
        if (plansRes.data) {
          this.layawayPlans = plansRes.data.map((p) => ({
            ...p,
            displayName: `${p.planNumber} - ${p.customer?.firstName || ""} ${p.customer?.lastName || ""} (₱${parseFloat(p.remainingBalance || 0).toLocaleString()})`,
          }));
        }
      } catch (error) {
        console.error("Error loading dropdowns:", error);
      }
    },
    generateReceiptNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      this.editedItem.receiptNumber = `LPR-${year}${month}${day}-${random}`;
    },
    setCurrentDateTime() {
      const now = new Date();
      this.editedItem.paymentDate = this.formatDateTimeLocal(now);
    },
    formatDateTimeLocal(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    onLayawayPlanChange() {
      const selectedPlan = this.layawayPlans.find(
        (p) => p.id === this.editedItem.layawayPlanId
      );
      if (selectedPlan) {
        this.editedItem.balanceBefore = parseFloat(selectedPlan.remainingBalance || 0);
        this.editedItem.paymentNumber = (selectedPlan.paymentsMade || 0) + 1;
        this.calculateBalanceAfter();
      } else {
        this.editedItem.balanceBefore = 0;
        this.editedItem.balanceAfter = 0;
        this.editedItem.paymentNumber = 1;
      }
    },
    calculateBalanceAfter() {
      const balanceBefore = parseFloat(this.editedItem.balanceBefore) || 0;
      const amount = parseFloat(this.editedItem.amount) || 0;
      this.editedItem.balanceAfter = Math.max(0, balanceBefore - amount).toFixed(2);
    },
    closeD() {
      eventBus.emit("closeLayawayPaymentsDialog", false);
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    async save() {
      if (!this.$refs.form.validate()) return;

      try {
        let response;
        if (this.editedIndex > -1) {
          response = await this.axiosCall(
            `/layaway-payments/${this.editedIndex}`,
            "PATCH",
            this.editedItem
          );
        } else {
          response = await this.axiosCall("/layaway-payments", "POST", this.editedItem);
        }

        if (response.data) {
          this.closeD();
        }
      } catch (error) {
        console.error("Error saving layaway payment:", error);
      }
    },
  },
};
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
</style>
