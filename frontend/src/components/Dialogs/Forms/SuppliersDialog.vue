<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="SuppliersFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Supplier</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="supplierName"
                    label="Supplier Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter the supplier name"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-select
                    v-model="supplierType"
                    :items="supplierTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Supplier Type"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="Select supplier type"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="contactPerson"
                    label="Contact Person"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter contact person name"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="phone"
                    label="Phone Number"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter phone number"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-text-field
                    v-model="email"
                    label="Email"
                    :rules="email ? [formRules.email] : []"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter email address"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="address"
                    label="Address"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="3"
                    hint="Enter supplier address"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-switch
                    v-model="isActive"
                    label="Active Status"
                    color="primary"
                    hide-details
                  >
                    <template v-slot:label>
                      <span>{{ isActive ? 'Active' : 'Inactive' }}</span>
                    </template>
                  </v-switch>
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
      supplierName: null,
      supplierType: null,
      contactPerson: null,
      phone: null,
      email: null,
      address: null,
      isActive: true,

      supplierTypeOptions: [
        { label: "Theia Gems", value: "theia_gems" },
        { label: "External", value: "external" },
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
        this.$refs.SuppliersFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing supplier
          this.id = data.id;
          this.supplierName = data.supplierName;
          this.supplierType = data.supplierType;
          this.contactPerson = data.contactPerson;
          this.phone = data.phone;
          this.email = data.email;
          this.address = data.address;
          this.isActive = data.isActive ?? true;
        } else {
          // Adding new supplier
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.supplierName = null;
      this.supplierType = null;
      this.contactPerson = null;
      this.phone = null;
      this.email = null;
      this.address = null;
      this.isActive = true;
    },

    closeD() {
      eventBus.emit("closeSuppliersDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.SuppliersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        supplierName: this.supplierName,
        supplierType: this.supplierType,
        contactPerson: this.contactPerson,
        phone: this.phone,
        email: this.email,
        address: this.address,
        isActive: this.isActive,
      };

      this.axiosCall("/suppliers", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Supplier created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create supplier";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create supplier";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.SuppliersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        supplierName: this.supplierName,
        supplierType: this.supplierType,
        contactPerson: this.contactPerson,
        phone: this.phone,
        email: this.email,
        address: this.address,
        isActive: this.isActive,
      };

      this.axiosCall("/suppliers/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Supplier updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update supplier";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update supplier";
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
