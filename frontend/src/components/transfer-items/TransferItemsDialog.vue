<template>
  <v-dialog v-model="dialog" max-width="700px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" color="#8e6e25" prepend-icon="mdi-plus" rounded="lg" elevation="1">
        Add Transfer Item
      </v-btn>
    </template>
    <v-card class="rounded-lg">
      <v-card-title class="dialog-header px-6 py-4">
        <span class="text-h6 font-weight-medium">{{ formTitle }}</span>
        <v-spacer />
        <v-btn icon size="small" variant="text" @click="closeD">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-6 px-6">
        <v-container fluid>
          <v-form ref="form" v-model="valid">
            <v-row dense>
              <!-- Transfer -->
              <v-col cols="12" class="mb-4">
                <v-autocomplete
                  v-model="editedItem.transferId"
                  :items="transfers"
                  item-title="displayName"
                  item-value="id"
                  label="Transfer"
                  :rules="[rules.required]"
                  outlined
                  dense
                  color="primary"
                  hint="Select the transfer this item belongs to"
                  persistent-hint
                />
              </v-col>

              <!-- Item -->
              <v-col cols="12" class="mb-4">
                <v-autocomplete
                  v-model="editedItem.jewelryItemId"
                  :items="jewelryItems"
                  :item-title="(item) => `${item.itemCode}${item.brand ? ' - ' + item.brand : ''}${item.category ? ' (' + item.category.categoryName + ')' : ''}`"
                  item-value="id"
                  label="Item"
                  :rules="[rules.required]"
                  outlined
                  dense
                  color="primary"
                  hint="Select the inventory item to transfer"
                  persistent-hint
                />
              </v-col>

              <!-- Quantity -->
              <v-col cols="12" md="4" class="mb-4">
                <v-text-field
                  v-model.number="editedItem.quantity"
                  label="Quantity"
                  type="number"
                  min="1"
                  :rules="[(v) => v >= 1 || 'Must be at least 1']"
                  outlined
                  dense
                  color="primary"
                  hint="Number of pieces"
                  persistent-hint
                />
              </v-col>

              <!-- Notes -->
              <v-col cols="12" class="mb-4">
                <v-textarea
                  v-model="editedItem.notes"
                  label="Notes"
                  outlined
                  dense
                  clearable
                  color="primary"
                  rows="3"
                  hint="Additional notes (optional)"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4 justify-end">
        <v-btn variant="text" color="red" rounded="lg" @click="closeD">
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          rounded
          elevation="2"
          @click="save"
          :disabled="!valid"
          :loading="loading"
        >
          <v-icon left>mdi-check-circle</v-icon>
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import eventBus from "@/eventBus";

export default {
  name: "TransferItemsDialog",
  data() {
    return {
      dialog: false,
      valid: false,
      loading: false,
      editedIndex: -1,
      editedItem: {
        transferId: null,
        jewelryItemId: null,
        quantity: 1,
        notes: "",
      },
      defaultItem: {
        transferId: null,
        jewelryItemId: null,
        quantity: 1,
        notes: "",
      },
      transfers: [],
      jewelryItems: [],
      rules: {
        required: (v) => !!v || "This field is required",
      },
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Add Transfer Item" : "Edit Transfer Item";
    },
  },
  watch: {
    dialog(val) {
      if (val) this.loadDropdowns();
    },
  },
  mounted() {
    this.loadDropdowns();
    eventBus.on("editTransferItem", (item) => {
      this.editedIndex = item.id;
      this.editedItem = {
        transferId: item.transferId,
        jewelryItemId: item.jewelryItemId,
        quantity: item.quantity ?? 1,
        notes: item.notes || "",
      };
      this.dialog = true;
    });
  },
  beforeUnmount() {
    eventBus.off("editTransferItem");
  },
  methods: {
    async loadDropdowns() {
      try {
        const [transfersRes, itemsRes] = await Promise.all([
          this.axiosCall("/transfers", "GET"),
          this.axiosCall("/jewelry-items", "GET"),
        ]);

        if (transfersRes && transfersRes.data) {
          this.transfers = transfersRes.data.map((t) => ({
            ...t,
            displayName: `${t.transferNumber} (${t.fromBranch?.branchName || "N/A"} → ${t.toBranch?.branchName || "N/A"})`,
          }));
        }
        if (itemsRes && itemsRes.data) {
          this.jewelryItems = itemsRes.data;
        }
      } catch (error) {
        console.error("Error loading dropdowns:", error);
      }
    },

    closeD() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
      eventBus.emit("closeTransferItemsDialog", false);
    },

    async save() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.loading = true;
      try {
        const payload = {
          transferId: this.editedItem.transferId,
          jewelryItemId: this.editedItem.jewelryItemId,
          quantity: this.editedItem.quantity || 1,
          notes: this.editedItem.notes || null,
        };

        if (this.editedIndex > -1) {
          await this.axiosCall(
            `/transfer-items/${this.editedIndex}`,
            "PATCH",
            payload
          );
        } else {
          await this.axiosCall("/transfer-items", "POST", payload);
        }
        this.closeD();
      } catch (error) {
        console.error("Error saving transfer item:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.dialog-header {
  min-height: 56px;
  display: flex;
  align-items: center;
}
</style>
