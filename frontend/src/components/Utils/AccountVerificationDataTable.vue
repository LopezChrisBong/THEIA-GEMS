<template>
  <v-container fluid class="pa-4">
    <!-- PAGE HEADER -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">User Management</h2>
          <small class="text-medium-emphasis">
            Manage and view user accounts
          </small>
        </v-col>

        <v-col cols="12" md="6" class="d-flex justify-end gap-2">
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="search-input"
          />

          <v-btn
            color="#8e6e25"
            prepend-icon="mdi-plus"
            rounded="lg"
            elevation="1"
            @click="add()"
          >
            Add User
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- DATA TABLE -->
    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="data"
        :search="search"
        :items-per-page="10"
        :loading="loading"
        loading-text="Loading users..."
        class="rounded-table"
      >
        <template v-slot:[`item.fname`]="{ item }">
          <strong>{{ item.fname }} {{ item.lname }}</strong>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <div>
            <v-btn
              v-if="item.id != 1 && item.id != 19"
              size="small"
              variant="outlined"
              color="#8e6e25"
              @click="tab === 1 ? editItem(item) : viewItem(item)"
            >
              <v-icon start size="18">
                {{ tab === 1 ? "mdi-check-circle" : "mdi-eye-outline" }}
              </v-icon>
              {{ tab === 1 ? "Verify" : "View" }}
            </v-btn>

            <v-btn
              v-if="item.id != 1 && item.id != 19"
              size="small"
              variant="outlined"
              color="error"
              class="mx-2"
              @click="deleteItem(item)"
            >
              <v-icon start size="18">mdi-delete-outline</v-icon>
              Delete
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <v-empty-state
            icon="mdi-account-off-outline"
            title="No users found"
            text="Try adjusting your search or filters"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- VERIFICATION / ADD DIALOGS -->
    <AccountVerificationDialog :data="updateData" :action="action" />
    <AddAccountDialog :data="addData" :action="action" />

    <!-- DELETE CONFIRMATION -->
    <v-dialog v-model="dialogConfirmDelete" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="font-weight-medium">
          Confirm Deletion
        </v-card-title>

        <v-card-text class="text-medium-emphasis">
          Are you sure you want to delete this account? This action cannot be
          undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirmDelete = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="confirmDelete"> Delete </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- VIEW ACCOUNT DIALOG (kept your improved version) -->
    <v-dialog v-model="dialog" max-width="560">
      <v-card rounded="xl" elevation="4">
        <!-- HEADER -->
        <v-card-title class="d-flex align-center px-6 py-4">
          <div>
            <h3 class="mb-0 font-weight-medium">View Account</h3>
            <small class="text-medium-emphasis">
              Select an action to continue
            </small>
          </div>

          <v-spacer />

          <!-- <v-btn icon variant="text" color="error" @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn> -->
        </v-card-title>

        <v-divider />

        <!-- CONTENT -->
        <v-card-text class="px-6 py-6">
          <v-row dense>
            <!-- MODULE -->
            <v-col cols="12" md="4">
              <v-card
                class="action-card"
                elevation="1"
                rounded="lg"
                @click="editItem(dataEdit)"
              >
                <v-card-text class="text-center py-6">
                  <v-icon size="48" color="primary">
                    mdi-file-cog-outline
                  </v-icon>
                  <div class="mt-3 font-weight-medium">Modules</div>
                  <small class="text-medium-emphasis">
                    Manage assigned modules
                  </small>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- PERSONAL INFO -->
            <v-col cols="12" md="4">
              <v-card
                class="action-card"
                elevation="1"
                rounded="lg"
                @click="personalInfo(dataEdit)"
              >
                <v-card-text class="text-center py-6">
                  <v-icon size="48" color="primary">
                    mdi-file-image-plus-outline
                  </v-icon>
                  <div class="mt-3 font-weight-medium">Personal Info</div>
                  <small class="text-medium-emphasis">
                    Update user details
                  </small>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- CREDENTIALS -->
            <v-col cols="12" md="4">
              <v-card
                class="action-card"
                elevation="1"
                rounded="lg"
                @click="credentials(dataEdit)"
              >
                <v-card-text class="text-center py-6">
                  <v-icon size="48" color="primary"> mdi-file-sign </v-icon>
                  <div class="mt-3 font-weight-medium">Credentials</div>
                  <small class="text-medium-emphasis">
                    View access & login
                  </small>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- TOAST -->
    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    />
  </v-container>
</template>

<script>
import eventBus from "@/eventBus";
import AccountVerificationDialog from "../../components/Dialogs/Forms/AccountVerificationDialog.vue";
import AddAccountDialog from "../../components/Dialogs/Forms/AddAccountDialog.vue";
export default {
  components: {
    AccountVerificationDialog,
    AddAccountDialog,
  },
  data: () => ({
    search: "",
    dialog: false,
    headers: [
      { title: "Name", value: "name", align: "start" },
      {
        title: "Actions",
        value: "actions",
        align: "center",
        sortable: false,
        width: 300,
      },
    ],
    data: [],
    dataEdit: [],
    verified: [],
    perPageChoices: [
      { text: "5", value: 5 },
      { text: "10", value: 10 },
      { text: "20", value: 20 },
      { text: "50", value: 50 },
      { text: "100", value: 100 },
      { text: "250", value: 250 },
      { text: "500", value: 500 },
    ],
    activeTab: { id: 2, name: "Verified", active: true },
    tab: 2,
    tabList: [
      { id: 1, name: "For Verification", active: true },
      { id: 2, name: "Verified", active: false },
    ],
    totalCount: 0,
    deleteData: null,
    updateData: null,
    loading: false,
    options: {},
    action: null,
    paginationData: {},
    addData: null,
    formdata: [],
    work_dates_menu: false,
    dialogConfirmDelete: false,
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "Successfully Deleted!",
      message: "",
      top: 10,
    },
  }),

  mounted() {
    this.initialize();
    this.dialog = false;
    eventBus.on("closeAccountsVerificationDialog", () => {
      if (this.tab == 1) {
        this.initialize();
      } else if (this.tab == 2) {
        this.getVerifiedUsers();
      }
    });
    eventBus.on("closeAddAccountDialog", () => {
      if (this.tab == 1) {
        this.initialize();
      } else if (this.tab == 2) {
        this.getVerifiedUsers();
      }
    });
  },
  beforeUnmount() {
    eventBus.off("closeAccountsVerificationDialog");
    eventBus.off("closeAddAccountDialog");
  },
  watch: {
    options: {
      handler() {
        if (this.tab == 1) {
          this.initialize();
        } else if (this.tab == 2) {
          this.getVerifiedUsers();
        }
      },
      deep: true,
    },
    filterYear: {
      handler(newData, oldData) {
        if (oldData != newData) {
          this.initialize();
        }
      },
      deep: true,
    },
  },
  computed: {
    isMobile() {
      return this.$vuetify.display.mobile;
    },
    filterYear() {
      return this.$store.getters.getFilterSelected;
    },
  },

  methods: {
    pagination(data) {
      this.paginationData = data;
    },

    initialize() {
      // let filter = this.$store.getters.getFilterSelected;
      // console.log("Filted", filter);
      this.loading = true;
      this.tab = 2;

      // this.axiosCall("/user-details/getAllUsersToVerify", "GET").then((res) => {
      //   if (res) {
      //     // console.log(res.data);
      //     let data = res.data;
      //     data.forEach((element, i) => {
      //       data[i].name = this.toTitleCase(element.name);
      //     });
      //     this.activeTab = { id: 1, name: "For Verification" };
      //     this.data = data;
      //     this.dialog = false;
      //     this.loading = false;
      //   }
      // });
      this.axiosCall("/user-details/getAllVerifiedUser", "GET").then((res) => {
        if (res) {
          let data = res.data;
          data.forEach((element, i) => {
            data[i].name = this.toTitleCase(element.name);
          });
          this.data = data;
          this.dialog = false;
          this.loading = false;
        }
      });
    },

    getVerifiedUsers() {
      this.loading = true;
      this.axiosCall("/user-details/getAllVerifiedUser", "GET").then((res) => {
        if (res) {
          let data = res.data;
          data.forEach((element, i) => {
            data[i].name = this.toTitleCase(element.name);
          });
          this.data = data;
          this.dialog = false;
          this.loading = false;
        }
      });
    },

    changeTab(tab) {
      this.activeTab = tab.id; // Now setting only the ID

      if (tab.id === 1) {
        this.initialize();
      } else if (tab.id === 2) {
        this.getVerifiedUsers();
      }

      this.tab = tab.id;

      // Optional: if you want visual styling control using `tab.active`
      this.tabList.forEach((t) => {
        t.active = t.id === tab.id;
      });
    },

    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },
    add() {
      this.addData = [{ id: null }];
      this.action = "Add";
    },
    personalInfo(dataEdit) {
      this.addData = dataEdit;
      this.action = "Update";
    },
    credentials(dataEdit) {
      this.addData = dataEdit;
      this.action = "Edit";
    },

    editItem(item) {
      this.updateData = item;
      // this.updateData = [{ id: null }];
      this.action = this.tab == 1 ? "Verify" : "Update";
    },
    viewItem(item) {
      this.dialog = true;
      this.dataEdit = item;
    },

    confirmDelete() {
      this.axiosCall("/user-details/" + this.deleteData.id, "DELETE").then(
        (res) => {
          console.log(res.data);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "success";
          this.fadeAwayMessage.header = "System Message";
          this.fadeAwayMessage.message = "Account deleted successfully!";
          this.dialogConfirmDelete = false;
          this.initialize();
        },
      );
    },
  },
};
</script>
<style scoped>
.action-card {
  cursor: pointer;
  transition: all 0.25s ease;
  height: 150px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  background-color: #d6a89c;
  color: white;
}
.header-card {
  background: linear-gradient(135deg, #faf7f4, #ffffff);
}

.search-input {
  max-width: 260px;
}

.data-table {
  padding: 8px;
}

.action-card {
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
}

.gap-2 {
  gap: 12px;
}
</style>
