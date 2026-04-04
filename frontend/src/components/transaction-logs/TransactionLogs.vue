<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          <v-icon class="mr-2">mdi-history</v-icon>
          Transaction Logs
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <TransactionLogsDataTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TransactionLogsDataTable from "./TransactionLogsDataTable.vue";

export default {
  name: "TransactionLogs",
  components: {
    TransactionLogsDataTable,
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
