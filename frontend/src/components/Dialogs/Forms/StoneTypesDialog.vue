<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="700px">
      <v-form ref="StoneTypesFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Stone Type</span>
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
                    v-model="name"
                    label="Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter the stone type name"
                    persistent-hint
                    maxlength="50"
                    counter
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="description"
                    label="Description"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="3"
                    hint="Enter description (optional)"
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
      name: null,
      description: null,

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
        this.$refs.StoneTypesFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing stone type
          this.id = data.id;
          this.name = data.name;
          this.description = data.description;
        } else {
          // Adding new stone type
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.name = null;
      this.description = null;
    },

    closeD() {
      eventBus.emit("closeStoneTypesDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.StoneTypesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        name: this.name,
        description: this.description,
      };

      this.axiosCall("/stone-types", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Stone type created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create stone type";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create stone type";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.StoneTypesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        name: this.name,
        description: this.description,
      };

      this.axiosCall("/stone-types/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Stone type updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update stone type";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update stone type";
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
