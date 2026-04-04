<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="600px">
      <v-form ref="BranchesFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Branch</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <v-col cols="12" class="mb-4">
                  <v-text-field
                    v-model="branchName"
                    label="Branch Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter the branch name"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-text-field
                    v-model="branchCode"
                    label="Branch Code"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter a unique branch code (e.g., BR001)"
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
                    hint="Enter the branch address"
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

                <v-col cols="12" md="6" class="mb-4">
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

      branchId: null,
      branchName: null,
      branchCode: null,
      address: null,
      phone: null,
      email: null,
      isActive: true,

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
        this.$refs.BranchesFormref?.resetValidation();

        if (data && data.branchId) {
          // Editing existing branch
          this.branchId = data.branchId;
          this.branchName = data.branchName;
          this.branchCode = data.branchCode;
          this.address = data.address;
          this.phone = data.phone;
          this.email = data.email;
          this.isActive = data.isActive ?? true;
        } else {
          // Adding new branch
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.branchId = null;
      this.branchName = null;
      this.branchCode = null;
      this.address = null;
      this.phone = null;
      this.email = null;
      this.isActive = true;
    },

    closeD() {
      eventBus.emit("closeBranchesDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.BranchesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        branchName: this.branchName,
        branchCode: this.branchCode,
        address: this.address,
        phone: this.phone,
        email: this.email,
        isActive: this.isActive,
      };

      this.axiosCall("/branches", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Branch created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create branch";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create branch";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.BranchesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        branchName: this.branchName,
        branchCode: this.branchCode,
        address: this.address,
        phone: this.phone,
        email: this.email,
        isActive: this.isActive,
      };

      this.axiosCall("/branches/" + this.branchId, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Branch updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update branch";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update branch";
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
