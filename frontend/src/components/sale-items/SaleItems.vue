<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          <v-icon class="mr-2">mdi-cart-outline</v-icon>
          Sale Items
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <SaleItemsDataTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SaleItemsDataTable from "./SaleItemsDataTable.vue";

export default {
  name: "SaleItems",
  components: {
    SaleItemsDataTable,
  },
  created() {
    this.requiredLogin();
  },
  methods: {
    requiredLogin() {
      if (!this.$session.exists()) {
        this.$router.push("/");
      }
    },
  },
};
</script>

<style scoped>
</style>
