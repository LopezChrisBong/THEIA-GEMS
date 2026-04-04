<template>
  <div class="mx-2">
    <v-card class="mt-2">
      <v-row class="px-2">
        <v-col cols="12">
          <JewelryItemsDataTable />
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import JewelryItemsDataTable from "../../components/Utils/JewelryItemsDataTable.vue";

export default {
  name: "JewelryItemsPage",
  components: {
    JewelryItemsDataTable,
  },
  created() {
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setIsAuthenticated", 0);
      this.render = true;
      this.$router.push("/");
    }
  },
  data: () => ({
    typeData: [],
    action: null,
    reload: false,
  }),
  methods: {},
};
</script>

<style></style>
