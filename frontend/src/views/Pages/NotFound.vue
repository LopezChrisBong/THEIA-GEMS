<template>
  <div class="page-wrapper">
    <div class="card">
      <div class="oops">OOPS!</div>

      <div class="code">404</div>

      <div class="message">Page could not be found</div>

      <v-btn
        @click="redirectTo"
        size="x-large"
        rounded="xl"
        class="home-btn"
        elevation="6"
      >
        Go back to homepage
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    redirectTo() {
      location.replace("/");
    },
  },
};
</script>

<style scoped>
/* Full-page centering */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

/* Card container */
.card {
  text-align: center;
  padding: 3rem 4rem;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(132, 99, 19, 0.15);
}

/* OOPS text */
.oops {
  font-size: 4rem;
  font-weight: 700;
  color: #846313;
  letter-spacing: 4px;
}

/* 404 number */
.code {
  font-size: 8rem;
  font-weight: 800;
  color: #d6a89c;
  line-height: 1;
  margin: 1rem 0;
}

/* Message */
.message {
  font-size: 1.2rem;
  color: #3b2f2a;
  margin-bottom: 2.5rem;
}

/* Button */
.home-btn {
  background-color: #d6a89c !important;
  color: #ffffff !important;
  text-transform: none;
  font-weight: 600;
  padding: 0 2.5rem;
}

.home-btn:hover {
  background-color: #c8988c !important;
}
</style>
