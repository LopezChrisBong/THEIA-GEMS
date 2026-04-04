<template>
  <div class="mx-2">
    <v-card class="mt-2">
      <v-row class="px-2">
        <v-col cols="12">
          <JewelryTypesDataTable />
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import JewelryTypesDataTable from "../../components/Utils/JewelryTypesDataTable.vue";

export default {
  name: "JewelryTypesPage",
  components: {
    JewelryTypesDataTable,
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
