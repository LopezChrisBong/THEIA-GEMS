<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-card flat class="mb-4 pa-4 rounded-xl header-card">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="mb-1 font-weight-medium">Navigation List</h2>
          <small class="text-medium-emphasis">
            Manage and view navigation list
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
            @click="addnew()"
          >
            Add User
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card elevation="2" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="data"
        :search="search"
        :items-per-page="10"
        :loading="loading"
        loading-text="Loading modules..."
        class="rounded-table"
        density="comfortable"
        @update:options="options"
        @pagination="pagination"
      >
        <template v-slot:[`item.icon`]="{ item }">
          <v-icon color="#8e6e25">{{ item.icon }}</v-icon>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="outlined"
            color="#8e6e25"
            @click="editItem(item)"
            class="mx-1"
          >
            <v-icon start size="18"> mdi-pencil-outline </v-icon>
            Edit
          </v-btn>

          <v-btn
            size="small"
            variant="outlined"
            class="mx-1"
            color="red"
            @click="deleteItem(item)"
          >
            <v-icon start size="18"> mdi-delete-outline </v-icon>
            Delete
          </v-btn>
        </template>

        <template #no-data>
          <v-alert type="info" class="ma-4" icon="mdi-information">
            No modules found.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <ModulesListDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1">
          Are you sure you want to delete this module?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            color="grey"
            @click="dialogConfirmDelete = false"
          >
            Cancel
          </v-btn>
          <v-btn color="error" class="white--text" @click="confirmDelete">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Fade Message -->
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
import ModulesListDialog from "../../components/Dialogs/Forms/ModulesListDialog.vue";
import eventBus from "@/eventBus";
export default {
  components: {
    ModulesListDialog,
  },

  data: () => ({
    search: "",
    headers: [
      { title: "Title", value: "title", align: "start" },
      { title: "Icon", value: "icon", align: "center" },
      { title: "Route", value: "route", align: "center" },
      {
        title: "Actions",
        value: "actions",
        align: "center",
        sortable: false,
        width: 300,
      },
    ],
    data: [],
    perPageChoices: [
      { title: "5", value: 5 },
      { title: "10", value: 10 },
      { title: "20", value: 20 },
      { title: "50", value: 50 },
      { title: "100", value: 100 },
      { title: "250", value: 250 },
      { title: "500", value: 500 },
    ],
    totalCount: 0,
    deleteData: null,
    updateData: null,

    loading: false,
    options: {},
    action: null,
    paginationData: {},
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
  watch: {
    options: {
      handler() {
        this.initialize();
      },
      deep: true,
    },
  },
  mounted() {
    this.initialize();
    eventBus.on("closeModulesListDialog", () => {
      this.initialize();
    });
  },
  beforeUnmount() {
    eventBus.off("closeModulesListDialog");
  },
  methods: {
    pagination(data) {
      this.paginationData = data;
    },
    initialize() {
      this.loading = true;
      this.axiosCall("/sys-modules", "GET").then((res) => {
        if (res) {
          this.data = res.data;
          this.loading = false;
        }
      });
    },
    addnew() {
      this.updateData = [{ id: null }];
      this.action = "Add";
    },
    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },
    editItem(item) {
      this.updateData = item;
      this.action = "Update";
    },
    confirmDelete() {
      this.axiosCall("/request-type/" + this.deleteData.id, "DELETE").then(
        () => {
          this.fadeAwayMessage.show = true;
          this.itemData = null;
          this.initialize();
        },
      );
    },
  },
};
</script>
<style scoped>
.header-card {
  background: linear-gradient(135deg, #faf7f4, #ffffff);
}
.search-input {
  max-width: 260px;
}

.gap-2 {
  gap: 12px;
}
</style>
