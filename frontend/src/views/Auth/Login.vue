<template>
  <div class="login-screen">
    <div class="login-vignette"></div>
    <div class="login-card">
      <!-- Gem Emblem -->
      <div class="login-emblem">
        <img src="/img/theia-logo.png" alt="Theia Gems" class="login-logo-img" />
      </div>

      <!-- Brand -->
      <div class="login-brand">Theia Gems</div>
      <div class="login-sub">Sign in to continue</div>

      <!-- Error Message -->
      <div class="login-error" :class="{ show: showError }">
        {{ errorMessage }}
      </div>

      <!-- Email Field -->
      <div class="login-field">
        <span class="login-field-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M1 5l7 5 7-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </span>
        <input
          v-model="email"
          class="login-input"
          type="email"
          placeholder="Email address"
          autocomplete="email"
          @keyup.enter="dologin()"
        />
      </div>

      <!-- Password Field -->
      <div class="login-field">
        <span class="login-field-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="9" r="2" stroke="currentColor" stroke-width="1.3"/>
            <rect x="1" y="5" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 5V3.5a3 3 0 016 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </span>
        <input
          v-model="password"
          class="login-input"
          :type="show1 ? 'text' : 'password'"
          placeholder="Password"
          autocomplete="current-password"
          @keyup.enter="dologin()"
        />
        <button class="login-eye" type="button" @click="show1 = !show1">
          <svg v-if="!show1" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/>
          </svg>
        </button>
      </div>

      <!-- Meta Row -->
      <div class="login-meta">
        <label class="login-remember">
          <input type="checkbox" v-model="rememberMe" /> Remember me
        </label>
      </div>

      <!-- Sign In Button -->
      <button
        class="btn-login"
        :class="{ loading: isLoading }"
        :disabled="isLoading"
        @click="dologin()"
      >
        {{ isLoading ? 'Signing in...' : 'Sign In' }}
      </button>

      <!-- Footer -->
      <div class="login-footer">THEIA GEMS POS</div>
    </div>

    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </div>
</template>

<script>
export default {
  name: "loginPage",

  watch: {
    "$store.state.user": {
      immediate: true,
      handler(user) {
        if (!user || !user.user) return;

        const userType = user.user.usertypeID;
        const roleID = user.user.user_roleID;

        if (userType == 1) {
          this.$router.replace("/admin/dashboard");
        } else if (roleID == 5) {
          this.$router.replace("/superadmin/dashboard");
        } else {
          this.$router.replace("/employee/dashboard");
        }
      },
    },
  },

  methods: {
    async dologin() {
      if (!this.email || !this.password) {
        this.showError = true;
        this.errorMessage = "Please enter email and password.";
        return;
      }

      this.showError = false;
      this.isLoading = true;

      try {
        const res = await this.axiosCall("/auth/login", "POST", {
          email: this.email,
          password: this.password,
        });

        this.isLoading = false;

        if ([200, 201, 202].includes(res.data.status)) {
          localStorage.setItem("token", res.data.token);
          this.$store.dispatch("setIsAuthenticated", 1);
          this.$store.commit("setExpiryDate");
          location.replace("/");
        } else {
          this.showError = true;
          this.errorMessage = res.data.message || "Invalid email or password. Please try again.";
        }
      } catch (err) {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = "Login failed. Please try again.";
      }
    },

    getUser() {
      if (!localStorage.getItem("token")) {
        this.render = true;
        return;
      }
      this.axiosCall("/auth/current_user", "GET")
        .then((res) => {
          if (res.data.statusCode !== 401) {
            const data = res.data.userdetail;
            this.$store.dispatch("setUser", data);
            this.$store.dispatch("setIsAuthenticated", 1);
          } else {
            localStorage.clear();
            location.reload();
          }
        })
        .catch(() => {
          this.render = true;
        });
    },
  },

  data: () => ({
    isLoading: false,
    email: "",
    password: "",
    show1: false,
    rememberMe: false,
    showError: false,
    errorMessage: "",
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "Successfully Added!",
      message: "",
      top: 10,
    },
  }),
};
</script>

<style scoped>
/* ─── LOGIN SCREEN ─── */
.login-screen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 30% 30%, rgba(196,148,85,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, rgba(155,107,58,0.1) 0%, transparent 50%),
    linear-gradient(160deg, #C99A8B 0%, #C08B7C 50%, #B67D6E 100%);
  font-family: 'Outfit', sans-serif;
}

/* Subtle vignette */
.login-vignette {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(58,37,21,0.12) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ─── CARD ─── */
.login-card {
  position: relative;
  z-index: 2;
  background: #FDFAF6;
  border-radius: 20px;
  padding: 44px 40px 36px;
  width: 380px;
  max-width: 95vw;
  box-shadow:
    0 8px 40px rgba(80,30,10,0.22),
    0 0 80px rgba(253,250,246,0.08),
    inset 0 1px 0 rgba(255,255,255,0.5);
  border: 1px solid rgba(155,107,58,0.2);
  overflow: hidden;
  animation: loginIn 0.4s ease;
}

@keyframes loginIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Decorative gem shapes */
.login-card::before,
.login-card::after {
  content: '';
  position: absolute;
  width: 150px;
  height: 150px;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='75,10 130,46 130,104 75,140 20,104 20,46' fill='none' stroke='rgba(155,107,58,0.15)' stroke-width='1'/%3E%3Cpolygon points='75,10 130,46 75,66 20,46' fill='none' stroke='rgba(155,107,58,0.08)' stroke-width='0.7'/%3E%3C/svg%3E");
  background-size: cover;
}

.login-card::before {
  top: -30px;
  left: -30px;
  opacity: 0.8;
}

.login-card::after {
  bottom: -30px;
  right: -30px;
  opacity: 0.5;
  transform: rotate(30deg);
}

/* ─── EMBLEM ─── */
.login-emblem {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2.5px solid rgba(155,107,58,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 2px 12px rgba(155,107,58,0.18);
  overflow: hidden;
}

.login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

/* ─── BRAND ─── */
.login-brand {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: #9B6B3A;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 4px;
}

.login-sub {
  font-size: 12px;
  color: #9A7858;
  text-align: center;
  margin-bottom: 30px;
}

/* ─── ERROR ─── */
.login-error {
  display: none;
  background: rgba(184,64,64,0.08);
  border: 1px solid rgba(184,64,64,0.25);
  border-radius: 8px;
  padding: 9px 13px;
  font-size: 12px;
  color: #B84040;
  margin-bottom: 14px;
  text-align: center;
}

.login-error.show {
  display: block;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* ─── FIELDS ─── */
.login-field {
  position: relative;
  margin-bottom: 14px;
}

.login-field-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #9A7858;
  pointer-events: none;
  display: flex;
}

.login-input {
  width: 100%;
  background: #F5EFE4;
  border: 1px solid rgba(155,107,58,0.16);
  border-radius: 10px;
  padding: 11px 40px 11px 38px;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: #3A2515;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.login-input:focus {
  border-color: #9B6B3A;
  box-shadow: 0 0 0 3px rgba(155,107,58,0.08);
}

.login-input::placeholder {
  color: #9A7858;
}

/* ─── EYE TOGGLE ─── */
.login-eye {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9A7858;
  padding: 2px;
  transition: color 0.13s;
  display: flex;
}

.login-eye:hover {
  color: #9B6B3A;
}

/* ─── META ROW ─── */
.login-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 12px;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9A7858;
  cursor: pointer;
}

.login-remember input {
  accent-color: #9B6B3A;
  cursor: pointer;
}

/* ─── BUTTON ─── */
.btn-login {
  width: 100%;
  background: #9B6B3A;
  color: #FDFAF6;
  border: none;
  padding: 13px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 0.14s, transform 0.1s;
  box-shadow: 0 3px 10px rgba(155,107,58,0.3);
}

.btn-login:hover {
  background: #C49455;
}

.btn-login:active {
  transform: scale(0.98);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* ─── FOOTER ─── */
.login-footer {
  text-align: center;
  margin-top: 18px;
  font-size: 11px;
  color: #9A7858;
  letter-spacing: 0.06em;
}
</style>
