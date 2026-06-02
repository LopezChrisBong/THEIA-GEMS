// store/index.js
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import SecureLS from 'secure-ls'

const ls = new SecureLS({ isCompression: false })

const store = createStore({
  state: {
    thisVue: {},
    user: null,
    isAuthenticated: 0,
    email: null,
    emp: null,
    expiryDate: null,
    filterSelected: null,
  },
  getters: {
    getIsAuthenticated: (state) => state.isAuthenticated,
    getEmail: (state) => state.email,
    isExpired: (state) => state.expiryDate < Date.now(),
    getUserData: (state) => state.user,
    getFilterSelected: (state) => state.filterSelected,
    getEmp: (state) => state.emp,
  },
  mutations: {
    resetState(state) {
      state.user = null
      state.isAuthenticated = 0
      state.email = null
      state.emp = null
      state.expiryDate = null
      state.filterSelected = null
    },
    setExpiryDate(state) {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      state.expiryDate = Date.parse(date)
    },
    setThisVue(state, payload) {
      state.thisVue = payload
    },
    setEmail(state, payload) {
      state.email = payload
    },
    setIsAuthenticated(state, payload) {
      state.isAuthenticated = payload
    },
    setUserData(state, data) {
      state.user = data
    },
    setFilterSelected(state, data) {
      state.filterSelected = data
    },
    setEmp(state, data) {
      state.emp = data
    },
  },
  actions: {
    setThisVue({ commit }, payload) {
      commit('setThisVue', payload)
    },
    setEmail({ commit }, payload) {
      commit('setEmail', payload)
    },
    setUser({ commit }, data) {
      commit('setUserData', data)
    },
    setIsAuthenticated({ commit }, data) {
      commit('setIsAuthenticated', data)
    },
    setEmp({ commit }, data) {
      commit('setEmp', data)
    },
  },
  plugins: [
    createPersistedState({
      storage: {
        getItem: (key) => {
          try {
            return ls.get(key)
          } catch {
            ls.remove(key)
            return null
          }
        },
        setItem: (key, state) => ls.set(key, state),
        removeItem: (key) => ls.remove(key),
      },
    }),
  ],
})

export default store
