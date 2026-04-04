<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        density="compact"
        variant="outlined"
        class="mr-4"
        style="max-width: 300px"
      ></v-text-field>
      <v-spacer></v-spacer>
      <LayawayPaymentsDialog />
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="layawayPayments"
      :search="search"
      :loading="loading"
      class="elevation-1"
      item-value="id"
    >
      <template v-slot:[`item.receiptNumber`]="{ item }">
        <v-chip color="primary" size="small" variant="outlined">
          {{ item.receiptNumber }}
        </v-chip>
      </template>

      <template v-slot:[`item.layawayPlan`]="{ item }">
        <div v-if="item.layawayPlan">
          <v-chip color="secondary" size="small" variant="tonal">
            {{ item.layawayPlan.planNumber }}
          </v-chip>
        </div>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.paymentNumber`]="{ item }">
        <v-chip color="info" size="small">
          #{{ item.paymentNumber }}
        </v-chip>
      </template>

      <template v-slot:[`item.amount`]="{ item }">
        <strong class="text-success">₱{{ formatCurrency(item.amount) }}</strong>
      </template>

      <template v-slot:[`item.paymentMethod`]="{ item }">
        <v-chip :color="getMethodColor(item.paymentMethod)" size="small">
          <v-icon start size="small">{{ getMethodIcon(item.paymentMethod) }}</v-icon>
          {{ formatMethod(item.paymentMethod) }}
        </v-chip>
      </template>

      <template v-slot:[`item.balanceBefore`]="{ item }">
        <span class="text-grey">₱{{ formatCurrency(item.balanceBefore) }}</span>
      </template>

      <template v-slot:[`item.balanceAfter`]="{ item }">
        <v-chip
          :color="parseFloat(item.balanceAfter) === 0 ? 'success' : 'warning'"
          size="small"
          variant="tonal"
        >
          ₱{{ formatCurrency(item.balanceAfter) }}
        </v-chip>
      </template>

      <template v-slot:[`item.receiver`]="{ item }">
        <span v-if="item.receiver">
          {{ item.receiver.first_name }} {{ item.receiver.last_name }}
        </span>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.paymentDate`]="{ item }">
        {{ formatDateTime(item.paymentDate) }}
      </template>

      <template v-slot:[`item.referenceNumber`]="{ item }">
        <code v-if="item.referenceNumber" class="text-caption">
          {{ item.referenceNumber }}
        </code>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          variant="text"
          @click="editItem(item)"
        >
          <v-icon size="small">mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          color="error"
          variant="text"
          @click="deleteItem(item)"
        >
          <v-icon size="small">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this layaway payment? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import eventBus from "@/eventBus";
import LayawayPaymentsDialog from "./LayawayPaymentsDialog.vue";

export default {
  name: "LayawayPaymentsDataTable",
  components: {
    LayawayPaymentsDialog,
  },
  data() {
    return {
      search: "",
      loading: false,
      layawayPayments: [],
      dialogDelete: false,
      deleteId: null,
      headers: [
        { title: "ID", key: "id", width: "70px" },
        { title: "Receipt #", key: "receiptNumber", width: "150px" },
        { title: "Layaway Plan", key: "layawayPlan", width: "140px" },
        { title: "Payment #", key: "paymentNumber", width: "100px" },
        { title: "Amount", key: "amount", width: "120px" },
        { title: "Method", key: "paymentMethod", width: "130px" },
        { title: "Before", key: "balanceBefore", width: "110px" },
        { title: "After", key: "balanceAfter", width: "110px" },
        { title: "Received By", key: "receiver", width: "140px" },
        { title: "Payment Date", key: "paymentDate", width: "150px" },
        { title: "Reference", key: "referenceNumber", width: "120px" },
        { title: "Actions", key: "actions", sortable: false, width: "100px" },
      ],
    };
  },
  mounted() {
    this.initialize();
    eventBus.on("closeLayawayPaymentsDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeLayawayPaymentsDialog");
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        const response = await this.axiosCall("/layaway-payments", "GET");
        if (response.data) {
          this.layawayPayments = response.data;
        }
      } catch (error) {
        console.error("Error loading layaway payments:", error);
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(value) {
      if (value === null || value === undefined) return "0.00";
      return parseFloat(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatDateTime(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString();
    },
    formatMethod(method) {
      if (!method) return "";
      return method
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
    getMethodColor(method) {
      const colors = {
        cash: "green",
        credit_card: "blue",
        debit_card: "indigo",
        bank_transfer: "purple",
        gcash: "blue-darken-3",
        maya: "green-darken-2",
        check: "orange",
        other: "grey",
      };
      return colors[method] || "grey";
    },
    getMethodIcon(method) {
      const icons = {
        cash: "mdi-cash",
        credit_card: "mdi-credit-card",
        debit_card: "mdi-credit-card-outline",
        bank_transfer: "mdi-bank-transfer",
        gcash: "mdi-cellphone",
        maya: "mdi-cellphone",
        check: "mdi-checkbook",
        other: "mdi-help-circle",
      };
      return icons[method] || "mdi-help-circle";
    },
    editItem(item) {
      eventBus.emit("editLayawayPayment", item);
    },
    deleteItem(item) {
      this.deleteId = item.id;
      this.dialogDelete = true;
    },
    closeDelete() {
      this.dialogDelete = false;
      this.deleteId = null;
    },
    async deleteItemConfirm() {
      try {
        await this.axiosCall(`/layaway-payments/${this.deleteId}`, "DELETE");
        this.initialize();
      } catch (error) {
        console.error("Error deleting layaway payment:", error);
      } finally {
        this.closeDelete();
      }
    },
  },
};
</script>

<style scoped>
</style>
