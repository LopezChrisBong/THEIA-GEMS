<template>
  <v-container fluid class="theia-view">
    <div class="page-header">
      <div><div class="page-heading">Jewelry Types</div><div class="page-sub">Manage jewelry type classifications</div></div>
      <div class="header-actions">
        <div class="search-wrap"><v-icon size="14" color="#9A7858">mdi-magnify</v-icon><input v-model="search" type="text" placeholder="Search jewelry types..." class="search-input-proto" /></div>
        <button class="btn-add" @click="addNew()"><v-icon size="13" color="white">mdi-plus</v-icon> Add Jewelry Type</button>
      </div>
    </div>
    <div class="cust-table-card"><div class="tbl-wrap">
      <table class="cust-table" v-if="!loading"><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="item in filteredData" :key="item.id">
            <td class="mono">{{ item.id }}</td><td><span class="cust-name">{{ item.name }}</span></td>
            <td><span v-if="item.description" class="dim txt-truncate">{{ item.description }}</span><span v-else class="dim">—</span></td>
            <td><div class="act-btns"><button class="act-btn" @click="editItem(item)"><v-icon size="14">mdi-pencil-outline</v-icon></button><button class="act-btn del" @click="deleteItem(item)"><v-icon size="14">mdi-delete-outline</v-icon></button></div></td>
          </tr>
          <tr v-if="filteredData.length===0"><td colspan="4"><div class="empty-state"><div class="empty-icon"><v-icon size="20" color="#9B6B3A">mdi-ring</v-icon></div><div class="empty-title">No jewelry types found</div></div></td></tr>
        </tbody></table>
      <div v-if="loading" class="empty-state"><v-progress-circular indeterminate color="#9B6B3A" size="32" /><div class="empty-title">Loading...</div></div>
    </div></div>
    <JewelryTypesDialog :data="updateData" :action="action" />
    <v-dialog v-model="dialogConfirmDelete" max-width="500"><v-card style="border-radius:16px;border:1px solid rgba(155,107,58,0.16)"><v-card-title class="text-h6" style="font-family:'Cormorant Garamond',serif">Confirm Deletion</v-card-title><v-card-text style="color:#6B4A30">Delete "{{ deleteData?.name }}"?</v-card-text><v-card-actions><v-spacer /><button class="btn-cancel-proto" @click="dialogConfirmDelete=false">Cancel</button><button class="btn-danger-proto" @click="confirmDelete" :disabled="deleting">{{ deleting?'Deleting...':'Delete' }}</button></v-card-actions></v-card></v-dialog>
    <fade-away-message-component displayType="variation2" v-model="fadeAwayMessage.show" :message="fadeAwayMessage.message" :header="fadeAwayMessage.header" :top="fadeAwayMessage.top" :type="fadeAwayMessage.type" />
  </v-container>
</template>
<script>
import JewelryTypesDialog from "../../components/Dialogs/Forms/JewelryTypesDialog.vue";
import eventBus from "@/eventBus";
export default {
  components:{JewelryTypesDialog},
  data:()=>({search:"",data:[],deleteData:null,updateData:null,loading:false,deleting:false,options:{},action:null,dialogConfirmDelete:false,fadeAwayMessage:{show:false,type:"success",header:"Success",message:"",top:10}}),
  computed:{filteredData(){if(!this.search)return this.data;const q=this.search.toLowerCase();return this.data.filter(i=>[i.name,i.description].filter(Boolean).some(f=>String(f).toLowerCase().includes(q)))}},
  watch:{options:{handler(){this.initialize()},deep:true}},
  mounted(){this.initialize();eventBus.on("closeJewelryTypesDialog",()=>this.initialize())},
  beforeUnmount(){eventBus.off("closeJewelryTypesDialog")},
  methods:{
    initialize(){this.loading=true;this.axiosCall("/jewelry-types","GET").then(r=>{if(r&&r.data)this.data=r.data}).catch(()=>{this.fadeAwayMessage={show:true,type:"error",header:"Error",message:"Failed to load",top:10}}).finally(()=>{this.loading=false})},
    addNew(){this.updateData={id:null};this.action="Add"},editItem(i){this.updateData={...i};this.action="Update"},deleteItem(i){this.dialogConfirmDelete=true;this.deleteData=i},
    confirmDelete(){this.deleting=true;this.axiosCall("/jewelry-types/"+this.deleteData.id,"DELETE").then(r=>{if(r&&(r.status===200||r.status===204)){this.fadeAwayMessage={show:true,type:"success",header:"Success",message:"Deleted",top:10};this.dialogConfirmDelete=false;this.deleteData=null;this.initialize()}}).catch(e=>{this.fadeAwayMessage={show:true,type:"error",header:"Error",message:e?.response?.data?.message||"Failed",top:10}}).finally(()=>{this.deleting=false})},
  },
};
</script>
<style scoped>
.theia-view{font-family:'Outfit',sans-serif;color:#3A2515;position:relative;z-index:1}.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}.page-heading{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:#3A2515}.page-sub{font-size:12px;color:#9A7858;margin-top:2px}.header-actions{display:flex;align-items:center;gap:10px}.search-wrap{display:flex;align-items:center;gap:8px;background:#FDFAF6;border:1px solid rgba(155,107,58,.16);border-radius:9px;padding:8px 13px;box-shadow:0 1px 6px rgba(80,30,10,.08);min-width:210px}.search-input-proto{border:none;background:none;outline:none;font-size:13px;font-family:'Outfit';color:#3A2515;width:100%}.search-input-proto::placeholder{color:#9A7858}.btn-add{display:flex;align-items:center;gap:7px;background:#9B6B3A;color:#FDFAF6;border:none;padding:9px 16px;border-radius:9px;font-size:12px;font-weight:600;font-family:'Outfit';cursor:pointer;letter-spacing:.04em;box-shadow:0 2px 8px rgba(155,107,58,.3);transition:background .13s}.btn-add:hover{background:#C49455}.cust-table-card{background:#FDFAF6;border:1px solid rgba(155,107,58,.16);border-radius:16px;box-shadow:0 2px 14px rgba(80,30,10,.08);overflow:hidden}.tbl-wrap{overflow-x:auto}.cust-table{width:100%;border-collapse:collapse;font-size:13px}.cust-table thead th{text-align:left;padding:10px 16px;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#9A7858;font-weight:600;background:#F5EFE4;white-space:nowrap}.cust-table tbody tr{border-top:1px solid rgba(155,107,58,.16);transition:background .1s}.cust-table tbody tr:hover{background:#EDE0CC}.cust-table tbody td{padding:11px 16px;color:#3A2515;white-space:nowrap;vertical-align:middle}td.mono{font-family:monospace;font-size:12px;color:#9B6B3A;font-weight:600}.dim{color:#9A7858;font-size:12px}.cust-name{font-weight:500}.txt-truncate{max-width:250px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.act-btns{display:flex;align-items:center;gap:4px}.act-btn{width:27px;height:27px;border-radius:7px;border:1px solid rgba(155,107,58,.16);background:#F5EFE4;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s;color:#9A7858}.act-btn:hover{border-color:#C49455;color:#9B6B3A;background:#EDE0CC}.act-btn.del:hover{border-color:rgba(184,64,64,.4);color:#B84040;background:rgba(184,64,64,.06)}.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 20px;gap:10px;color:#9A7858}.empty-icon{width:48px;height:48px;border-radius:13px;background:#EDE0CC;display:flex;align-items:center;justify-content:center}.empty-title{font-size:14px;font-weight:500;color:#6B4A30}.btn-cancel-proto{background:none;border:1px solid rgba(155,107,58,.16);padding:8px 16px;border-radius:8px;font-size:13px;font-family:'Outfit';color:#9A7858;cursor:pointer;margin-right:8px}.btn-danger-proto{background:#B84040;color:#FDFAF6;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:'Outfit';cursor:pointer}
</style>
