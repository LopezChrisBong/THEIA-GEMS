<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="CustomersFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Customer</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Basic Information -->
                <v-col cols="12" class="mb-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Basic Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="customerCode"
                    label="Customer Code"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Unique customer code (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Customer's birthday (optional)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="firstName"
                    label="First Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Customer's first name"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="lastName"
                    label="Last Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Customer's last name"
                    persistent-hint
                  />
                </v-col>

                <!-- Contact Information -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Contact Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="email"
                    label="Email"
                    type="email"
                    :rules="[formRules.required, formRules.email]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Customer's email address"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="phone"
                    label="Phone"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Customer's phone number"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="address"
                    label="Address"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="2"
                    hint="Customer's full address"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="instagram"
                    label="Instagram"
                    prepend-inner-icon="mdi-instagram"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Instagram handle or profile link (optional)"
                    persistent-hint
                  />
                </v-col>

                <!-- Customer Status -->
                <v-col cols="12" class="mb-2 mt-2">
                  <h3 class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                    Customer Status
                  </h3>
                </v-col>

                <v-col cols="12" md="6" class="mb-4">
                  <v-switch
                    v-model="isRepeatBuyer"
                    label="Repeat Buyer"
                    color="primary"
                    hint="Mark as repeat customer"
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
      customerCode: null,
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      address: null,
      instagram: null,
      dateOfBirth: null,
      isRepeatBuyer: false,

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
        this.$refs.CustomersFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing customer
          this.id = data.id;
          this.customerCode = data.customerCode;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.instagram = data.instagram;
          this.dateOfBirth = data.dateOfBirth ? this.formatDateForInput(data.dateOfBirth) : null;
          this.isRepeatBuyer = data.isRepeatBuyer || false;
        } else {
          // Adding new customer
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.customerCode = null;
      this.firstName = null;
      this.lastName = null;
      this.email = null;
      this.phone = null;
      this.address = null;
      this.instagram = null;
      this.dateOfBirth = null;
      this.isRepeatBuyer = false;
    },

    formatDateForInput(dateString) {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    closeD() {
      eventBus.emit("closeCustomersDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.CustomersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        customerCode: this.customerCode || null,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        address: this.address,
        instagram: this.instagram || null,
        dateOfBirth: this.dateOfBirth || null,
        isRepeatBuyer: this.isRepeatBuyer,
      };

      this.axiosCall("/customers", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Customer created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create customer";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create customer";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.CustomersFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        customerCode: this.customerCode || null,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        address: this.address,
        instagram: this.instagram || null,
        dateOfBirth: this.dateOfBirth || null,
        isRepeatBuyer: this.isRepeatBuyer,
      };

      this.axiosCall("/customers/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Customer updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update customer";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update customer";
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
