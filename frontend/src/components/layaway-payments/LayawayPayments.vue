<template>
  <div class="mx-2">
    <v-card class="mt-2">
      <v-row class="px-2">
        <v-col cols="12">
          <LayawayPaymentsDataTable />
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import LayawayPaymentsDataTable from "./LayawayPaymentsDataTable.vue";

export default {
  name: "LayawayPayments",
  components: { LayawayPaymentsDataTable },
  created() {
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setIsAuthenticated", 0);
      this.$router.push("/");
    }
  },
};
</script>
