<template>
  <div>
    <v-dialog v-model="dialog" max-width="640" scrollable persistent>
      <v-card rounded="xl" elevation="6">
        <!-- HEADER -->
        <v-card-title class="dialog-header px-6 py-4">
          <div>
            <h3 class="mb-1 font-weight-medium">{{ action }} User Account</h3>
            <small class="text-medium-emphasis">
              {{ step.name }}
            </small>
          </div>

          <v-spacer />

          <!-- <v-btn icon variant="text" @click="closeD">
          <v-icon>mdi-close</v-icon>
        </v-btn> -->
        </v-card-title>

        <!-- STEP INDICATOR -->
        <v-divider />
        <v-stepper
          :model-value="step.id"
          flat
          class="px-6 pt-4"
          v-if="action == 'Add'"
        >
          <v-stepper-header>
            <v-stepper-item
              v-for="s in [1, 2, 3]"
              :key="s"
              :value="s"
              :complete="step.id > s"
            >
              Step {{ s }}
            </v-stepper-item>
          </v-stepper-header>
        </v-stepper>

        <v-divider />

        <!-- BODY -->
        <v-card-text class="px-6 py-6 dialog-body">
          <v-form ref="AddAccount" @submit.prevent>
            <!-- STEP 1: BASIC INFO -->
            <v-row v-if="step.id === 1">
              <v-col cols="12">
                <v-text-field
                  v-model="fname"
                  label="First Name"
                  prepend-inner-icon="mdi-account"
                  :rules="[formRules.required]"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="mname"
                  label="Middle Name"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="lname"
                  label="Last Name"
                  prepend-inner-icon="mdi-account"
                  :rules="[formRules.required]"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>
            </v-row>

            <!-- STEP 2: ROLE & MODULE -->
            <v-row v-if="step.id === 2">
              <!-- <v-col cols="12">
                <v-autocomplete
                  v-model="verifyModel.usertypeID"
                  :items="usertypeList"
                  item-title="description"
                  item-value="id"
                  label="User Type"
                  :rules="userId == 3 ? [formRules.required] : []"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  v-model="verifyModel.user_roleID"
                  :items="userRoleList"
                  item-title="description"
                  item-value="id"
                  label="User Role"
                  :rules="[formRules.required]"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col> -->

              <v-col cols="12">
                <v-autocomplete
                  v-model="verifyModel.assignedModuleID"
                  :items="assignedModulesList"
                  item-title="description"
                  item-value="id"
                  label="Assigned Modules"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  v-model="verifyModel.branchId"
                  :items="branchList"
                  item-title="branchName"
                  item-value="branchId"
                  label="Assigned Branch"
                  variant="outlined"
                  rounded="lg"
                  clearable
                />
              </v-col>
            </v-row>

            <!-- STEP 3: CREDENTIALS -->
            <v-row v-if="step.id === 3">
              <v-col cols="12">
                <v-text-field
                  v-model="email"
                  label="Email"
                  prepend-inner-icon="mdi-email"
                  :readonly="action === 'Edit'"
                  :rules="[formRules.required, formRules.email]"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="password"
                  :label="action === 'Edit' ? 'New Password' : 'Password'"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  :rules="[formRules.required]"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>

              <v-col cols="12" v-if="action !== 'Edit'">
                <v-text-field
                  v-model="confirmPassword"
                  label="Confirm Password"
                  :type="showPasswordConfirm ? 'text' : 'password'"
                  :append-inner-icon="
                    showPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'
                  "
                  @click:append-inner="
                    showPasswordConfirm = !showPasswordConfirm
                  "
                  :rules="[formRules.required]"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  rounded="lg"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <!-- FOOTER -->
        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-btn
            variant="text"
            color="red"
            rounded="lg"
            elevation="1"
            @click="closeD"
          >
            Cancel
          </v-btn>

          <v-spacer />

          <v-btn
            color="primary"
            rounded="lg"
            elevation="1"
            @click="
              step.id == 3
                ? action == 'Add'
                  ? AddAccount()
                  : UpdateCredentials()
                : action == 'Update'
                ? UpdateInfo()
                : action == 'Edit'
                ? UpdateCredentials()
                : Next()
            "
          >
            {{
              step.id == 3
                ? action == "Add"
                  ? "Save"
                  : "Update"
                : action == "Update"
                ? "Update"
                : action == "Edit"
                ? "Update"
                : "Next"
            }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <fade-away-message-component
      displayType="variation2"
      v-model="fadeAwayMessage.show"
      :message="fadeAwayMessage.message"
      :header="fadeAwayMessage.header"
      :top="fadeAwayMessage.top"
      :type="fadeAwayMessage.type"
    ></fade-away-message-component>
  </div>
</template>

<script>
import eventBus from "@/eventBus";
import { nextTick } from "vue";
export default {
  props: {
    data: Object,
    action: String,
  },
  data() {
    return {
      dialog: false,
      step: { id: 1, name: "Personal Information" },
      email: null,
      password: null,
      emailError: null,
      confirmPassword: null,
      showPassword: false,
      showPasswordConfirm: false,
      fname: null,
      lname: null,
      mname: null,
      verifyModel: {
        id: null,
        userID: null,
        name: null,
        empID: null,
        date_hired: null,
        usertypeID: null,
        assignedModuleID: null,
        user_roleID: null,
        newStatus: null,
        branchId: null,
      },
      userRoleList: [],
      usertypeList: [],
      assignedModulesList: [],
      branchList: [],
      fadeAwayMessage: {
        show: false,
        type: "success",
        header: "Successfully Added!",
        message: "",
        top: 10,
      },
    };
  },
  watch: {
    data: {
      async handler(data) {
        this.dialog = true;
        this.initialize();
        this.$refs.AddAccount?.resetValidation();
        await nextTick();
        if (data.id) {
          console.log("Love", data);
          this.verifyModel.id = data.id;
          this.verifyModel.userID = data.user_id;
          this.verifyModel.name = data.name;
          this.verifyModel.empID = data.emp_empID;
          this.verifyModel.usertypeID = data.user_usertypeID.toString();
          this.verifyModel.user_roleID = data.user_user_roleID;
          this.verifyModel.assignedModuleID = data.user_assignedModuleID;
          this.verifyModel.newStatus = data.status;
          this.verifyModel.branchId = data.branchId;
          this.fname = data.fname;
          this.lname = data.lname;
          this.mname = data.mname;
          this.email = data.user_email;
          if (this.action == "Update") {
            this.step = { id: 1, name: "Personal Information" };
          } else if (this.action == "Edit") {
            this.step = { id: 3, name: "Account Credentials" };
          }
        } else {
          (this.verifyModel.id = null), (this.verifyModel.userID = null);
          this.verifyModel.name = null;
          this.verifyModel.empID = null;
          this.verifyModel.usertypeID = null;
          this.verifyModel.user_roleID = null;
          this.verifyModel.assignedModuleID = null;
          this.verifyModel.newStatus = data.status;
          this.verifyModel.branchId = null;
        }
      },
      deep: true,
    },
    dialog(val) {
      if (val) {
        nextTick(() => {
          this.$refs.AddAccount?.resetValidation();
        });
      }
    },
  },
  methods: {
    checkEmail() {
      this.emailChecking = true;
      this.axiosCall("/auth/checkEmailIfExist/" + this.email, "GET").then(
        (res) => {
          console.log(res.data);
          if (res.data) {
            this.emailError = "Email Already Exist!";
          } else {
            this.emailError = "";
          }
          this.emailChecking = false;
        },
      );
    },
    initialize() {
      this.userId = this.$store.state.user.id;
      this.getUserType();
      this.getAssignedModules();
      this.getUseRoles();
      this.getBranches();
    },
    getUserType() {
      this.axiosCall("/user-type/getAllUsertype", "GET").then((res) => {
        if (res.data) {
          console.log("UserList", res.data);
          let data = res.data;
          this.usertypeList = data;
        }
      });
    },
    AddAccount() {
      // registration logic here
      if (this.password != this.confirmPassword) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.message = "Password not mutch";
        this.fadeAwayMessage.header = "System Message";
      } else {
        if (this.$refs.AddAccount.validate()) {
          let data = {
            fname: this.fname,
            mname: this.mname,
            lname: this.lname,
            // user_roleID: this.userType == 0 ? 3 : 2,
            // isAdminApproved: this.userType == 0 ? 1 : 0,
            // suffix: this.suffix,
            email: this.email,
            password: this.password,
            usertypeID: 2,
            assignedModuleID: this.verifyModel.assignedModuleID,
            isAdminApproved: 1,
            user_roleID: 2,
            branchId: this.verifyModel.branchId,
          };
          console.log(data);
          this.axiosCall("/auth/addAccount", "POST", data).then((res) => {
            if (res.data.status == 201 || res.data.status == 200) {
              this.fadeAwayMessage.show = true;
              this.fadeAwayMessage.type = "success";
              this.fadeAwayMessage.message = res.data.message;
              this.fadeAwayMessage.header = "System Message";
              this.$store.dispatch("setEmail", this.email);
              this.closeD();
              this.refresh();
            } else {
              this.isLoading = false;
              this.fadeAwayMessage.show = true;
              this.fadeAwayMessage.type = "error";
              this.fadeAwayMessage.message = res.data.message;
              this.fadeAwayMessage.header = "System Message";
              this.animated = true;
            }
          });
        }
      }
    },
    UpdateCredentials() {
      if (this.password == null) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.message = "Please fill-up required fields!";
        this.fadeAwayMessage.header = "System Message";
      } else {
        let data = {
          old_password: null,
          new_password: this.password,
        };
        this.axiosCall(
          "/auth/changePassIDCred/" + this.data.id,
          "POST",
          data,
        ).then((res) => {
          if (res.data.status == 200) {
            this.fadeAwayMessage.message = res.data.msg;
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "System Message";
            this.closeD();
            this.refresh();
          } else if (res.data.status == 400) {
            this.fadeAwayMessage.message = res.data.msg;
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "System Message";
          }
        });
      }
    },
    UpdateInfo() {
      let data = {
        fname: this.fname,
        mname: this.mname,
        lname: this.lname,
      };
      this.axiosCall(
        "/user-details/updateUserInfo/" +
          this.data.id +
          "/" +
          JSON.stringify(data),
        "POST",
        data,
      ).then((res) => {
        if (res.data.status == 200) {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "success";
          this.fadeAwayMessage.message = "Successfully Updated!";
          this.fadeAwayMessage.header = "System Message";
          this.closeD();
          this.refresh();
        } else {
          this.isLoading = false;
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.message = res.data.message;
          this.fadeAwayMessage.header = "System Message";
          this.animated = true;
        }
      });
    },
    closeD() {
      eventBus.emit("closeAddAccountDialog", true);
      this.step = { id: 1, name: "Personal Information" };
      this.dialog = false;
      this.refresh();
    },
    Next() {
      if (this.fname == null || this.lname == null) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.message =
          "Please fill-up required fields for users Information!";
        this.fadeAwayMessage.header = "System Message";
      } else if (this.step.id == 1) {
        this.step = { id: 2, name: "Accounts Modules" };
      } else if (this.step.id == 2) {
        if (this.verifyModel.assignedModuleID == null) {
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.message =
            "Please fill-up required fields for users Modules!";
          this.fadeAwayMessage.header = "System Message";
        } else {
          this.step = { id: 3, name: "Account Information" };
        }
      }

      //  else if (this.step.id == 3) {
      //   if (this.$refs.Step3Formref.validate()) {
      //     this.step = { id: 4, name: "Otp Confirmation" };
      //   }
      // }
    },

    getAssignedModules() {
      this.axiosCall("/assigned-modules", "GET").then((res) => {
        console.log("AssignedM", res.data);
        let data = res.data;
        this.assignedModulesList = data;
      });
    },
    getUseRoles() {
      this.axiosCall("/user-role", "GET").then((res) => {
        console.log("UserRole", res.data);
        this.userRoleList = res.data;
      });
    },
    getBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res.data) {
          this.branchList = res.data;
        }
      });
    },
    refresh() {
      this.fname = null;
      this.lname = null;
      this.mname = null;
      this.email = null;
      this.password = null;
      this.confirmPassword = null;
      this.verifyModel.user_roleID = null;
      this.verifyModel.assignedModuleID = null;
      this.verifyModel.usertypeID = null;
      this.verifyModel.branchId = null;
    },
  },
};
</script>
