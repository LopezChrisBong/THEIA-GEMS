<template>
  <div class="pos-wrapper">
    <PointOfSaleDataTable />
  </div>
</template>

<script>
import PointOfSaleDataTable from "../../../components/Utils/Cashier/PointOfSaleDataTable.vue";
export default {
  components: { PointOfSaleDataTable },
  created() {
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setIsAuthenticated", 0);
      this.$router.push("/");
    }
  },
};
</script>

<style scoped>
.pos-wrapper {
  padding: 18px;
  height: calc(100vh - 56px);
  overflow: hidden;
}
</style>
