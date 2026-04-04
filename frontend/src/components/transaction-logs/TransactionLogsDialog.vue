<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" color="primary" dark>
        <v-icon left>mdi-plus</v-icon>
        New Transaction Log
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
                  v-model="editedItem.transactionType"
                  label="Transaction Type *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., sale, payment, transfer"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.transactionId"
                  label="Transaction ID *"
                  :rules="[rules.required, rules.number]"
                  type="number"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.tableName"
                  label="Table Name *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., sales, payments, transfers"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.action"
                  :items="actionTypes"
                  item-title="text"
                  item-value="value"
                  label="Action *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="editedItem.performedBy"
                  :items="users"
                  item-title="fullName"
                  item-value="id"
                  label="Performed By *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.ipAddress"
                  label="IP Address"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., 192.168.1.1"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.userAgent"
                  label="User Agent"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  placeholder="Browser/device information"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="oldValuesJson"
                  label="Old Values (JSON)"
                  variant="outlined"
                  density="compact"
                  rows="4"
                  :rules="[rules.validJson]"
                  placeholder='{"field": "old_value"}'
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="newValuesJson"
                  label="New Values (JSON)"
                  variant="outlined"
                  density="compact"
                  rows="4"
                  :rules="[rules.validJson]"
                  placeholder='{"field": "new_value"}'
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
  name: "TransactionLogsDialog",
  data() {
    return {
      dialog: false,
      valid: false,
      editedIndex: -1,
      editedItem: {
        transactionType: "",
        transactionId: null,
        tableName: "",
        action: "create",
        oldValues: null,
        newValues: null,
        performedBy: null,
        ipAddress: "",
        userAgent: "",
      },
      defaultItem: {
        transactionType: "",
        transactionId: null,
        tableName: "",
        action: "create",
        oldValues: null,
        newValues: null,
        performedBy: null,
        ipAddress: "",
        userAgent: "",
      },
      oldValuesJson: "",
      newValuesJson: "",
      users: [],
      actionTypes: [
        { text: "Create", value: "create" },
        { text: "Update", value: "update" },
        { text: "Delete", value: "delete" },
      ],
      rules: {
        required: (v) => !!v || v === 0 || "This field is required",
        number: (v) => !v || !isNaN(v) || "Must be a valid number",
        validJson: (v) => {
          if (!v || v.trim() === "") return true;
          try {
            JSON.parse(v);
            return true;
          } catch (e) {
            return "Must be valid JSON";
          }
        },
      },
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Transaction Log" : "Edit Transaction Log";
    },
  },
  watch: {
    dialog(val) {
      val || this.closeD();
    },
  },
  mounted() {
    this.loadUsers();
    eventBus.on("editTransactionLog", (item) => {
      this.editedIndex = item.id;
      this.editedItem = Object.assign({}, item);
      this.editedItem.performedBy = item.performer?.id || item.performedBy;
      this.oldValuesJson = item.oldValues ? JSON.stringify(item.oldValues, null, 2) : "";
      this.newValuesJson = item.newValues ? JSON.stringify(item.newValues, null, 2) : "";
      this.dialog = true;
    });
  },
  beforeUnmount() {
    eventBus.off("editTransactionLog");
  },
  methods: {
    async loadUsers() {
      try {
        const response = await this.axiosCall("/users", "GET");
        if (response.data) {
          this.users = response.data.map((user) => ({
            ...user,
            fullName: `${user.first_name} ${user.last_name}`,
          }));
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    },
    closeD() {
      eventBus.emit("closeTransactionLogsDialog", false);
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.oldValuesJson = "";
        this.newValuesJson = "";
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    async save() {
      if (!this.$refs.form.validate()) return;

      try {
        // Parse JSON fields
        const payload = {
          ...this.editedItem,
          oldValues: this.oldValuesJson.trim() ? JSON.parse(this.oldValuesJson) : null,
          newValues: this.newValuesJson.trim() ? JSON.parse(this.newValuesJson) : null,
        };

        let response;
        if (this.editedIndex > -1) {
          response = await this.axiosCall(
            `/transaction-logs/${this.editedIndex}`,
            "PATCH",
            payload
          );
        } else {
          response = await this.axiosCall("/transaction-logs", "POST", payload);
        }

        if (response.data) {
          this.closeD();
        }
      } catch (error) {
        console.error("Error saving transaction log:", error);
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
