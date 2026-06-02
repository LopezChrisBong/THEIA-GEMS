<template>
  <div>
    <v-dialog v-model="dialog" eager scrollable max-width="600px" persistent>
      <v-form ref="UserVerifyFormref" @submit.prevent>
        <v-card rounded="xl" elevation="6">
          <v-card-title class="px-6 py-4 dialog-header">
            <span>{{ action }} User Modules</span>
            <v-spacer></v-spacer>
            <!-- <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              @click="closeD()"
            >
            </v-btn> -->
          </v-card-title>

          <v-card-text style="max-height: 700px" class="">
            <v-container>
              <v-row>
                <!-- <v-col cols="12">
                  <v-autocomplete
                    v-model="verifyModel.usertypeID"
                    :rules="userId == 3 ? [formRules.required] : []"
                    :items="usertypeList"
                    item-value="id"
                    item-title="description"
                    label="User Type"
                    density="comfortable"
                    class="rounded-lg"
                    color="#93CB5B"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="verifyModel.user_roleID"
                    density="comfortable"
                    :rules="[formRules.required]"
                    class="rounded-lg"
                    item-value="id"
                    item-title="description"
                    label="User role"
                    color="#93CB5B"
                    :items="userRoleList"
                  >
                  </v-autocomplete>
                </v-col> -->

                <v-col cols="12">
                  <v-autocomplete
                    v-model="verifyModel.assignedModuleID"
                    :rules="userId == 3 ? [formRules.required] : []"
                    density="comfortable"
                    class="rounded-lg"
                    item-value="id"
                    item-title="description"
                    label="Modules to assign"
                    color="#93CB5B"
                    :items="assignedModulesList"
                  >
                  </v-autocomplete>
                </v-col>

                <v-col cols="12">
                  <v-autocomplete
                    v-model="verifyModel.branchId"
                    density="comfortable"
                    class="rounded-lg"
                    item-value="branchId"
                    item-title="branchName"
                    label="Assigned Branch"
                    color="#93CB5B"
                    :items="branchList"
                    clearable
                  >
                  </v-autocomplete>
                </v-col>

                <!-- <v-col cols="12" v-if="userId == 3">
                  <v-autocomplete
                    v-model="verifyModel.newStatus"
                    :rules="userId == 3 ? [formRules.required] : []"
                    dense
                    class="rounded-lg"
                    item-title="description"
                    item-value="id"
                    label="School Level"
                    color="#93CB5B"
                    :items="statusList"
                  >
                  </v-autocomplete>
                </v-col> -->
              </v-row>
            </v-container>
          </v-card-text>
          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-btn color="red" rounded="lg" elevation="1" @click="closeD()">
              <v-icon>mdi-close-circle-outline</v-icon>
              Cancel </v-btn
            ><v-spacer></v-spacer>
            <v-btn color="primary" rounded="lg" elevation="1" @click="accept()">
              <v-icon>mdi-check-circle</v-icon>
              {{ action == "Verify" ? "Accept" : "Update" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
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
export default {
  props: {
    data: Object,
    action: String,
  },
  data() {
    return {
      dialog: false,

      statusList: [
        { id: 1, description: "Elementary" },
        { id: 2, description: "High School" },
      ],
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
      handler(data) {
        this.dialog = true;
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
          this.verifyModel.branchId = null;
          this.initialize(data.branchId);
        } else {
          this.initialize(null);
        }
      },
      deep: true,
    },
  },
  methods: {
    initialize(branchId) {
      this.userId = this.$store.state.user.id;
      this.getUserType();
      this.getAssignedModules();
      this.getUseRoles();
      this.getBranches(branchId);
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
    closeD() {
      eventBus.emit("closeAccountsVerificationDialog", true);
      this.dialog = false;
    },
    accept() {
      // if (this.$refs.UserVerifyFormref.validate()) {
      let data = {
        id: this.verifyModel.id,
        userID: this.verifyModel.userID,
        positionID: this.verifyModel.positionID,
        usertypeID: this.verifyModel.usertypeID,
        user_roleID: this.verifyModel.user_roleID,
        assignedModuleID: this.verifyModel.assignedModuleID,
        status: this.verifyModel.newStatus,
        update_type: this.action == "Verify" ? 1 : 2,
        branchId: this.verifyModel.branchId,
      };

      this.axiosCall("/user-details/updateVerifiedUser", "POST", data).then(
        (res) => {
          if (res.data.status == 200) {
            this.dialog = false;
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "System Message";
            this.fadeAwayMessage.message = res.data.msg;
            this.closeD();
          } else if (res.data.status == 400) {
            this.dialog = false;
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "System Message";
            this.fadeAwayMessage.message = res.data.msg;
            // this.$refs.PositionFormref.reset();
            this.closeD();
          }
        },
      );
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
    getBranches(branchId) {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res.data) {
          this.branchList = res.data;
          this.$nextTick(() => {
            this.verifyModel.branchId = branchId ?? null;
          });
        }
      });
    },
  },
};
</script>
