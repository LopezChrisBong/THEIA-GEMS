<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          <v-icon class="mr-2">mdi-cash-clock</v-icon>
          Layaway Payments
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <LayawayPaymentsDataTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import LayawayPaymentsDataTable from "./LayawayPaymentsDataTable.vue";

export default {
  name: "LayawayPayments",
  components: {
    LayawayPaymentsDataTable,
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
