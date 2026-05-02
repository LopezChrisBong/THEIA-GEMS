<template>
  <v-container fluid class="pa-6">
    <!-- HEADER -->
    <div class="mb-6">
      <h2 class="font-weight-bold">POS Dashboard</h2>
      <p class="text-caption text-grey">Sales overview & performance</p>
    </div>

    <!-- KPI CARDS -->
    <v-row>
      <v-col v-for="(kpi, i) in kpis" :key="i" cols="12" sm="6" md="3">
        <v-card elevation="3" rounded="xl" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar size="44" :color="kpi.color" variant="tonal">
              <v-icon>{{ kpi.icon }}</v-icon>
            </v-avatar>

            <div class="ml-4">
              <div class="text-caption text-grey">{{ kpi.title }}</div>
              <div class="text-h6 font-weight-bold">
                {{ kpi.value }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- CHARTS -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card elevation="2" rounded="xl" class="pa-4">
          <h4 class="font-weight-medium mb-2">Sales Trend</h4>
          <div class="chart-placeholder">Line Chart (Daily / Monthly)</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="xl" class="pa-4">
          <h4 class="font-weight-medium mb-2">Top Categories</h4>
          <div class="chart-placeholder">Donut Chart</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABLE -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="xl">
          <v-card-title>Recent Transactions</v-card-title>
          <v-divider />

          <v-table>
            <thead>
              <tr>
                <th>Invoice</th>
                <!-- <th>Customer</th> -->
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in transactions" :key="i">
                <td>{{ t.id }}</td>
                <!-- <td>{{ t.customer }}</td> -->
                <td>{{ t.total }}</td>
                <td>{{ t.date }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "OwnerDashboard",

  data() {
    return {
      kpis: [
        {
          title: "Total Sales",
          value: "₱124,560",
          icon: "mdi-cash",
          color: "green",
        },
        {
          title: "Orders",
          value: "1,248",
          icon: "mdi-cart",
          color: "blue",
        },
        {
          title: "Customers",
          value: "684",
          icon: "mdi-account-group",
          color: "purple",
        },
        {
          title: "Profit",
          value: "₱32,140",
          icon: "mdi-trending-up",
          color: "orange",
        },
      ],

      transactions: [
        {
          id: "INV-001",
          customer: "Juan Dela Cruz",
          total: "₱1,240",
          date: "2026-01-02",
        },
        {
          id: "INV-002",
          customer: "Maria Santos",
          total: "₱560",
          date: "2026-01-02",
        },
        {
          id: "INV-003",
          customer: "Pedro Reyes",
          total: "₱2,100",
          date: "2026-01-01",
        },
      ],
    };
  },
};
</script>

<style scoped>
.chart-placeholder {
  height: 260px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f5f5, #eeeeee);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 0.9rem;
}
</style>
