<template>
  <div>
    <v-dialog v-model="dialog" scrollable max-width="600px">
      <v-card>
        <v-card-title dark class="dialog-header">
          <span> Update Users</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            dark
            @click="
              closeDialog();
              dialog = false;
            "
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-col> </v-col>
        <v-card-text style="max-height: 700px">
          <v-form ref="Formref">
            <v-container>
              <v-row class="ml-2 mr-2">
                <v-col cols="12">
                  <v-text-field
                    v-model="name"
                    readonly
                    dense
                    outlined
                    label="Name"
                    required
                    class="rounded-lg"
                    color="#6DB249"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-autocomplete
                    v-model="userModel.usertypeID"
                    :rules="[formRules.required]"
                    dense
                    outlined
                    class="rounded-lg"
                    item-text="description"
                    item-value="id"
                    label="User type"
                    color="#93CB5B"
                    :items="usertypeList"
                  >
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" v-if="userModel.usertypeID == 1">
                  <v-autocomplete
                    v-model="userModel.user_roleID"
                    :rules="
                      userModel.usertypeID == 1 ? [formRules.required] : []
                    "
                    dense
                    outlined
                    class="rounded-lg"
                    item-text="role"
                    item-value="id"
                    label="User role"
                    color="#93CB5B"
                    :items="userRoleList"
                  >
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" v-if="showBranchField">
                  <v-autocomplete
                    v-model="userModel.branchId"
                    dense
                    outlined
                    class="rounded-lg"
                    item-text="branchName"
                    item-value="branchId"
                    label="Assigned Branch"
                    color="#93CB5B"
                    :items="branchList"
                    clearable
                  >
                  </v-autocomplete>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions class="pa-5">
          <v-spacer></v-spacer>
          <v-btn
            color="red"
            outlined
            @click="
              closeDialog();
              dialog = false;
            "
          >
            <v-icon>mdi-close-circle-outline</v-icon>
            Cancel
          </v-btn>
          <v-btn color="#519043" class="white--text" @click="updateUserType()">
            <v-icon>mdi-check-circle</v-icon>
            Update Details
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
export default {
  props: {
    data: null,
    action: null,
  },
  data() {
    return {
      dialog: false,
      name: null,
      userModel: {
        id: null,
        usertypeID: null,
        user_roleID: null,
        branchId: null,
      },
      userRoleList: [
        { id: 1, role: "Admin" },
        { id: 2, role: "Staff" },
      ],
      usertypeList: [],
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
  computed: {
    showBranchField() {
      // Hide branch field for superadmin (user_roleID == 5) and owner usertype
      const usertypeDesc = this.usertypeList.find(
        (ut) => ut.id == this.userModel.usertypeID
      )?.description?.toLowerCase();
      const isSuperadmin = this.userModel.user_roleID == 5;
      const isOwner = usertypeDesc === "owner" || usertypeDesc === "superadmin";
      return !isSuperadmin && !isOwner;
    },
  },
  watch: {
    data: {
      handler(data) {
        if (data.id) {
          this.getUserType();
          this.getBranches();
          this.userModel.id = data.id;
          this.userModel.usertypeID = data.usertypeID.toString();
          this.userModel.user_roleID = data.user_roleID;
          this.userModel.branchId = data.branchId;
          this.dialog = true;
          this.name = data.mname
            ? data.lname + ", " + data.fname + " " + data.mname[0]
            : data.lname + ", " + data.fname;
        }
      },
      deep: true,
    },
  },
  methods: {
    getUserType() {
      this.axiosCall("/user-type/getAllUsertype", "GET").then((res) => {
        if (res.data) {
          this.usertypeList = res.data;
        }
      });
    },

    getBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res.data) {
          this.branchList = res.data;
        }
      });
    },

    close() {
      this.eventHub.$emit("closeUsersDialog", true);
    },
    updateUserType() {
      if (this.$refs.Formref.validate()) {
        let data = {
          id: this.userModel.id,
          user_roleID:
            this.userModel.usertypeID == 2 ? null : this.userModel.user_roleID,
          usertypeID: this.userModel.usertypeID,
          branchId: this.showBranchField ? this.userModel.branchId : null,
        };
        this.axiosCall("/user-details/updateUserTypeRole", "POST", data).then(
          (res) => {
            if (res.data.status == 200) {
              this.fadeAwayMessage.show = true;
              this.fadeAwayMessage.type = "success";
              this.fadeAwayMessage.header = "Successfully Updated";
              this.dialog = false;
              this.close();
            } else if (res.data.status == 400) {
              this.fadeAwayMessage.show = true;
              this.fadeAwayMessage.type = "error";
              this.fadeAwayMessage.header = res.data.msg;
            }
          }
        );
      }
    },
  },
};
</script>