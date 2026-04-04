<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          <v-icon class="mr-2">mdi-account-clock</v-icon>
          User Activity Logs
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <UserActivityLogsDataTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import UserActivityLogsDataTable from "./UserActivityLogsDataTable.vue";

export default {
  name: "UserActivityLogs",
  components: {
    UserActivityLogsDataTable,
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
