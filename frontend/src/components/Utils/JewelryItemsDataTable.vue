<template>
  <v-container fluid class="theia-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-heading">Items</div>
        <div class="page-sub">Manage inventory items</div>
      </div>
      <div class="header-actions">
        <div class="search-wrap">
          <v-icon size="14" color="#9A7858">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Search items..." class="search-input-proto" />
        </div>
        <button class="btn-import" @click="dialogImport = true">
          <v-icon size="13" color="#9B6B3A">mdi-file-upload-outline</v-icon>
          Import
        </button>
        <button class="btn-add" @click="addNew()">
          <v-icon size="13" color="white">mdi-plus</v-icon>
          Add Item
        </button>
      </div>
    </div>

    <!-- Filter + Table Card -->
    <div class="cust-table-card">
      <div class="filter-row">
        <div class="per-pg">
          Category:
          <select v-model="filterCategory" @change="initialize()">
            <option :value="null">All</option>
            <option v-for="c in categoryList" :key="c.id" :value="c.id">{{ c.categoryName }}</option>
          </select>
        </div>
        <div v-if="!userBranchId" class="per-pg">
          Branch:
          <select v-model="filterBranch" @change="initialize()">
            <option :value="null">All</option>
            <option v-for="b in branchList" :key="b.branchId" :value="b.branchId">{{ b.branchName }}</option>
          </select>
        </div>
        <div class="per-pg">
          Status:
          <select v-model="filterStatus" @change="initialize()">
            <option :value="null">All</option>
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="filter-spacer" />
        <div class="per-pg">
          Items per page:
          <select v-model="perPage" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="tbl-wrap">
        <table class="cust-table" v-if="!loading">
          <thead>
            <tr>
              <th @click="sortBy('itemCode')">Code</th>
              <th @click="sortBy('barcode')">Barcode</th>
              <th @click="sortBy('category')">Category</th>
              <th @click="sortBy('brand')">Name</th>
              <th @click="sortBy('material')">Description</th>
              <th @click="sortBy('ringSize')">Ring Size</th>
              <th @click="sortBy('price')">Price</th>
              <th @click="sortBy('status')">Status</th>
              <th @click="sortBy('branch')">Branch</th>
              <th @click="sortBy('supplier')">Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="mono">{{ item.itemCode }}</td>
              <td class="dim">{{ item.barcode || '—' }}</td>
              <td>
                <span v-if="item.category" class="cat-badge">{{ item.category.categoryName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td>{{ item.brand || '—' }}</td>
              <td>{{ item.material || '—' }}</td>
              <td class="text-center">{{ item.ringSize || '—' }}</td>
              <td class="text-right">
                <span v-if="item.price" class="amt-col">₱{{ formatNumber(item.price) }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="'st-' + item.status">{{ formatStatus(item.status) }}</span>
              </td>
              <td>
                <span v-if="item.branch" class="branch-badge">{{ item.branch.branchName }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="dim">{{ item.supplier?.supplierName || '—' }}</td>
              <td>
                <div class="act-btns">
                  <button class="act-btn view-btn" title="View" @click="viewItem(item)">
                    <v-icon size="14">mdi-eye-outline</v-icon>
                  </button>
                  <button class="act-btn" title="Edit" @click="editItem(item)">
                    <v-icon size="14">mdi-pencil-outline</v-icon>
                  </button>
                  <button class="act-btn del" title="Delete" @click="deleteItem(item)">
                    <v-icon size="14">mdi-delete-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="11">
                <div class="empty-state">
                  <div class="empty-icon">
                    <v-icon size="20" color="#9B6B3A">mdi-package-variant-closed</v-icon>
                  </div>
                  <div class="empty-title">No items found</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading -->
        <div v-if="loading" class="empty-state">
          <v-progress-circular indeterminate color="#9B6B3A" size="32" />
          <div class="empty-title">Loading items...</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="cust-pagination" v-if="filteredData.length > 0">
        <div class="pg-info">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredData.length }}
        </div>
        <div class="pg-btns">
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage = 1">&laquo;</button>
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">&lsaquo;</button>
          <button
            v-for="p in visiblePages"
            :key="p"
            class="pg-btn"
            :class="{ cur: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">&rsaquo;</button>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">&raquo;</button>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <JewelryItemsDialog :data="updateData" :action="action" />

    <v-dialog v-model="dialogConfirmDelete" max-width="500">
      <v-card style="border-radius: 16px; border: 1px solid rgba(155,107,58,0.16);">
        <v-card-title class="text-h6" style="font-family: 'Cormorant Garamond', serif;">Confirm Deletion</v-card-title>
        <v-card-text class="text-body-1" style="color: #6B4A30;">
          Are you sure you want to delete item "{{ deleteData?.itemCode }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <button class="btn-cancel-proto" @click="dialogConfirmDelete = false">Cancel</button>
          <button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="dialogView" max-width="800" scrollable>
      <v-card v-if="viewData" class="rounded-lg">
        <v-card-title class="d-flex align-center px-6 py-4" style="background: linear-gradient(135deg, #faf7f4, #ffffff);">
          <v-icon class="mr-2" color="#8e6e25">mdi-tag-outline</v-icon>
          <span class="text-h6 font-weight-medium">{{ viewData.itemCode }}</span>
          <v-spacer />
          <v-chip
            :color="getStatusColor(viewData.status)"
            size="small"
            variant="flat"
          >
            {{ formatStatus(viewData.status) }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text style="max-height: 600px; overflow-y: auto" class="pa-6">
          <!-- Images -->
          <template v-if="viewData.images && viewData.images.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">IMAGES</div>
            <div class="d-flex flex-wrap ga-3 mb-4">
              <v-img
                v-for="img in viewData.images"
                :key="img.id"
                :src="apiUrl + '/uploads/jewelry-items/' + img.imagePath"
                width="120"
                height="120"
                cover
                class="rounded-lg view-image-thumb"
                @click="openImagePreview(img)"
                style="cursor: pointer;"
              />
            </div>
            <v-divider class="my-4" />
          </template>

          <!-- General Info -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">GENERAL INFORMATION</div>
          <v-row dense>
            <v-col cols="12" md="4">
              <div class="view-label">Item Code</div>
              <div class="view-value">{{ viewData.itemCode }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Barcode</div>
              <div class="view-value">{{ viewData.barcode || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Category</div>
              <div class="view-value">
                <v-chip v-if="viewData.category" size="small" variant="tonal" color="primary">
                  {{ viewData.category.categoryName }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Branch</div>
              <div class="view-value">
                <v-chip v-if="viewData.branch" size="small" variant="outlined" color="primary">
                  {{ viewData.branch.branchName }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Name</div>
              <div class="view-value">{{ viewData.brand || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Color</div>
              <div class="view-value">{{ viewData.color || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Description</div>
              <div class="view-value">{{ viewData.material || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Size</div>
              <div class="view-value">{{ viewData.size || '—' }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Pricing -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">PRICING</div>
          <v-row dense>
            <v-col cols="12" md="4">
              <div class="view-label">Price</div>
              <div class="view-value font-weight-medium">
                <span v-if="viewData.price">₱{{ Number(viewData.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Jewelry-Specific -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">JEWELRY DETAILS</div>
          <v-row dense>
            <v-col cols="12" md="4">
              <div class="view-label">Stone Type</div>
              <div class="view-value">{{ viewData.stoneType?.name || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Jewelry Type</div>
              <div class="view-value">{{ viewData.jewelryType?.name || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Color (Gold Type)</div>
              <div class="view-value">{{ formatGoldType(viewData.goldType) }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Karat</div>
              <div class="view-value">{{ viewData.karat || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Carat</div>
              <div class="view-value">{{ viewData.carat || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Ring Size</div>
              <div class="view-value">{{ viewData.ringSize || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Band Width</div>
              <div class="view-value">{{ viewData.bandWidth || '—' }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Supplier & Other -->
          <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">SUPPLIER & OTHER</div>
          <v-row dense>
            <v-col cols="12" md="4">
              <div class="view-label">Supplier</div>
              <div class="view-value">{{ viewData.supplier?.supplierName || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Purchase Date</div>
              <div class="view-value">{{ viewData.purchaseDate || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Added By</div>
              <div class="view-value">{{ viewData.addedByName || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Sale Date</div>
              <div class="view-value">{{ viewData.saleDate || '—' }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="view-label">Status</div>
              <div class="view-value">
                <v-chip :color="getStatusColor(viewData.status)" size="small" variant="flat">
                  {{ formatStatus(viewData.status) }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <template v-if="viewData.description || viewData.notes">
            <v-divider class="my-4" />
            <v-row dense>
              <v-col v-if="viewData.description" cols="12">
                <div class="view-label">Description</div>
                <div class="view-value">{{ viewData.description }}</div>
              </v-col>
              <v-col v-if="viewData.notes" cols="12">
                <div class="view-label">Notes</div>
                <div class="view-value">{{ viewData.notes }}</div>
              </v-col>
            </v-row>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-3 justify-end">
          <v-btn
            variant="outlined"
            color="#8e6e25"
            @click="editItem(viewData); dialogView = false"
          >
            <v-icon start size="18">mdi-pencil-outline</v-icon>
            Edit
          </v-btn>
          <v-btn
            variant="text"
            color="grey"
            @click="dialogView = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Slider Dialog -->
    <v-dialog v-model="dialogImagePreview" max-width="1000" content-class="image-slider-dialog">
      <v-card class="rounded-lg pa-0 bg-grey-darken-4" style="position: relative;">
        <!-- Close Button -->
        <v-btn
          icon
          size="small"
          color="white"
          variant="flat"
          class="image-preview-close"
          @click="dialogImagePreview = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <!-- Image Counter -->
        <div class="image-counter" v-if="previewImages.length > 1">
          {{ previewIndex + 1 }} / {{ previewImages.length }}
        </div>

        <!-- Main Image -->
        <div class="d-flex align-center justify-center" style="min-height: 500px; position: relative;">
          <!-- Previous Button -->
          <v-btn
            v-if="previewImages.length > 1"
            icon
            size="large"
            color="white"
            variant="flat"
            class="slider-nav-btn slider-prev"
            @click="prevImage"
          >
            <v-icon size="32">mdi-chevron-left</v-icon>
          </v-btn>

          <v-img
            v-if="previewImages.length > 0"
            :src="apiUrl + '/uploads/jewelry-items/' + previewImages[previewIndex].imagePath"
            max-height="600"
            max-width="900"
            contain
            class="mx-auto"
          />

          <!-- Next Button -->
          <v-btn
            v-if="previewImages.length > 1"
            icon
            size="large"
            color="white"
            variant="flat"
            class="slider-nav-btn slider-next"
            @click="nextImage"
          >
            <v-icon size="32">mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <!-- Thumbnail Strip -->
        <div v-if="previewImages.length > 1" class="d-flex justify-center ga-2 pa-3 bg-grey-darken-3">
          <v-img
            v-for="(img, idx) in previewImages"
            :key="'thumb-' + img.id"
            :src="apiUrl + '/uploads/jewelry-items/' + img.imagePath"
            width="60"
            height="60"
            cover
            class="rounded slider-thumbnail"
            :class="{ 'slider-thumbnail-active': idx === previewIndex }"
            @click="previewIndex = idx"
            style="cursor: pointer; flex: 0 0 60px;"
          />
        </div>
      </v-card>
    </v-dialog>

    <!-- Import Excel Dialog -->
    <v-dialog v-model="dialogImport" max-width="900" scrollable>
      <v-card class="rounded-lg">
        <v-card-title class="px-6 py-4" style="background: linear-gradient(135deg, #faf7f4, #ffffff);">
          <v-icon class="mr-2" color="#8e6e25">mdi-file-upload-outline</v-icon>
          <span class="text-h6 font-weight-medium">Import Items from Excel</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6" style="max-height: 600px; overflow-y: auto;">
          <!-- Step 1: Select file and branch -->
          <div v-if="!importPreviewData.length">
            <v-row dense>
              <v-col cols="12" class="mb-4">
                <v-file-input
                  v-model="importFile"
                  label="Select Excel File (.xlsx)"
                  accept=".xlsx,.xls"
                  prepend-icon="mdi-microsoft-excel"
                  outlined
                  dense
                  color="primary"
                  show-size
                  hint="Upload the inventory Excel file"
                  persistent-hint
                  @update:modelValue="parseExcel"
                />
              </v-col>
              <v-col cols="12" md="6" class="mb-4">
                <v-autocomplete
                  v-model="importBranchId"
                  :items="branchList"
                  item-title="branchName"
                  item-value="branchId"
                  label="Default Branch"
                  outlined
                  dense
                  color="primary"
                  hint="Branch for items without a color-coded branch"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" class="mb-2">
                <v-alert type="info" density="compact" variant="tonal">
                  Branch is auto-detected from cell colors:
                  <v-chip size="x-small" color="pink" variant="flat" class="mx-1">DAVAO</v-chip>
                  <v-chip size="x-small" color="orange" variant="flat" class="mx-1">BGC</v-chip>
                  Items without color use the default branch above.
                </v-alert>
              </v-col>
            </v-row>
            <v-alert v-if="importParsing" type="info" class="mt-2">
              Parsing Excel file...
            </v-alert>
          </div>

          <!-- Step 2: Preview parsed data -->
          <div v-if="importPreviewData.length">
            <v-alert type="success" density="compact" class="mb-4">
              Found <strong>{{ importPreviewData.length }}</strong> items to import
            </v-alert>

            <v-data-table
              :headers="importHeaders"
              :items="importPreviewData"
              :items-per-page="10"
              density="compact"
              class="rounded-lg"
            >
              <template v-slot:[`item._branch`]="{ item }">
                <v-chip v-if="item._branch" size="x-small" :color="item._branch === 'DAVAO' ? 'pink' : item._branch === 'BGC' ? 'orange' : 'purple'" variant="flat">
                  {{ item._branch }}
                </v-chip>
                <span v-else class="text-medium-emphasis">default</span>
              </template>
              <template v-slot:[`item.goldType`]="{ item }">
                <v-chip v-if="item.goldType" size="x-small" variant="tonal">{{ item.goldType }}</v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-slot:[`item.price`]="{ item }">
                <span v-if="item.price">₱{{ Number(item.price).toLocaleString('en-PH') }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-slot:[`item.status`]="{ item }">
                <v-chip :color="item.status === 'IN_STOCK' ? 'success' : 'grey'" size="x-small" variant="flat">
                  {{ formatStatus(item.status) }}
                </v-chip>
              </template>
            </v-data-table>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-btn v-if="importPreviewData.length" variant="text" color="grey" @click="resetImport">
            Back
          </v-btn>
          <v-spacer />
          <v-btn variant="text" color="red" @click="closeImport">Cancel</v-btn>
          <v-btn
            v-if="importPreviewData.length"
            color="primary"
            rounded
            elevation="2"
            :loading="importLoading"
            @click="submitImport"
          >
            <v-icon left>mdi-upload</v-icon>
            Import {{ importPreviewData.length }} Items
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import Result Dialog -->
    <v-dialog v-model="dialogImportResult" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="px-6 py-4">Import Result</v-card-title>
        <v-card-text class="pa-6">
          <v-alert type="success" density="compact" class="mb-3" v-if="importResult.imported > 0">
            Successfully imported <strong>{{ importResult.imported }}</strong> items
          </v-alert>
          <v-alert type="warning" density="compact" v-if="importResult.errors && importResult.errors.length > 0">
            <div class="font-weight-medium mb-1">{{ importResult.errors.length }} issue(s):</div>
            <div v-for="(err, i) in importResult.errors.slice(0, 20)" :key="i" class="text-caption">
              {{ err }}
            </div>
            <div v-if="importResult.errors.length > 20" class="text-caption mt-1">
              ...and {{ importResult.errors.length - 20 }} more
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 py-3 justify-end">
          <v-btn color="primary" @click="dialogImportResult = false">OK</v-btn>
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
import * as XLSX from "xlsx";
import JewelryItemsDialog from "../../components/Dialogs/Forms/JewelryItemsDialog.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    JewelryItemsDialog,
  },

  data: () => ({
    search: "",
    filterCategory: null,
    filterBranch: null,
    filterStatus: null,
    statusOptions: [
      { label: "On Hand / Available", value: "IN_STOCK" },
      { label: "For Preorder", value: "FOR_PREORDER" },
      { label: "Pull out", value: "PULLED_OUT" },
      { label: "Consignment", value: "CONSIGNMENT" },
      { label: "Sold", value: "SOLD" },
      { label: "Layaway", value: "LAYAWAY" },
      { label: "Transferred", value: "TRANSFERRED" },
    ],
    data: [],
    categoryList: [],
    branchList: [],
    totalCount: 0,
    deleteData: null,
    updateData: null,
    viewData: null,
    dialogView: false,
    dialogImagePreview: false,
    previewImages: [],
    previewIndex: 0,
    loading: false,
    deleting: false,
    action: null,
    currentPage: 1,
    perPage: 10,
    sortKey: "itemCode",
    sortDir: "asc",
    dialogConfirmDelete: false,
    dialogImport: false,
    dialogImportResult: false,
    importFile: null,
    importBranchId: null,
    importParsing: false,
    importLoading: false,
    importPreviewData: [],
    importResult: { imported: 0, errors: [] },
    importHeaders: [
      { title: "Code", value: "itemCode", width: 90 },
      { title: "Barcode", value: "barcode", width: 150 },
      { title: "Branch", value: "_branch", width: 90 },
      { title: "Sheet", value: "_sheet", width: 100 },
      { title: "Model", value: "description", width: 140 },
      { title: "Carat", value: "carat", width: 70 },
      { title: "Gold", value: "goldType", width: 60 },
      { title: "Price", value: "price", width: 90 },
      { title: "Status", value: "status", width: 90 },
    ],
    fadeAwayMessage: {
      show: false,
      type: "success",
      header: "Successfully Deleted!",
      message: "",
      top: 10,
    },
  }),

  computed: {
    userBranchId() {
      const id = this.$store.state.user?.branchId;
      return id ? Number(id) : null;
    },

    filteredData() {
      let result = [...this.data];

      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter((it) =>
          [
            it.itemCode,
            it.barcode,
            it.brand,
            it.material,
            it.category?.categoryName,
            it.supplier?.supplierName,
            it.branch?.branchName,
          ]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q))
        );
      }

      result.sort((a, b) => {
        let va = this.sortValue(a, this.sortKey);
        let vb = this.sortValue(b, this.sortKey);
        if (va == null) va = "";
        if (vb == null) vb = "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return this.sortDir === "asc" ? -1 : 1;
        if (va > vb) return this.sortDir === "asc" ? 1 : -1;
        return 0;
      });

      return result;
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredData.length / this.perPage));
    },

    paginatedData() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredData.slice(start, start + this.perPage);
    },

    paginationStart() {
      return Math.min((this.currentPage - 1) * this.perPage + 1, this.filteredData.length);
    },

    paginationEnd() {
      return Math.min(this.currentPage * this.perPage, this.filteredData.length);
    },

    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + 4);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
  },

  mounted() {
    if (this.userBranchId) this.filterBranch = this.userBranchId;
    this.initialize();
    this.loadCategories();
    this.loadBranches();
    eventBus.on("closeJewelryItemsDialog", () => {
      this.initialize();
    });
  },

  beforeUnmount() {
    eventBus.off("closeJewelryItemsDialog");
  },

  methods: {
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDir = "asc";
      }
    },

    sortValue(item, key) {
      if (key === "category") return item.category?.categoryName;
      if (key === "branch") return item.branch?.branchName;
      if (key === "supplier") return item.supplier?.supplierName;
      return item[key];
    },

    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      return Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    getStatusColor(status) {
      const colors = {
        IN_STOCK: "success",
        SOLD: "blue",
        TRANSFERRED: "orange",
        CONSIGNMENT: "purple",
        LAYAWAY: "cyan",
        PULLED_OUT: "grey",
        RESERVED: "amber",
      };
      return colors[status] || "grey";
    },

    formatStatus(status) {
      if (!status) return "";
      const labels = {
        IN_STOCK: "On Hand / Available",
        FOR_PREORDER: "For Preorder",
        PULLED_OUT: "Pull out",
        CONSIGNMENT: "Consignment",
        SOLD: "Sold",
        LAYAWAY: "Layaway",
        TRANSFERRED: "Transferred",
        RESERVED: "For Preorder",
      };
      return labels[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
    },

    formatGoldType(goldType) {
      if (!goldType) return "—";
      const labels = {
        YG: "Yellow Gold (YG)",
        WG: "White Gold (WG)",
        RG: "Rose Gold (RG)",
        TWO_TONED: "Two-Toned",
      };
      return labels[goldType] || goldType;
    },

    loadCategories() {
      this.axiosCall("/categories", "GET").then((res) => {
        if (res && res.data) {
          this.categoryList = res.data;
        }
      });
    },

    loadBranches() {
      this.axiosCall("/branches", "GET").then((res) => {
        if (res && res.data) {
          this.branchList = res.data;
        }
      });
    },

    initialize() {
      this.loading = true;
      this.currentPage = 1;
      let url = "/jewelry-items";
      const params = [];
      if (this.filterCategory) params.push(`categoryId=${this.filterCategory}`);
      // Branch-assigned users always see only their branch; owners use the dropdown filter
      const effectiveBranch = this.userBranchId || this.filterBranch;
      if (effectiveBranch) params.push(`branchId=${effectiveBranch}`);
      if (this.filterStatus) params.push(`status=${this.filterStatus}`);
      if (params.length) url += "?" + params.join("&");

      this.axiosCall(url, "GET")
        .then((res) => {
          if (res && res.data) {
            this.data = res.data;
          }
        })
        .catch((error) => {
          console.error("Failed to load items:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to load items";
        })
        .finally(() => {
          this.loading = false;
        });
    },

    addNew() {
      this.updateData = { id: null };
      this.action = "Add";
    },

    viewItem(item) {
      this.viewData = { ...item };
      this.dialogView = true;
    },

    openImagePreview(img) {
      this.previewImages = this.viewData.images || [];
      this.previewIndex = this.previewImages.findIndex((i) => i.id === img.id) || 0;
      this.dialogImagePreview = true;
    },

    prevImage() {
      this.previewIndex = (this.previewIndex - 1 + this.previewImages.length) % this.previewImages.length;
    },

    nextImage() {
      this.previewIndex = (this.previewIndex + 1) % this.previewImages.length;
    },

    editItem(item) {
      this.updateData = { ...item };
      this.action = "Update";
    },

    deleteItem(item) {
      this.dialogConfirmDelete = true;
      this.deleteData = item;
    },

    confirmDelete() {
      this.deleting = true;
      this.axiosCall("/jewelry-items/" + this.deleteData.id, "DELETE")
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204)) {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "success";
            this.fadeAwayMessage.header = "Success";
            this.fadeAwayMessage.message = "Item deleted successfully";
            this.dialogConfirmDelete = false;
            this.deleteData = null;
            this.initialize();
          } else {
            this.fadeAwayMessage.show = true;
            this.fadeAwayMessage.type = "error";
            this.fadeAwayMessage.header = "Error";
            this.fadeAwayMessage.message = "Failed to delete item";
          }
        })
        .catch((error) => {
          console.error("Delete error:", error);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message =
            error?.response?.data?.message || "Failed to delete item";
        })
        .finally(() => {
          this.deleting = false;
        });
    },

    // === Import Excel Methods ===
    parseExcel(file) {
      if (!file) {
        this.importPreviewData = [];
        return;
      }
      this.importParsing = true;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array", cellStyles: true });
          const allItems = [];

          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            const parsed = this.parseSheet(sheetName, rows, ws);
            allItems.push(...parsed);
          }

          this.importPreviewData = allItems;
        } catch (err) {
          console.error("Excel parse error:", err);
          this.fadeAwayMessage.show = true;
          this.fadeAwayMessage.type = "error";
          this.fadeAwayMessage.header = "Error";
          this.fadeAwayMessage.message = "Failed to parse Excel file";
        } finally {
          this.importParsing = false;
        }
      };
      reader.readAsArrayBuffer(file);
    },

    getCellColor(ws, row, col) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[addr];
      if (cell && cell.s && cell.s.patternType === "solid" && cell.s.fgColor && cell.s.fgColor.rgb) {
        return cell.s.fgColor.rgb;
      }
      return null;
    },

    colorToBranch(rgb) {
      if (!rgb) return null;
      const map = {
        "FF40FF": "DAVAO",
        "FFC000": "BGC",
        "FF0000": null,   // SOLD — not a branch, handled by status
        "FFFF00": null,   // Header
        "A574FF": "OTHER",
        "92D050": null,   // Green — special
      };
      return map[rgb] !== undefined ? map[rgb] : null;
    },

    parseSheet(sheetName, rows, ws) {
      const items = [];
      const sn = sheetName.toUpperCase().trim();

      // Determine jewelry type and stone type from sheet name
      let jewelryType = "";
      let stoneType = "";

      if (sn.includes("RING") || sn.includes("BAND")) jewelryType = "Ring";
      else if (sn.includes("EARRING")) jewelryType = "Earring";
      else if (sn.includes("NECKLACE") || sn.includes("PENDANT")) jewelryType = "Necklace";
      else if (sn.includes("BRACELET") || sn.includes("BANGLE")) jewelryType = "Bracelet";
      else if (sn.includes("SET")) jewelryType = "Set";

      if (sn.includes("LAB")) stoneType = "Lab-Grown Diamond";
      else if (sn.includes("NATURAL") || sn.includes("NAT.") || sn.includes("NAT ")) stoneType = "Natural Diamond";
      else if (sn.includes("MOISSANITE")) stoneType = "Moissanite";
      else if (sn.includes("GOLD")) stoneType = "";
      else if (sn.includes("PEARL")) stoneType = "Pearl";
      else if (sn.includes("PIYAO")) stoneType = "";
      else if (sn.includes("EVIL EYE")) stoneType = "";

      // Find header row
      let headerRowIdx = -1;
      let colMap = {};
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i].map((c) => String(c).toUpperCase().trim());
        const hasCode = row.some((c) => c === "CODE" || c === "CODE ");
        const hasModel = row.some((c) => c === "MODEL" || c === "MODEL ");
        if (hasCode || hasModel) {
          headerRowIdx = i;
          row.forEach((cell, idx) => {
            const c = cell.replace(/\s+/g, " ").trim();
            if (c === "CODE" || c === "CODE ") colMap.code = idx;
            if (c === "MODEL" || c === "MODEL ") colMap.model = idx;
            if (c === "CARAT") colMap.carat = idx;
            if (c === "GOLD" || c === "COLOR" || c === "GRAMS/COLOR") colMap.gold = idx;
            if (c === "PRICE" || c === "AMOUNT") colMap.price = idx;
            if (c === "REMARKS" || c === "REMARKS ") colMap.remarks = idx;
            if (c === "SIZE") colMap.size = idx;
            if (c === "GRAMS" || c === "GRAMS/COLOR") colMap.grams = idx;
          });
          break;
        }
      }

      // Special handling for sheets without standard headers
      if (headerRowIdx === -1) {
        // PIYAO 14k: just code + remarks
        if (sn.includes("PIYAO 14K")) {
          for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            const code = String(row[0] || "").trim();
            if (!code) continue;
            const remarks = String(row[1] || "").toUpperCase().trim();
            const cellColor = this.getCellColor(ws, i, 0);
            const branch = this.colorToBranch(cellColor);
            items.push({
              itemCode: code,
              barcode: this.generateBarcode(code),
              description: "Piyao 14K",
              carat: null,
              goldType: null,
              size: null,
              price: null,
              status: remarks.includes("SOLD") ? "SOLD" : "IN_STOCK",
              _sheet: sheetName,
              _stoneType: stoneType,
              _jewelryType: jewelryType || "Bracelet",
              _branch: branch,
            });
          }
          return items;
        }
        // EVIL EYE STRING: code + price + status packed tightly
        if (sn.includes("EVIL EYE")) {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const code = String(row[0] || "").trim();
            if (!code) continue;
            const price = typeof row[2] === "number" ? row[2] : null;
            const remarks = String(row[3] || "").toUpperCase().trim();
            const cellColor = this.getCellColor(ws, i, 0);
            const branch = this.colorToBranch(cellColor);
            items.push({
              itemCode: code,
              barcode: this.generateBarcode(code),
              description: "Evil Eye String",
              carat: null,
              goldType: null,
              size: null,
              price: price,
              status: remarks.includes("SOLD") ? "SOLD" : "IN_STOCK",
              _sheet: sheetName,
              _stoneType: "",
              _jewelryType: "Bracelet",
              _branch: branch,
            });
          }
          return items;
        }
        return items;
      }

      // Parse data rows
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];

        // Find code - may be in different columns depending on sheet
        let code = "";
        if (colMap.code !== undefined) {
          code = String(row[colMap.code] || "").trim();
        }
        // Some sheets have code in column 0 or 1
        if (!code) {
          for (let c = 0; c <= 1; c++) {
            const val = String(row[c] || "").trim();
            if (val && val.length >= 2 && val.length <= 20 && !/^(S|#)$/.test(val)) {
              code = val;
              break;
            }
          }
        }

        if (!code) continue;

        const model = colMap.model !== undefined ? String(row[colMap.model] || "").trim() : "";
        const carat = colMap.carat !== undefined ? String(row[colMap.carat] || "").trim() || null : null;
        const remarks = colMap.remarks !== undefined ? String(row[colMap.remarks] || "").toUpperCase().trim() : "";

        // Gold type
        let goldVal = colMap.gold !== undefined ? String(row[colMap.gold] || "").toUpperCase().trim() : "";
        let goldType = null;
        if (goldVal === "YG" || goldVal.includes("YELLOW")) goldType = "YG";
        else if (goldVal === "WG" || goldVal.includes("WHITE")) goldType = "WG";
        else if (goldVal === "RG" || goldVal.includes("ROSE")) goldType = "RG";
        else if (goldVal.includes("TWO") || goldVal.includes("2")) goldType = "TWO_TONED";

        // Price
        let price = null;
        if (colMap.price !== undefined) {
          const pVal = row[colMap.price];
          if (typeof pVal === "number" && pVal > 0) price = pVal;
          else {
            const parsed = parseFloat(String(pVal).replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed) && parsed > 0) price = parsed;
          }
        }

        // Size
        let size = colMap.size !== undefined ? String(row[colMap.size] || "").trim() || null : null;

        // Status from remarks
        let status = "IN_STOCK";
        if (remarks.includes("SOLD")) status = "SOLD";
        else if (remarks.includes("PULL OUT")) status = "PULLED_OUT";
        else if (remarks.includes("RESERVED")) status = "RESERVED";
        else if (remarks.includes("CONSIGNMENT")) status = "CONSIGNMENT";
        else if (remarks.includes("LAYAWAY")) status = "LAYAWAY";

        // Detect branch from cell color (check code column and col 0/1)
        let cellColor = this.getCellColor(ws, i, colMap.code !== undefined ? colMap.code : 0);
        if (!cellColor) cellColor = this.getCellColor(ws, i, 1);
        if (!cellColor) cellColor = this.getCellColor(ws, i, 0);
        const branch = this.colorToBranch(cellColor);

        items.push({
          itemCode: code,
          barcode: this.generateBarcode(code),
          description: model,
          carat: carat,
          goldType: goldType,
          size: size,
          price: price,
          status: status,
          _sheet: sheetName,
          _stoneType: stoneType,
          _jewelryType: jewelryType,
          _branch: branch,
        });
      }

      return items;
    },

    generateBarcode(itemCode) {
      const code = itemCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const ts = Date.now().toString(36).toUpperCase().slice(-5);
      const rand = Math.floor(Math.random() * 9000 + 1000);
      return `TG-${code}-${ts}${rand}`;
    },

    resetImport() {
      this.importPreviewData = [];
      this.importFile = null;
    },

    closeImport() {
      this.dialogImport = false;
      this.resetImport();
      this.importBranchId = null;
    },

    async submitImport() {
      if (!this.importBranchId) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.header = "Error";
        this.fadeAwayMessage.message = "Please select a default branch before importing";
        return;
      }

      this.importLoading = true;

      // Build a branch name → branchId lookup
      const branchLookup = {};
      this.branchList.forEach((b) => {
        branchLookup[b.branchName.toUpperCase()] = b.branchId;
      });

      // Build payloads
      const payload = this.importPreviewData.map((item) => {
        // Resolve branch: color-detected branch name → branchId, fallback to default
        let branchId = this.importBranchId;
        if (item._branch) {
          const found = branchLookup[item._branch.toUpperCase()];
          if (found) branchId = found;
        }
        return {
          itemCode: item.itemCode,
          barcode: item.barcode,
          branchId: branchId,
          description: item.description || null,
          carat: item.carat || null,
          goldType: item.goldType || null,
          size: item.size || null,
          price: item.price || null,
          status: item.status || "IN_STOCK",
        };
      });

      try {
        const res = await this.axiosCall("/jewelry-items/bulk-import", "POST", payload);
        if (res && res.data) {
          this.importResult = res.data;
          this.dialogImportResult = true;
          this.closeImport();
          this.initialize();
        }
      } catch (error) {
        this.fadeAwayMessage.show = true;
        this.fadeAwayMessage.type = "error";
        this.fadeAwayMessage.header = "Error";
        this.fadeAwayMessage.message = error?.response?.data?.message || "Import failed";
      } finally {
        this.importLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.theia-view { font-family: 'Outfit', sans-serif; color: #3A2515; position: relative; z-index: 1; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #3A2515; }
.page-sub { font-size: 12px; color: #9A7858; margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 9px; padding: 8px 13px; box-shadow: 0 1px 6px rgba(80,30,10,0.08); min-width: 210px; }
.search-input-proto { border: none; background: none; outline: none; font-size: 13px; font-family: 'Outfit'; color: #3A2515; width: 100%; }
.search-input-proto::placeholder { color: #9A7858; }
.btn-add { display: flex; align-items: center; gap: 7px; background: #9B6B3A; color: #FDFAF6; border: none; padding: 9px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(155,107,58,0.3); transition: background 0.13s; }
.btn-add:hover { background: #C49455; }
.btn-import { display: flex; align-items: center; gap: 7px; background: #FDFAF6; color: #9B6B3A; border: 1px solid rgba(155,107,58,0.3); padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 600; font-family: 'Outfit'; cursor: pointer; transition: all 0.13s; }
.btn-import:hover { background: #EDE0CC; border-color: #9B6B3A; }
.cust-table-card { background: #FDFAF6; border: 1px solid rgba(155,107,58,0.16); border-radius: 16px; box-shadow: 0 2px 14px rgba(80,30,10,0.08); overflow: hidden; }
.filter-row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid rgba(155,107,58,0.16); background: #F5EFE4; flex-wrap: wrap; }
.filter-spacer { flex: 1; }
.per-pg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #9A7858; }
.per-pg select { border: 1px solid rgba(155,107,58,0.16); border-radius: 7px; background: #FDFAF6; color: #3A2515; font-family: 'Outfit'; font-size: 12px; padding: 4px 8px; outline: none; cursor: pointer; }

/* ─── Table ─── */
.tbl-wrap { overflow-x: auto; }
.cust-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1100px; }
.cust-table thead th {
  text-align: left; padding: 10px 16px; font-size: 10px; letter-spacing: 0.13em;
  text-transform: uppercase; color: #9A7858; font-weight: 600; background: #F5EFE4;
  white-space: nowrap; cursor: pointer; user-select: none;
}
.cust-table thead th:hover { color: #9B6B3A; }
.cust-table tbody tr { border-top: 1px solid rgba(155,107,58,0.16); transition: background 0.1s; }
.cust-table tbody tr:hover { background: #EDE0CC; }
.cust-table tbody td { padding: 11px 16px; color: #3A2515; white-space: nowrap; vertical-align: middle; }

td.mono { font-family: monospace; font-size: 12px; color: #9B6B3A; font-weight: 600; }
td.dim { color: #9A7858; font-size: 12px; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.amt-col { font-weight: 600; color: #9B6B3A; }

/* ─── Badges ─── */
.cat-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 500; background: rgba(155,107,58,0.08); color: #9A7858;
}
.branch-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 500; border: 1px solid rgba(155,107,58,0.3); color: #9B6B3A;
}
.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 500; text-transform: capitalize;
}
.st-IN_STOCK { background: rgba(61,122,90,0.1); color: #3D7A5A; }
.st-SOLD { background: rgba(91,124,156,0.12); color: #5B7C9C; }
.st-TRANSFERRED { background: rgba(204,122,53,0.12); color: #C4720E; }
.st-CONSIGNMENT { background: rgba(140,110,180,0.14); color: #7A569B; }
.st-LAYAWAY { background: rgba(70,150,160,0.12); color: #2E8E9C; }
.st-PULLED_OUT { background: rgba(120,120,140,0.12); color: #5A5A72; }
.st-RESERVED { background: rgba(196,148,85,0.15); color: #9B6B3A; }

/* ─── Action Buttons ─── */
.act-btns { display: flex; align-items: center; gap: 4px; }
.act-btn {
  width: 27px; height: 27px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16);
  background: #F5EFE4; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.12s; color: #9A7858;
}
.act-btn:hover { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.act-btn.del:hover { border-color: rgba(184,64,64,0.4); color: #B84040; background: rgba(184,64,64,0.06); }

/* ─── Pagination ─── */
.cust-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 18px; border-top: 1px solid rgba(155,107,58,0.16); background: #F5EFE4;
}
.pg-info { font-size: 12px; color: #9A7858; }
.pg-btns { display: flex; align-items: center; gap: 3px; }
.pg-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(155,107,58,0.16);
  background: #FDFAF6; color: #9A7858; font-size: 13px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: all 0.12s; font-family: 'Outfit', sans-serif;
}
.pg-btn:hover:not([disabled]) { border-color: #C49455; color: #9B6B3A; background: #EDE0CC; }
.pg-btn[disabled] { opacity: 0.3; cursor: default; }
.pg-btn.cur { background: #9B6B3A; color: #FDFAF6; border-color: #9B6B3A; font-weight: 600; }

/* ─── Empty State ─── */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 20px; gap: 10px; color: #9A7858; }
.empty-icon { width: 48px; height: 48px; border-radius: 13px; background: #EDE0CC; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 14px; font-weight: 500; color: #6B4A30; }

/* ─── Dialog Buttons ─── */
.btn-cancel-proto {
  background: none; border: 1px solid rgba(155,107,58,0.16); padding: 8px 16px; border-radius: 8px;
  font-size: 13px; font-family: 'Outfit', sans-serif; color: #9A7858; cursor: pointer; transition: all 0.12s; margin-right: 8px;
}
.btn-cancel-proto:hover { border-color: rgba(155,107,58,0.35); color: #6B4A30; }
.btn-danger-proto {
  background: #B84040; color: #FDFAF6; border: none; padding: 8px 20px; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background 0.12s;
}
.btn-danger-proto:hover { background: #c95252; }

.view-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.view-value {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 12px;
}
.view-image-thumb {
  border: 2px solid #e0e0e0;
  transition: transform 0.2s;
}
.view-image-thumb:hover {
  transform: scale(1.05);
}
.ga-3 {
  gap: 12px;
}
.image-preview-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(0,0,0,0.5) !important;
}
.image-counter {
  position: absolute;
  top: 12px;
  left: 16px;
  z-index: 10;
  color: white;
  font-size: 0.85rem;
  background: rgba(0,0,0,0.5);
  padding: 2px 10px;
  border-radius: 12px;
}
.slider-nav-btn {
  position: absolute;
  z-index: 5;
  background: rgba(0,0,0,0.4) !important;
}
.slider-nav-btn:hover {
  background: rgba(0,0,0,0.7) !important;
}
.slider-prev {
  left: 12px;
}
.slider-next {
  right: 12px;
}
.slider-thumbnail {
  border: 2px solid transparent;
  opacity: 0.6;
  transition: all 0.2s;
}
.slider-thumbnail:hover {
  opacity: 1;
}
.slider-thumbnail-active {
  border-color: #8e6e25;
  opacity: 1;
}
.ga-2 {
  gap: 8px;
}
</style>
