<template>
  <v-app>
    <v-main class="pos-bg">
      <v-container fluid>
        <v-row class="fill-height" no-gutters>
          <!-- LEFT: ITEMS LIST -->
          <v-col cols="8" class="pa-4">
            <v-card class="pos-card" rounded="xl">
              <v-card-title class="d-flex justify-space-between align-center">
                <span class="title">Sunrise Mart POS System</span>
                <span class="time">10:25</span>
              </v-card-title>

              <v-text-field
                label="Enter item code or scan product"
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                class="mx-4 mb-2"
                density="comfortable"
              />

              <v-data-table
                :headers="headers"
                :items="items"
                item-key="name"
                density="compact"
                class="mx-4"
              />

              <v-divider class="my-4" />

              <v-row class="px-6 pb-4">
                <v-col cols="6">
                  <div class="summary">
                    Sub Total: <strong>₱5848.60</strong>
                  </div>
                  <div class="summary">Tax (12%): <strong>₱120.48</strong></div>
                  <div class="summary">Item Count: <strong>6</strong></div>
                </v-col>
                <v-col cols="6" class="text-right">
                  <div class="grand-total">₱5818.60</div>
                  <div class="grand-label">Grand Total</div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- RIGHT: ACTIONS & KEYPAD -->
          <v-col cols="4" class="pa-4">
            <v-row dense>
              <v-col cols="6" v-for="btn in actions" :key="btn.label">
                <v-btn block height="70" :color="btn.color" class="action-btn">
                  <v-icon start>{{ btn.icon }}</v-icon>
                  {{ btn.label }}
                </v-btn>
              </v-col>
            </v-row>

            <v-card class="keypad mt-4" rounded="xl">
              <v-row dense>
                <v-col cols="4" v-for="n in keypad" :key="n">
                  <v-btn block height="60" class="key-btn">{{ n }}</v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn block height="60" color="primary">Enter</v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
const headers = [
  { title: "Product", key: "name" },
  { title: "Qty", key: "qty" },
  { title: "Price", key: "price" },
  { title: "Amount", key: "amount" },
];

const items = [
  { name: "Energy Drink", qty: 2, price: 75, amount: 150 },
  { name: "Instant Noodles", qty: 5, price: 20, amount: 100 },
];

const actions = [
  { label: "Add Customer", icon: "mdi-account-plus", color: "#d6a89c" },
  { label: "Discount", icon: "mdi-sale", color: "#846313" },
  { label: "Cash Pay", icon: "mdi-cash", color: "#d6a89c" },
  { label: "Void Item", icon: "mdi-delete", color: "red" },
];

const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
</script>

<style scoped>
.pos-bg {
  background: #f4ebe8;
}

.pos-card {
  background: #ffffff;
}

.title {
  font-weight: 600;
  color: #846313;
}

.time {
  color: #846313;
}

.summary {
  color: #3b2f2a;
  margin-bottom: 6px;
}

.grand-total {
  font-size: 2.2rem;
  font-weight: 700;
  color: #d6a89c;
}

.grand-label {
  color: #846313;
}

.action-btn {
  color: #ffffff;
  font-weight: 600;
}

.keypad {
  padding: 16px;
}

.key-btn {
  background: #ffffff;
  border: 1px solid #e0d0ca;
}
</style>
