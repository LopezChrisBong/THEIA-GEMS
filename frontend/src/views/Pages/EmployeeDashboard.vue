<template>
  <v-container fluid class="dashboard-bg pa-6">
    <!-- HEADER -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2 class="title">POS Dashboard</h2>
          <span class="subtitle">Welcome back, Admin</span>
        </div>
        <v-btn color="primary" rounded="xl" elevation="4">
          <v-icon start>mdi-plus</v-icon>
          New Sale
        </v-btn>
      </v-col>
    </v-row>

    <!-- STATS -->
    <v-row dense class="mb-6">
      <v-col cols="12" md="3" v-for="stat in stats" :key="stat.title">
        <v-card rounded="xl" class="stat-card pa-4">
          <v-icon size="36" class="mb-2" :color="stat.color">{{
            stat.icon
          }}</v-icon>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- MAIN CONTENT -->
    <v-row dense>
      <!-- SALES OVERVIEW -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-6">
          <div class="section-title mb-4">Sales Overview</div>
          <div class="chart-placeholder">Chart goes here</div>
        </v-card>
      </v-col>

      <!-- RECENT TRANSACTIONS -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-6">
          <div class="section-title mb-4">Recent Transactions</div>
          <v-list density="compact">
            <v-list-item v-for="(tx, i) in transactions" :key="i">
              <v-list-item-title>{{ tx.ref }}</v-list-item-title>
              <v-list-item-subtitle>₱{{ tx.amount }}</v-list-item-subtitle>
              <template #append>
                <span class="tx-time">{{ tx.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const stats = [
  {
    title: "Today Sales",
    value: "₱18,540",
    icon: "mdi-cash",
    color: "#d6a89c",
  },
  {
    title: "Transactions",
    value: "126",
    icon: "mdi-receipt",
    color: "#846313",
  },
  { title: "Products", value: "342", icon: "mdi-cube", color: "#d6a89c" },
  { title: "Low Stock", value: "8", icon: "mdi-alert", color: "red" },
];

const transactions = [
  { ref: "INV-10021", amount: "450.00", time: "2 min ago" },
  { ref: "INV-10020", amount: "1,250.00", time: "10 min ago" },
  { ref: "INV-10019", amount: "320.00", time: "30 min ago" },
];
</script>

<style scoped>
.dashboard-bg {
  background: #f4ebe8;
}

.title {
  color: #846313;
  font-weight: 600;
}

.subtitle {
  color: #6f5a2c;
}

.stat-card {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(132, 99, 19, 0.12);
}

.stat-title {
  font-size: 0.9rem;
  color: #846313;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #3b2f2a;
}

.section-title {
  font-weight: 600;
  color: #846313;
}

.chart-placeholder {
  height: 240px;
  border-radius: 16px;
  background: #f8f1ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #846313;
}

.tx-time {
  font-size: 0.75rem;
  color: #846313;
}
</style>
