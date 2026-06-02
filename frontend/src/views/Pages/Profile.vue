<template>
  <div class="mx-2">
    <v-card class="mt-2 pt-2 pb-8">
      <v-row style="border-radius: 10px" class="elevation-4 mx-6 mt-6">
        <!-- <v-card class="card-style rounded-xl"> -->
        <v-col cols="12" md="4">
          <v-row align="center">
            <v-col cols="12" class="text-center">
              <v-avatar
                class="mt-4 mb-4"
                size="185"
                style="border: 2px solid; border-color: #a9a9a9"
              >
                <v-img
                  :src="!isSelecting ? data.profile_img : previewImg"
                ></v-img>

                <v-btn
                  variant="outlined"
                  v-if="!readonly"
                  color="#519043"
                  style="border-radius: 100%"
                  height="40px"
                  width="40px"
                  dark
                  x-small
                  absolute
                  bottom
                  right
                  @click="handleFileImport()"
                >
                  <v-icon> mdi-image-edit-outline</v-icon>
                </v-btn>
              </v-avatar>
              <v-file-input
                @change="onFileChanged()"
                id="fileUpload"
                hide-input
                accept="image/png, image/jpeg, image/jpg"
                class="d-none"
              ></v-file-input>

              <h3 class="mt-4 font-weight-bold">
                {{ data.fname }} {{ data.mname ? data.mname[0] + "." : "" }}
                {{ data.lname }}
                <span v-if="data.suffix"> {{ data.suffix }}</span>
              </h3>

              <v-chip class="mt-2" color="#d6a89c" outlined>
                {{ $store.state.user.usertype.description }}
              </v-chip>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" md="8" style="border-left: 1px solid #e8dfdf">
          <v-card rounded="xl" elevation="2">
            <v-tabs v-model="tab" grow color="#d6a89c">
              <v-tab :value="0">Personal Info</v-tab>
              <v-tab :value="1">Security</v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="tab" class="mt-4">
              <!-- TAB 1 -->
              <v-window-item :value="0">
                <v-card-text>
                  <v-form ref="personalInfo">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          label="First Name"
                          v-model="data.fname"
                          :readonly="readonly"
                          variant="outlined"
                          density="compact"
                        />
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-text-field
                          label="Middle Name"
                          v-model="data.mname"
                          :readonly="readonly"
                          variant="outlined"
                          density="compact"
                        />
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-text-field
                          label="Last Name"
                          v-model="data.lname"
                          :readonly="readonly"
                          variant="outlined"
                          density="compact"
                        />
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-text-field
                          label="Suffix"
                          v-model="data.suffix"
                          :readonly="readonly"
                          variant="outlined"
                          density="compact"
                        />
                      </v-col>
                    </v-row>
                  </v-form>

                  <v-divider class="my-4" />

                  <v-card-actions class="justify-end">
                    <v-btn
                      v-if="readonly"
                      color="primary"
                      @click="readonly = false"
                    >
                      <v-icon start>mdi-pencil</v-icon>
                      Edit
                    </v-btn>

                    <template v-else>
                      <v-btn
                        variant="text"
                        color="red"
                        @click="readonly = true"
                      >
                        Cancel
                      </v-btn>
                      <v-btn color="green" @click="updateProfile">
                        Save Changes
                      </v-btn>
                    </template>
                  </v-card-actions>
                </v-card-text>
              </v-window-item>

              <!-- TAB 2 -->
              <v-window-item :value="1">
                <v-card-text>
                  <v-container class="mt-10">
                    <v-form ref="loginInfo" @submit.prevent>
                      <v-row class="ml-2 mr-2 mt-1">
                        <v-col cols="12">
                          <v-text-field
                            placeholder="************"
                            class="font-size-14"
                            color="#93CB5B"
                            dense
                            :disabled="credentialReadonly"
                            v-model="oldPass"
                            :append-icon="
                              showOldPass ? 'mdi-eye' : 'mdi-eye-off'
                            "
                            :rules="[formRules.required]"
                            :type="showOldPass ? 'text' : 'password'"
                            name="input-10-1"
                            label="Old Password"
                            @click:append="showOldPass = !showOldPass"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            placeholder="************"
                            class="font-size-14"
                            color="#93CB5B"
                            dense
                            :disabled="credentialReadonly"
                            v-model="password"
                            :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[formRules.required, formRules.password]"
                            :type="show1 ? 'text' : 'password'"
                            name="input-10-1"
                            label="New Password"
                            @click:append="show1 = !show1"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            placeholder="************"
                            class="font-size-14"
                            color="#93CB5B"
                            :disabled="credentialReadonly"
                            dense
                            v-model="confirmPassword"
                            :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[
                              formRules.required,
                              formRules.confirmPassword(
                                confirmPassword,
                                password
                              ),
                            ]"
                            :type="show2 ? 'text' : 'password'"
                            name="input-10-1"
                            label="Confirm Password"
                            @click:append="show2 = !show2"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                      <v-card-actions
                        v-if="credentialReadonly == true"
                        class="pa-5"
                      >
                        <v-spacer></v-spacer>
                        <v-btn
                          color="#519043"
                          class="white--text"
                          @click="credentialReadonly = false"
                        >
                          <v-icon>mdi-pencil</v-icon>
                          Edit
                        </v-btn>
                      </v-card-actions>
                      <v-card-actions
                        v-if="credentialReadonly == false"
                        class="pa-5"
                      >
                        <v-spacer></v-spacer>
                        <v-btn
                          color="red"
                          outlined
                          @click="credentialReadonly = true"
                        >
                          <v-icon>mdi-close-circle-outline</v-icon>
                          Cancel
                        </v-btn>
                        <v-btn
                          color="#519043"
                          class="white--text"
                          @click="updateCredential()"
                        >
                          <v-icon>mdi-check-circle</v-icon>
                          Save
                        </v-btn>
                      </v-card-actions>
                    </v-form>
                  </v-container>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>

        <!-- </v-card> -->
      </v-row>
    </v-card>
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
  name: "profilePage",
  data() {
    return {
      isSelecting: false,
      selectFile: null,
      previewImg: null,
      tab: null,
      items: ["Personal Information", "Login Info"],
      data: {
        fname: null,
        mname: null,
        lname: null,
        suffix: null,
        profile_img: null,
        designation: null,
        position: null,
        empID: null,
        empStatus: null,
        office: null,
        institute: null,
      },
      oldPass: null,
      password: null,
      confirmPassword: null,
      showOldPass: false,
      show1: false,
      show2: false,
      fadeAwayMessage: {
        show: false,
        type: "success",
        header: "System Message!",
        message: "",
        top: 10,
      },
      readonly: true,
      credentialReadonly: true,
    };
  },

  methods: {
    initialize() {
      this.axiosCall("/user-details/getPersonalInfo", "GET").then((res) => {
        if (res.data) {
          this.data.fname = res.data.fname;
          this.data.mname = res.data.mname;
          this.data.lname = res.data.lname;
          this.data.suffix = res.data.suffix;
          this.data.designation = res.data.designation;
          this.data.position = res.data.position;
          this.data.empID = res.data.empID;
          this.data.empStatus = res.data.employment_status;
          this.data.office = res.data.office;
          this.data.institute = res.data.institute;
          this.data.profile_img = res.data.profile_img
            ? process.env.VUE_APP_SERVER +
              "/user-details/getProfileImg/" +
              res.data.profile_img
            : null;
        }
      });
    },

    updateCredential() {
      if (this.$refs.loginInfo.validate()) {
        let data = {
          old_password: this.oldPass,
          new_password: this.password,
        };
        this.axiosCall("/auth/changePass", "POST", data).then((res) => {
          if (res.data.status == 200) {
            this.fadeAwayMessage.message = res.data.msg;
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.password = null;
            this.confirmPassword = null;
            this.credentialReadonly = true;
          } else if (res.data.status == 400) {
            this.fadeAwayMessage.message = res.data.msg;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.show = true;
          }
        });
      }
    },

    updateProfile() {
      if (this.$refs.personalInfo.validate()) {
        const fd = new FormData();

        this.axiosCall("/user-details/updateUser", "POST", this.data).then(
          (res) => {
            if (res.data.status == 200) {
              if (this.selectFile) {
                fd.append("file", this.selectFile);
                this.axiosCall("/user-details/uploadimage", "POST", fd).then(
                  (resp) => {
                    if (resp.data.status == 200) {
                      this.isSelecting = false;
                      this.selectFile = null;
                      this.initialize();
                      this.fadeAwayMessage.message = resp.data.msg;
                      this.fadeAwayMessage.show = true;
                      this.readonly = true;
                      this.$emit("reloadProfile");
                    } else if (resp.data.status == 400) {
                      this.initialize();
                      this.fadeAwayMessage.message = resp.data.msg;
                      this.fadeAwayMessage.show = true;
                      this.readonly = true;
                    }
                  }
                );
              } else {
                this.initialize();
                this.fadeAwayMessage.message = res.data.msg;
                this.fadeAwayMessage.show = true;
                this.readonly = true;
              }
            } else if (res.data.status == 400) {
              this.initialize();
              this.fadeAwayMessage.message = res.data.msg;
              this.fadeAwayMessage.show = true;
              this.readonly = true;
            }
          }
        );
      }
    },

    handleFileImport() {
      let fileUpload = document.getElementById("fileUpload");
      if (fileUpload != null) {
        fileUpload.click();
      }
    },
    onFileChanged() {
      const uploadedimg = document.getElementById("fileUpload").files[0];
      this.selectFile = uploadedimg;

      this.previewImg = URL.createObjectURL(uploadedimg);
      this.isSelecting = true;
    },
  },
  created() {
    this.initialize();
    // console.log("created");
    if (this.$store.state.expiryDate < Date.now()) {
      this.$store.dispatch("setUser", null);
      this.$store.dispatch("setIsAuthenticated", 0);
      this.render = true;
      this.$router.push("/");
      // location.reload();
    }
  },
};
</script>
<style scoped>
.profile-row {
  border-radius: 15px !important;
}
.profile-left-panel {
  background-color: #f1f7ff;
}
.profile-right-panel {
  background-color: #ffffff;
}
</style>
