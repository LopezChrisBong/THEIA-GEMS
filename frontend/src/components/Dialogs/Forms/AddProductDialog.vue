<template>
  <v-dialog v-model="dialog" max-width="900">
    <v-card rounded="xl" class="pa-6">
      <v-card-title class="text-h5 title">Add New Product</v-card-title>

      <v-divider class="my-4" />

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            label="Product Name"
            v-model="product.name"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Barcode / SKU"
            v-model="product.sku"
            prepend-inner-icon="mdi-barcode"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Category"
            v-model="product.category"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Unit Price"
            v-model="product.price"
            prefix="₱"
            type="number"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Stock Quantity"
            v-model="product.stock"
            type="number"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-file-input
            label="Product Image"
            prepend-icon="mdi-camera"
            variant="outlined"
            accept="image/*"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-switch
            v-model="product.active"
            label="Active Product"
            inset
            color="primary"
          />
        </v-col>

        <v-col cols="12">
          <v-textarea
            label="Description"
            v-model="product.description"
            rows="3"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" rounded="xl" elevation="4"> Save Product </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    data: Object,
    action: String,
  },

  data() {
    return {
      dialog: false,
      product: {
        name: "",
        sku: "",
        category: "",
        price: null,
        stock: null,
        active: true,
        description: "",
        image: null,
      },
    };
  },

  watch: {
    data: {
      handler(data) {
        if (!data) return;
        this.dialog = true;
        if (data) {
          // optional: populate when editing
          this.product = {
            name: data.name ?? "",
            sku: data.sku ?? "",
            category: data.category ?? "",
            price: data.price ?? null,
            stock: data.stock ?? null,
            active: data.active ?? true,
            description: data.description ?? "",
            image: data.image ?? null,
          };
        }
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style scoped>
.title {
  color: #846313;
  font-weight: 600;
}

.v-card {
  background: #ffffff;
}
</style>
