<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="600px">
      <v-form ref="CategoriesFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Category</span>
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
                    v-model="categoryName"
                    label="Category Name"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Enter the category name"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" class="mb-4">
                  <v-autocomplete
                    v-model="parentCategoryId"
                    :items="parentCategories"
                    item-title="categoryName"
                    item-value="id"
                    label="Parent Category"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Select a parent category (optional)"
                    persistent-hint
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
                    hint="Enter category description"
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
      categoryName: null,
      parentCategoryId: null,
      description: null,
      parentCategories: [],

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
        this.loadParentCategories();
        this.$refs.CategoriesFormref?.resetValidation();

        if (data && data.id) {
          // Editing existing category
          this.id = data.id;
          this.categoryName = data.categoryName;
          this.parentCategoryId = data.parentCategoryId;
          this.description = data.description;
        } else {
          // Adding new category
          this.resetForm();
        }
      },
      deep: true,
    },
  },
  methods: {
    resetForm() {
      this.id = null;
      this.categoryName = null;
      this.parentCategoryId = null;
      this.description = null;
    },

    loadParentCategories() {
      this.axiosCall("/categories", "GET")
        .then((res) => {
          if (res && res.data) {
            // Filter out the current category if editing (to prevent self-reference)
            this.parentCategories = this.id
              ? res.data.filter((cat) => cat.id !== this.id)
              : res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load parent categories:", error);
        });
    },

    closeD() {
      eventBus.emit("closeCategoriesDialog", false);
      this.dialog = false;
    },

    async add() {
      const { valid } = await this.$refs.CategoriesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        categoryName: this.categoryName,
        parentCategoryId: this.parentCategoryId || null,
        description: this.description,
      };

      this.axiosCall("/categories", "POST", data)
        .then((res) => {
          if (res && res.status === 201) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Category created successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create category";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create category";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.CategoriesFormref.validate();
      if (!valid) return;

      this.loading = true;
      const data = {
        categoryName: this.categoryName,
        parentCategoryId: this.parentCategoryId || null,
        description: this.description,
      };

      this.axiosCall("/categories/" + this.id, "PATCH", data)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Category updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update category";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update category";
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
