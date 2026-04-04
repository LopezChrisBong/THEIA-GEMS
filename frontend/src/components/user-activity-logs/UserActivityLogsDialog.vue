<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" color="primary" dark>
        <v-icon left>mdi-plus</v-icon>
        New Activity Log
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
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.userId"
                  :items="users"
                  item-title="fullName"
                  item-value="id"
                  label="User *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.activityType"
                  :items="activityTypes"
                  label="Activity Type *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.module"
                  :items="modules"
                  label="Module"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.activityDescription"
                  label="Activity Description"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  placeholder="Describe the activity..."
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.ipAddress"
                  label="IP Address"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., 192.168.1.1"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.sessionId"
                  label="Session ID"
                  variant="outlined"
                  density="compact"
                  placeholder="Session identifier"
                ></v-text-field>
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
  name: "UserActivityLogsDialog",
  data() {
    return {
      dialog: false,
      valid: false,
      editedIndex: -1,
      editedItem: {
        userId: null,
        activityType: "",
        activityDescription: "",
        module: "",
        ipAddress: "",
        sessionId: "",
      },
      defaultItem: {
        userId: null,
        activityType: "",
        activityDescription: "",
        module: "",
        ipAddress: "",
        sessionId: "",
      },
      users: [],
      activityTypes: [
        "login",
        "logout",
        "view",
        "create",
        "update",
        "delete",
        "export",
        "import",
        "print",
        "search",
        "download",
        "upload",
        "approve",
        "reject",
        "other",
      ],
      modules: [
        "dashboard",
        "products",
        "variants",
        "categories",
        "branches",
        "inventory",
        "sales",
        "payments",
        "customers",
        "suppliers",
        "consignments",
        "transfers",
        "layaway",
        "reports",
        "users",
        "settings",
      ],
      rules: {
        required: (v) => !!v || v === 0 || "This field is required",
      },
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Activity Log" : "Edit Activity Log";
    },
  },
  watch: {
    dialog(val) {
      val || this.closeD();
    },
  },
  mounted() {
    this.loadUsers();
    eventBus.on("editUserActivityLog", (item) => {
      this.editedIndex = item.id;
      this.editedItem = Object.assign({}, item);
      this.editedItem.userId = item.user?.id || item.userId;
      this.dialog = true;
    });
  },
  beforeUnmount() {
    eventBus.off("editUserActivityLog");
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
      eventBus.emit("closeUserActivityLogsDialog", false);
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
            `/user-activity-logs/${this.editedIndex}`,
            "PATCH",
            this.editedItem
          );
        } else {
          response = await this.axiosCall("/user-activity-logs", "POST", this.editedItem);
        }

        if (response.data) {
          this.closeD();
        }
      } catch (error) {
        console.error("Error saving activity log:", error);
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
