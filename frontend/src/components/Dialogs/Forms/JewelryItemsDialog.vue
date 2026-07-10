<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="900px">
      <v-form ref="JewelryItemsFormref" @submit.prevent>
        <v-card elevation="4" class="rounded-lg">
          <!-- Header -->
          <v-card-title class="dialog-header px-6 py-4">
            <span class="text-h6 font-weight-medium">{{ action }} Item</span>
          </v-card-title>

          <!-- Content -->
          <v-card-text
            style="max-height: 700px; overflow-y: auto"
            class="py-6 px-6"
          >
            <v-container fluid>
              <v-row dense>
                <!-- Item Code -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="itemCode"
                    label="Item Code"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Unique code (e.g., OO8, PWB-01)"
                    persistent-hint
                  />
                </v-col>

                <!-- Barcode -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="barcode"
                    label="Barcode"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="Barcode / SKU number"
                    persistent-hint
                  />
                </v-col>

                <!-- Category -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="categoryId"
                    :items="categoryList"
                    item-title="categoryName"
                    item-value="id"
                    label="Category"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                    hint="e.g., Jewelry, Bags, Gowns, Sandals"
                    persistent-hint
                  />
                </v-col>

                <!-- Name -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="brand"
                    label="Name"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Color -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="color"
                    label="Color"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Description -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="material"
                    label="Description"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Branch -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="branchId"
                    :items="branchList"
                    item-title="branchName"
                    item-value="branchId"
                    label="Branch"
                    :rules="[formRules.required]"
                    outlined
                    dense
                    color="primary"
                  />
                </v-col>

                <!-- Size -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="size"
                    label="Size"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Jewelry-Specific Section Header -->
                <v-col cols="12" class="mb-2 mt-2">
                  <v-divider />
                  <small class="text-medium-emphasis mt-2 d-block">Jewelry-Specific Fields (optional — only for jewelry items)</small>
                </v-col>

                <!-- Stone Type -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="stoneTypeId"
                    :items="stoneTypeList"
                    item-title="name"
                    item-value="id"
                    label="Stone Type"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Jewelry Type -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-autocomplete
                    v-model="jewelryTypeId"
                    :items="jewelryTypeList"
                    item-title="name"
                    item-value="id"
                    label="Jewelry Type"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Color (Gold Type) -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="goldType"
                    :items="goldTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Color (Gold Type)"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Karat -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="karat"
                    :items="karatOptions"
                    label="Karat"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Carat -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="carat"
                    label="Carat"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="e.g., 0.50CT, 1CTW"
                    persistent-hint
                  />
                </v-col>

                <!-- Ring Size -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model="ringSize"
                    label="Ring Size"
                    outlined
                    dense
                    clearable
                    color="primary"
                    hint="e.g. US 6, US 7, 17mm"
                    persistent-hint
                  />
                </v-col>

                <!-- Band Width -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="bandWidth"
                    :items="bandWidthOptions"
                    label="Band Width"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Divider before Pricing -->
                <v-col cols="12" class="mb-2 mt-2">
                  <v-divider />
                </v-col>

                <!-- Price -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-text-field
                    v-model.number="price"
                    label="Price (₱)"
                    type="number"
                    outlined
                    dense
                    clearable
                    color="primary"
                    prefix="₱"
                  />
                </v-col>

                <!-- Status -->
                <v-col cols="12" md="4" class="mb-4">
                  <v-select
                    v-model="status"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    outlined
                    dense
                    color="primary"
                  />
                </v-col>

                <!-- Supplier -->
                <v-col cols="12" md="6" class="mb-4">
                  <v-autocomplete
                    v-model="supplierId"
                    :items="supplierList"
                    item-title="supplierName"
                    item-value="id"
                    label="Supplier"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Purchase Date -->
                <v-col cols="12" md="6" class="mb-4">
                  <v-text-field
                    v-model="purchaseDate"
                    label="Purchase Date"
                    type="date"
                    outlined
                    dense
                    clearable
                    color="primary"
                  />
                </v-col>

                <!-- Notes -->
                <v-col cols="12" class="mb-4">
                  <v-textarea
                    v-model="notes"
                    label="Notes"
                    outlined
                    dense
                    clearable
                    color="primary"
                    rows="2"
                  />
                </v-col>

                <!-- Images Section -->
                <v-col cols="12" class="mb-2 mt-2">
                  <v-divider />
                  <small class="text-medium-emphasis mt-2 d-block">Item Images</small>
                </v-col>

                <!-- Existing Images (only in Update mode) -->
                <v-col v-if="existingImages.length > 0" cols="12" class="mb-4">
                  <div class="d-flex flex-wrap ga-3">
                    <div
                      v-for="img in existingImages"
                      :key="img.id"
                      class="image-thumb-wrapper"
                    >
                      <v-img
                        :src="apiUrl + '/uploads/jewelry-items/' + img.imagePath"
                        width="100"
                        height="100"
                        cover
                        class="rounded-lg image-thumb"
                      />
                      <v-btn
                        icon
                        size="x-small"
                        color="red"
                        variant="flat"
                        class="image-remove-btn"
                        @click="removeExistingImage(img)"
                      >
                        <v-icon size="14">mdi-close</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </v-col>

                <!-- Upload New Images -->
                <v-col cols="12" class="mb-4">
                  <v-file-input
                    v-model="newImages"
                    label="Upload Images"
                    accept="image/*"
                    multiple
                    outlined
                    dense
                    prepend-icon="mdi-camera"
                    color="primary"
                    show-size
                    hint="Select one or more images (JPG, PNG)"
                    persistent-hint
                  />
                </v-col>

                <!-- New Image Previews -->
                <v-col v-if="imagePreviewUrls.length > 0" cols="12" class="mb-4">
                  <div class="d-flex flex-wrap ga-3">
                    <div
                      v-for="(url, index) in imagePreviewUrls"
                      :key="'preview-' + index"
                      class="image-thumb-wrapper"
                    >
                      <v-img
                        :src="url"
                        width="100"
                        height="100"
                        cover
                        class="rounded-lg image-thumb"
                      />
                      <v-btn
                        icon
                        size="x-small"
                        color="red"
                        variant="flat"
                        class="image-remove-btn"
                        @click="removeNewImage(index)"
                      >
                        <v-icon size="14">mdi-close</v-icon>
                      </v-btn>
                    </div>
                  </div>
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
import axios from "axios";
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
      itemCode: null,
      barcode: null,
      categoryId: null,
      brand: null,
      color: null,
      material: null,
      stoneTypeId: null,
      jewelryTypeId: null,
      goldType: null,
      karat: null,
      carat: null,
      size: null,
      ringSize: null,
      bandWidth: null,
      price: null,
      status: "IN_STOCK",
      branchId: null,
      supplierId: null,
      purchaseDate: null,
      notes: null,

      newImages: [],
      existingImages: [],
      imagePreviewUrls: [],

      lastOpenedId: undefined,

      categoryList: [],
      stoneTypeList: [],
      jewelryTypeList: [],
      branchList: [],
      supplierList: [],

      goldTypeOptions: [
        { label: "Yellow Gold (YG)", value: "YG" },
        { label: "White Gold (WG)", value: "WG" },
        { label: "Rose Gold (RG)", value: "RG" },
        { label: "2-toned (YG x WG)", value: "YG x WG" },
        { label: "2-toned (RG x WG)", value: "RG x WG" },
      ],
      karatOptions: ["14K", "18K", "Platinum"],
      bandWidthOptions: [
        "1 mm", "2 mm", "2.5 mm", "3 mm", "3.5 mm", "4 mm",
        "4.5 mm", "5 mm", "5.5 mm", "6 mm", "6.5 mm", "7 mm",
      ],
      statusOptions: [
        { label: "On Hand / Available", value: "IN_STOCK" },
        { label: "For Preorder", value: "FOR_PREORDER" },
        { label: "Pull out", value: "PULLED_OUT" },
        { label: "Consignment", value: "CONSIGNMENT" },
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
        this.$refs.JewelryItemsFormref?.resetValidation();
        this.loadLookups();

        const newId = data?.id ?? null;

        if (newId) {
          this.lastOpenedId = newId;
          this.id = data.id;
          this.itemCode = data.itemCode;
          this.barcode = data.barcode;
          this.categoryId = data.categoryId;
          this.brand = data.brand;
          this.color = data.color;
          this.material = data.material;
          this.stoneTypeId = data.stoneTypeId;
          this.jewelryTypeId = data.jewelryTypeId;
          this.goldType = data.goldType;
          this.karat = data.karat;
          this.carat = data.carat;
          this.size = data.size;
          this.ringSize = data.ringSize;
          this.bandWidth = data.bandWidth;
          this.price = data.price ? Number(data.price) : null;
          this.status = data.status;
          this.branchId = data.branchId;
          this.supplierId = data.supplierId;
          this.purchaseDate = data.purchaseDate;
          this.notes = data.notes;
          this.existingImages = data.images ? [...data.images] : [];
        } else {
          // Add mode: only reset if this is the first open or switching from another context.
          // Re-opening Add after Cancel retains whatever was typed.
          if (this.lastOpenedId !== null) {
            this.lastOpenedId = null;
            this.resetForm();
          }
        }
      },
      deep: true,
    },
    newImages(files) {
      this.imagePreviewUrls = [];
      if (files && files.length > 0) {
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imagePreviewUrls.push(e.target.result);
          };
          reader.readAsDataURL(file);
        });
      }
    },
  },
  methods: {
    loadLookups() {
      this.axiosCall("/categories", "GET").then((res) => {
        if (res && res.data) this.categoryList = res.data;
      });
      this.axiosCall("/stone-types", "GET").then((res) => {
        if (res && res.data) this.stoneTypeList = res.data;
      });
      this.axiosCall("/jewelry-types", "GET").then((res) => {
        if (res && res.data) this.jewelryTypeList = res.data;
      });
      this.axiosCall("/branches", "GET").then((res) => {
        if (res && res.data) this.branchList = res.data;
      });
      this.axiosCall("/suppliers", "GET").then((res) => {
        if (res && res.data) this.supplierList = res.data;
      });
    },

    resetForm() {
      this.id = null;
      this.itemCode = null;
      this.barcode = null;
      this.categoryId = null;
      this.brand = null;
      this.color = null;
      this.material = null;
      this.stoneTypeId = null;
      this.jewelryTypeId = null;
      this.goldType = null;
      this.karat = null;
      this.carat = null;
      this.size = null;
      this.ringSize = null;
      this.bandWidth = null;
      this.price = null;
      this.status = "IN_STOCK";
      this.branchId = null;
      this.supplierId = null;
      this.purchaseDate = null;
      this.notes = null;
      this.newImages = [];
      this.existingImages = [];
      this.imagePreviewUrls = [];
    },

    closeD() {
      eventBus.emit("closeJewelryItemsDialog", false);
      this.dialog = false;
    },

    buildPayload() {
      const payload = {
        itemCode: this.itemCode,
        barcode: this.barcode || null,
        categoryId: this.categoryId,
        brand: this.brand || null,
        color: this.color || null,
        material: this.material || null,
        stoneTypeId: this.stoneTypeId || null,
        jewelryTypeId: this.jewelryTypeId || null,
        goldType: this.goldType || null,
        karat: this.karat || null,
        carat: this.carat || null,
        size: this.size || null,
        ringSize: this.ringSize || null,
        bandWidth: this.bandWidth || null,
        price: this.price || null,
        status: this.status,
        branchId: this.branchId,
        supplierId: this.supplierId || null,
        purchaseDate: this.purchaseDate || null,
        notes: this.notes || null,
      };
      // Only stamp addedBy when creating a new item
      if (this.action === 'Add') {
        payload.addedBy = Number(this.$store.state.user?.userID) || null;
      }
      return payload;
    },

    async uploadImages(itemId) {
      if (!this.newImages || this.newImages.length === 0) return;

      const formData = new FormData();
      this.newImages.forEach((file) => {
        formData.append("images", file);
      });

      await axios({
        method: "POST",
        url: this.apiUrl + "/jewelry-item-images/upload/" + itemId,
        data: formData,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    },

    async removeExistingImage(img) {
      try {
        await this.axiosCall("/jewelry-item-images/" + img.id, "DELETE");
        this.existingImages = this.existingImages.filter((i) => i.id !== img.id);
      } catch (error) {
        console.error("Failed to remove image:", error);
      }
    },

    removeNewImage(index) {
      const updated = [...this.newImages];
      updated.splice(index, 1);
      this.newImages = updated;
      this.imagePreviewUrls.splice(index, 1);
    },

    async add() {
      const { valid } = await this.$refs.JewelryItemsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const payload = this.buildPayload();

      this.axiosCall("/jewelry-items", "POST", payload)
        .then(async (res) => {
          if (res && res.status === 201) {
            // Upload images if any
            if (this.newImages && this.newImages.length > 0) {
              await this.uploadImages(res.data.id);
            }
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Item created successfully";
            this.lastOpenedId = undefined;
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to create item";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to create item";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    async update() {
      const { valid } = await this.$refs.JewelryItemsFormref.validate();
      if (!valid) return;

      this.loading = true;
      const payload = this.buildPayload();

      this.axiosCall("/jewelry-items/" + this.id, "PATCH", payload)
        .then(async (res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            // Upload new images if any
            if (this.newImages && this.newImages.length > 0) {
              await this.uploadImages(this.id);
            }
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Item updated successfully";
            this.closeD();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = res?.data?.message || "Failed to update item";
          }
        })
        .catch((error) => {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = error?.response?.data?.message || "Failed to update item";
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

.image-thumb-wrapper {
  position: relative;
  display: inline-block;
}

.image-thumb {
  border: 2px solid #e0e0e0;
}

.image-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 1;
}

.ga-3 {
  gap: 12px;
}
</style>
