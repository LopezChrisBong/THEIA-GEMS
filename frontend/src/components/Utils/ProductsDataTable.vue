<template>
  <v-container fluid class="pos-bg pa-4">
    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" class="pa-4">
          <div class="d-flex justify-end gap-2">
            <v-text-field
              v-model="search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="search-input"
            />

            <v-btn
              color="#8e6e25"
              class="mx-2"
              prepend-icon="mdi-plus"
              rounded="lg"
              elevation="1"
              @click="add()"
            >
              Add Product
            </v-btn>
          </div>

          <v-row class="mt-4" dense>
            <v-col
              v-for="product in filteredProducts"
              :key="product.sku"
              cols="6"
              md="4"
            >
              <v-card class="product-card" @click="addToCart(product)">
                <v-img :src="product.image" height="120" />
                <v-card-title class="text-h6">{{ product.name }}</v-card-title>
                <v-card-subtitle>₱{{ product.price }}</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <AddProductDialog :data="proData" :view="action" />
  </v-container>
</template>

<script>
import eventBus from "@/eventBus";
import AddProductDialog from "../../components/Dialogs/Forms/AddProductDialog.vue";
export default {
  components: {
    AddProductDialog,
  },
  data() {
    return {
      search: "",
      cart: [],
      action: null,
      proData: null,
      products: [
        {
          name: "Energy Drink",
          sku: "ED-1001",
          price: 75,
          image: "https://via.placeholder.com/150",
          stock: 120,
        },
        {
          name: "Instant Noodles",
          sku: "IN-2001",
          price: 20,
          image: "https://via.placeholder.com/150",
          stock: 15,
        },
        {
          name: "Chocolate Bar",
          sku: "CB-3002",
          price: 35,
          image: "https://via.placeholder.com/150",
          stock: 5,
        },
        {
          name: "Bottled Water",
          sku: "BW-4001",
          price: 15,
          image: "https://via.placeholder.com/150",
          stock: 50,
        },
      ],
    };
  },
  mounted() {
    eventBus.on("closeAddProductDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeAddProductDialog");
  },

  computed: {
    filteredProducts() {
      return this.products.filter((p) =>
        p.name.toLowerCase().includes(this.search.toLowerCase()),
      );
    },

    total() {
      return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    },
  },

  methods: {
    addToCart(product) {
      const existing = this.cart.find((item) => item.sku === product.sku);
      if (existing) {
        existing.qty += 1;
      } else {
        this.cart.push({ ...product, qty: 1 });
      }
    },

    removeFromCart(index) {
      this.cart.splice(index, 1);
    },

    add() {
      // placeholder for Add Product button
      console.log("Add product clicked");
      this.proData = { id: null };
      this.action = "Add";
    },
  },
};
</script>

<style scoped>
.pos-bg {
  background: #f4ebe8;
  min-height: 100vh;
}
.product-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.product-card:hover {
  transform: scale(1.05);
}
</style>
