<template>
  <el-row :gutter="20">
    <!-- 左侧文档分类 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-full min-h-[800px]">
        <div class="p-4">
          <div class="font-bold mb-4 text-16px">文档分类</div>
          <el-menu
            :default-active="selectedCategory"
            class="border-0"
            @select="handleCategorySelect"
          >
            <el-menu-item v-for="category in categories" :key="category.id" :index="category.id">
              <span>{{ category.fileType }}</span>
            </el-menu-item>
          </el-menu>
        </div>
      </ContentWrap>
    </el-col>

    <el-col :span="20" :xs="24">
      <!-- 搜索栏 -->
      <ContentWrap>
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-row>
            <el-col :span="24">
              <el-form-item label="方案名称" prop="name">
                <el-input
                  v-model="queryParams.name"
                  placeholder="请输入"
                  clearable
                  class="!w-200px"
                />
              </el-form-item>
              <el-form-item label="上传时间" prop="uploadTime">
                <el-date-picker
                  v-model="queryParams.uploadTime"
                  type="daterange"
                  start-placeholder="请选择"
                  end-placeholder="请选择"
                  value-format="YYYY-MM-DD"
                  class="!w-240px"
                />
              </el-form-item>
              <el-form-item label="文档状态" prop="status">
                <el-select
                  v-model="queryParams.status"
                  placeholder="请选择"
                  clearable
                  class="!w-200px"
                >
                  <el-option label="编辑中" value="editing" />
                  <el-option label="待审核" value="reviewing" />
                  <el-option label="驳回" value="rejected" />
                  <el-option label="审核通过" value="approved" />
                  <el-option label="发布" value="published" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="演训主题" prop="drillTheme">
                <el-input
                  v-model="queryParams.drillTheme"
                  placeholder="请输入"
                  clearable
                  class="!w-200px"
                />
              </el-form-item>
              <el-form-item label="演训类型" prop="drillType">
                <el-select
                  v-model="queryParams.drillType"
                  placeholder="请选择"
                  clearable
                  class="!w-200px"
                >
                  <el-option label="类型A" value="A" />
                  <el-option label="类型B" value="B" />
                </el-select>
              </el-form-item>
              <el-form-item label="演训等级" prop="drillLevel">
                <el-select
                  v-model="queryParams.drillLevel"
                  placeholder="请选择"
                  clearable
                  class="!w-200px"
                >
                  <el-option label="战略级" value="strategy" />
                  <el-option label="战术级" value="tactics" />
                </el-select>
              </el-form-item>
              <el-form-item label="文档类型" prop="docType">
                <el-select
                  v-model="queryParams.docType"
                  placeholder="请选择"
                  clearable
                  class="!w-200px"
                >
                  <el-option label="类型1" value="1" />
                  <el-option label="类型2" value="2" />
                </el-select>
              </el-form-item>

              <el-form-item class="float-right">
                <el-button type="primary" @click="handleQuery">
                  <Icon icon="ep:search" class="mr-1" />
                  查询
                </el-button>
                <el-button @click="resetQuery">
                  <Icon icon="ep:refresh" class="mr-1" />
                  重置
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </ContentWrap>

      <ContentWrap>
        <!-- 工具栏 -->
        <div class="mb-4">
          <el-button type="primary" size="large" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-1" />
            新建
          </el-button>
          <el-button plain size="large" @click="handleGenerate">
            <Icon icon="ep:document-add" class="mr-1" />
            文档生成
          </el-button>
          <el-button
            type="danger"
            plain
            size="large"
            :disabled="!canBatchDelete"
            @click="handleBatchDelete"
          >
            <Icon icon="ep:delete" class="mr-1" />
            批量删除
          </el-button>
        </div>

        <!-- 标签页 -->
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="最近文档" name="recent" />
          <el-tab-pane label="审核列表" name="review" />
          <el-tab-pane label="文档发布" name="publish" />
        </el-tabs>

        <!-- 表格 -->
        <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange" stripe>
          <el-table-column type="selection" width="55" />
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="方案名称" prop="name" align="center" min-width="150" />
          <el-table-column label="所属学院" prop="college" align="center" width="120" />
          <el-table-column label="文档分类" prop="docCategory" align="center" width="120" />
          <el-table-column label="演训等级" prop="drillLevel" align="center" width="100" />
          <el-table-column
            label="作者"
            prop="author"
            align="center"
            width="150"
            show-overflow-tooltip
          />
          <el-table-column label="权限范围" prop="scope" align="center" width="100" />
          <el-table-column label="审核状态" prop="status" align="center" width="120">
            <template #default="scope">
              <div class="flex items-center justify-center">
                <div
                  :class="getStatusClass(scope.row.status)"
                  class="w-2 h-2 rounded-full mr-2"
                ></div>
                {{ scope.row.status }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" align="center" width="180" />
          <el-table-column label="操作" align="center" width="280" fixed="right">
            <template #default="scope">
              <!-- 编辑中状态显示：编辑、写作、审核、删除 -->
              <div v-if="scope.row.status === '编辑中'">
                <el-button link type="primary" @click="handleEditData(scope.row)">
                  <Icon icon="ep:edit-pen" />
                  编辑
                </el-button>
                <el-button link type="primary" @click="handleEdit(scope.row)">
                  <Icon icon="ep:edit" />
                  写作
                </el-button>
                <el-button link type="primary" @click="openAuditDialog(scope.row)">
                  <Icon icon="ep:upload" />
                  审核
                </el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">
                  <Icon icon="ep:delete" />
                  删除
                </el-button>
              </div>

              <!-- 待审核或驳回状态显示：审核 -->
              <div v-else-if="scope.row.status === '待审核' || scope.row.status === '驳回'">
                <el-button link type="primary" @click="openAuditDialog(scope.row)">
                  <Icon icon="ep:upload" />
                  审核
                </el-button>
                <el-button
                  v-if="scope.row.status === '驳回'"
                  link
                  type="danger"
                  @click="openRejectDialog(scope.row)"
                >
                  <Icon icon="ep:warning" />
                  驳回
                </el-button>
              </div>

              <!-- 审核通过状态显示：发布 -->
              <div v-else-if="scope.row.status === '审核通过'">
                <el-button link type="primary" @click="openPublishDialog(scope.row)">
                  <Icon icon="ep:promotion" />
                  发布
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 新建/编辑筹划方案弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="演训数据" prop="drillDataId">
        <div class="w-full" @click="openDrillSelector">
          <el-input
            v-model="formData.drillDataName"
            placeholder="请选择"
            readonly
            :suffix-icon="ArrowDown"
            class="cursor-pointer"
          />
        </div>
      </el-form-item>

      <el-form-item label="筹划方案名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入" clearable />
      </el-form-item>

      <el-form-item label="文档分类" prop="docCategory">
        <el-select v-model="formData.docCategory" placeholder="请选择" clearable class="w-full">
          <el-option
            v-for="item in docCategoryOptions"
            :key="item.id"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="简介">
        <el-input v-model="formData.brief" type="textarea" :rows="3" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="可编辑用户" prop="editableUser">
        <el-select
          v-model="formData.editableUser"
          multiple
          placeholder="请选择"
          clearable
          class="w-full"
        >
          <el-option
            v-for="item in editableUserOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 创建方式（仅新建时显示） -->
      <el-form-item v-if="!isEditMode" label="创建方式" prop="creationMethod">
        <el-radio-group v-model="formData.creationMethod">
          <el-radio label="new">新建文档</el-radio>
          <el-radio label="upload">上传文档</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 创建方式：上传文档 (显示上传组件，仅新建时显示) -->
      <div v-if="!isEditMode && formData.creationMethod === 'upload'" class="pl-[120px] mt-4">
        <div class="flex items-start">
          <span class="text-red-500 mr-1">*</span>
          <el-upload
            class="upload-demo w-full"
            drag
            action="#"
            :auto-upload="false"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".doc,.docx"
          >
            <Icon icon="ep:upload-filled" class="el-icon--upload text-50px text-gray-400" />
            <div class="el-upload__text"> 将文件拖到此处，或 <em>点击上传</em> </div>
            <template #tip>
              <div class="el-upload__tip text-red-500"> * 支持 doc, docx 格式文件（必选） </div>
            </template>
          </el-upload>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">确定</el-button>
    </template>
  </el-dialog>

  <!-- 演训数据选择弹窗 -->
  <el-dialog v-model="drillSelectorVisible" title="请选择" width="900px" append-to-body>
    <!-- 筛选栏 -->
    <div class="mb-4 flex gap-4">
      <el-select v-model="drillFilter.unit" clearable placeholder="全部演训单位" class="w-40">
        <el-option label="第一军团" value="第一军团" />
        <el-option label="装甲旅" value="装甲旅" />
      </el-select>
      <el-select v-model="drillFilter.level" clearable placeholder="全部演训等级" class="w-40">
        <el-option label="战略级" value="战略级" />
        <el-option label="战术级" value="战术级" />
      </el-select>
      <el-input v-model="drillFilter.name" clearable placeholder="请输入演训名称" class="w-60">
        <template #append>
          <el-button :icon="Search" />
        </template>
      </el-input>
    </div>

    <!-- 列表 -->
    <el-table
      :data="filteredDrillData"
      border
      stripe
      highlight-current-row
      @current-change="handleDrillSelect"
      class="w-full"
    >
      <el-table-column label="演训名称" prop="name" min-width="150" align="center" />
      <el-table-column label="演训单位" prop="unit" width="120" align="center" />
      <el-table-column label="组织单位" prop="org" width="120" align="center" />
      <el-table-column label="演训等级" prop="level" width="100" align="center" />
      <el-table-column label="开始时间" prop="startTime" width="120" align="center" />
      <el-table-column label="结束时间" prop="endTime" width="120" align="center" />
    </el-table>

    <div class="mt-4 flex justify-end">
      <Pagination
        v-model:page="drillPage.pageNo"
        v-model:limit="drillPage.pageSize"
        :total="filteredDrillData.length"
      />
    </div>
  </el-dialog>

  <!-- 审核流配置弹窗 -->
  <el-dialog
    v-model="auditDialogVisible"
    title="审核流配置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form ref="auditFormRef" :model="auditFormData" label-width="100px">
      <el-form-item label="流程名称">
        <el-select v-model="auditFormData.flowName" placeholder="请选择" class="w-full">
          <el-option label="演训筹划文档审批流" value="flow1" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核人">
        <div class="border p-4 rounded w-full bg-gray-50">
          <el-row :gutter="10" class="mb-2">
            <el-col :span="4" class="text-right leading-8">节点1</el-col>
            <el-col :span="20">
              <el-select
                v-model="auditFormData.auditors.node1"
                multiple
                placeholder="请选择"
                class="w-full"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.value"
                  :label="u.label"
                  :value="u.value"
                />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="10" class="mb-2">
            <el-col :span="4" class="text-right leading-8">节点2</el-col>
            <el-col :span="20">
              <el-select
                v-model="auditFormData.auditors.node2"
                multiple
                placeholder="请选择"
                class="w-full"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.value"
                  :label="u.label"
                  :value="u.value"
                />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="10" class="mb-2">
            <el-col :span="4" class="text-right leading-8">节点3</el-col>
            <el-col :span="20">
              <el-select
                v-model="auditFormData.auditors.node3"
                multiple
                placeholder="请选择"
                class="w-full"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.value"
                  :label="u.label"
                  :value="u.value"
                />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="4" class="text-right leading-8">节点4</el-col>
            <el-col :span="20">
              <el-select
                v-model="auditFormData.auditors.node4"
                multiple
                placeholder="请选择"
                class="w-full"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.value"
                  :label="u.label"
                  :value="u.value"
                />
              </el-select>
            </el-col>
          </el-row>
        </div>
      </el-form-item>
      <el-form-item label="审核说明">
        <el-input v-model="auditFormData.comment" type="textarea" :rows="4" placeholder="请输入" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading"
        >确认提交</el-button
      >
      <el-button @click="auditDialogVisible = false">取消</el-button>
    </template>
  </el-dialog>

  <!-- 发布配置弹窗 -->
  <el-dialog
    v-model="publishDialogVisible"
    title="发布配置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form ref="publishFormRef" :model="publishFormData" label-width="100px">
      <el-form-item label="可见范围">
        <el-select
          v-model="publishFormData.visibleScope"
          multiple
          placeholder="请选择"
          class="w-full"
        >
          <el-option v-for="u in userOptions" :key="u.value" :label="u.label" :value="u.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handlePublishSubmit" :loading="publishLoading"
        >确认提交</el-button
      >
      <el-button @click="publishDialogVisible = false">取消</el-button>
    </template>
  </el-dialog>

  <!-- 驳回原因弹窗 -->
  <el-dialog
    v-model="rejectDialogVisible"
    title="驳回原因"
    width="800px"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="reject-container p-4">
      <!-- 驳回原因表格 -->
      <div class="font-bold mb-3 text-14px text-gray-700">驳回原因</div>
      <el-table :data="rejectHistoryList" border stripe style="width: 100%" max-height="300px">
        <el-table-column prop="rejectBy" label="驳回人" width="150" align="center" />
        <el-table-column prop="rejectTime" label="驳回时间" width="180" align="center" />
        <el-table-column prop="reason" label="驳回原因" align="left" show-overflow-tooltip />
      </el-table>

      <!-- 驳回操作区 -->
      <div class="reject-action mt-6">
        <div class="font-bold mb-3 text-14px text-gray-700">驳回</div>
        <div class="reject-form border p-6 rounded bg-gray-50">
          <el-form label-position="left" label-width="80px">
            <el-form-item label="驳回原因" required>
              <el-input
                v-model="rejectReason"
                type="textarea"
                :rows="6"
                placeholder="请输入驳回原因"
                resize="none"
              />
            </el-form-item>
          </el-form>
          <div class="flex justify-end mt-4 gap-3">
            <el-button
              type="primary"
              @click="handleRejectSubmit"
              :loading="rejectLoading"
              class="!w-20"
              >确定</el-button
            >
            <el-button @click="rejectDialogVisible = false" class="!w-20">取消</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as PerformanceApi from '@/api/training/performance'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { useCollaborationUserStore } from '@/store/modules/collaborationUser'
import {
  isEmpty,
  isArray,
  isNil,
  isString,
  isObject,
  pickBy,
  find,
  every,
  filter,
  map,
  trim,
  includes
} from 'lodash-es'

defineOptions({ name: 'TrainingPerformance' })

const router = useRouter()
const collaborationUserStore = useCollaborationUserStore()
const loading = ref(false)
const total = ref(0)
const list = ref<PerformanceApi.TrainingPerformanceVO[]>([])
const activeTab = ref('recent')
const selectedCategory = ref('0') // '0' 对应 "全部"
const categories = ref<PerformanceApi.DocCategoryVO[]>([])
const selectedRows = ref<PerformanceApi.TrainingPerformanceVO[]>([])

// 计算属性：判断是否可以批量删除（只有选中的数据都是"编辑中"状态才能删除）
const canBatchDelete = computed(() => {
  if (isEmpty(selectedRows.value)) return false
  return every(selectedRows.value, (row) => row.status === '编辑中')
})

const queryParams = reactive<PerformanceApi.TrainingPerformancePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  uploadTime: [],
  status: undefined,
  docCategory: undefined,
  fileType: undefined, // 左侧文档分类
  drillTheme: undefined,
  drillType: undefined,
  drillLevel: undefined,
  docType: undefined
})

const queryFormRef = ref()

// 获取数据列表 - 调用 Java 后端 /api/users/getPageList
const getList = async () => {
  loading.value = true
  try {
    // 使用 lodash pickBy 过滤空值
    const params = pickBy(queryParams, (value) => {
      if (isArray(value)) return !isEmpty(value)
      return !isNil(value) && value !== ''
    }) as Record<string, any>

    // 将 uploadTime 数组转换为字符串格式 '2025-12-10, 2025-12-11'
    if (isArray(params.uploadTime) && params.uploadTime.length === 2) {
      params.uploadTime = params.uploadTime.join(', ')
    }

    // 添加标签页类型参数
    params.tabType =
      activeTab.value === 'review' ? 'review' : activeTab.value === 'publish' ? 'publish' : 'recent'

    console.log('查询参数:', params)
    const data = await PerformanceApi.getPageList(params as any)
    list.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请确保后端服务已启动')
  } finally {
    loading.value = false
  }
}

// 获取文档分类
const getCategories = async () => {
  try {
    const data = await PerformanceApi.getDocCategories()
    categories.value = data
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取文档分类失败，请确保后端服务已启动')
  }
}

// 查询按钮
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  selectedCategory.value = '0' // '0' 对应 "全部"
  queryParams.fileType = undefined // 重置分类过滤
  activeTab.value = 'recent' // 重置标签页
  handleQuery()
}

// 文档分类选择
const handleCategorySelect = (index: string) => {
  selectedCategory.value = index
  console.log('选择分类 id:', index)

  // 使用 lodash find 根据 id 找到对应的 category
  const category = find(categories.value, (cat) => cat.id === index)

  // 将选择的分类传递到查询参数
  if (index === '0') {
    // 选择全部时 (id='0')，清空分类过滤
    queryParams.fileType = undefined
  } else if (category) {
    // 传递 fileType（文字）而不是 id
    queryParams.fileType = category.fileType
    console.log('传递 fileType:', category.fileType)
  }

  // 触发查询
  handleQuery()
}

// 新建/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建筹划方案')
const isEditMode = ref(false) // 是否为编辑模式（编辑模式隐藏创建方式）
const currentEditId = ref<number | null>(null) // 当前编辑的数据ID
const formRef = ref()

// 表单数据
const formData = reactive({
  drillDataId: '', // 演训数据ID
  drillDataName: '', // 演训数据名称（回显用）
  name: '', // 筹划方案名称
  docCategory: '', // 文档分类
  brief: '', // 简介
  editableUser: [], // 可编辑用户
  creationMethod: 'new' // 创建方式: new, upload
})

// 上传文件列表
const uploadFileList = ref<any[]>([])
const uploadFile = ref<File | null>(null)

// 表单验证规则
const formRules = {
  drillDataId: [{ required: true, message: '请选择演训数据', trigger: 'change' }],
  name: [{ required: true, message: '请输入筹划方案名称', trigger: 'blur' }],
  docCategory: [{ required: true, message: '请选择文档分类', trigger: 'change' }],
  editableUser: [{ required: true, message: '请选择可编辑用户', trigger: 'change' }],
  creationMethod: [{ required: true, message: '请选择创建方式', trigger: 'change' }]
}

// 文档分类下拉选项（从中间件获取，过滤掉"全部"）
const docCategoryOptions = computed(() => {
  const filtered = filter(categories.value, (item) => item.id !== '0')
  return map(filtered, (item) => ({
    label: item.fileType,
    value: item.fileType, // value 使用 fileType（分类名称）
    id: item.id // 保留 id 用于传递 fileType 参数
  }))
})

    // 演训类型
const exerciseTypeOptions = [
  { label: '大学年度演训', value: 'DXNDYX' },
  { label: '联合类', value: 'LHL' },
  { label: '作战类', value: 'ZUOZL' },
  { label: '政治类', value: 'ZZL' },
  { label: '经济类', value: 'JJL' },
  { label: '认知类', value: 'RZL' },
  { label: '文化类', value: 'WHL' },
  { label: '后装类', value: 'HZL' },
  { label: '国际防务类', value: 'GJFWL' },
  { label: '网络类', value: 'WLL' },
  { label: '电磁类', value: 'DCL' },
  { label: '太空类', value: 'TKL' }

// 演训主题
const exerciseThemeOptions = [
  { label: '经济类', value: 'JJL' },
  { label: '认知类', value: 'RZL' },
  { label: '文化类', value: 'WHL' },
  { label: '后装类', value: 'HZL' },
  { label: '国际防务类', value: 'GJFWL' },
  { label: '网络类', value: 'WLL' },
  { label: '电磁类', value: 'DCL' },
  { label: '太空类', value: 'TKL' }
]

// 演训等级
const levelOptions = [
  { label: '战略级', value: 'ZLJ' },
  { label: '战役级', value: 'YXJ' },
  { label: '战术级', value: 'ZSJ' }
]

  // 所属学院
const collegeOptions = [
  { label: '国防大学', value: 'GFDX' },
  { label: '联合作战学院', value: 'LHZZXY' },
  { label: '国家安全学院', value: 'GJAQXY' },
  { label: '联合勤务学院', value: 'LHQWXY' },
  { label: '国际防务学院', value: 'GJFWXY' },
  { label: '军事管理学院', value: 'SGLXY' },
  { label: '政治学院', value: 'ZZXY' },
  { label: '军事文华学院', value: 'JSWHXY' },
  { label: '研究生院', value: 'YJSY' }

// 可编辑用户
const activeUserOptions = [
  { label: '管理员', value: 'admin' },
  { label: '参谋人员A', value: 'staff_a' },
  { label: '参谋人员B', value: 'staff_b' }
]

// 模拟用户列表（用于审核和发布配置）
const userOptions = [
  { label: 'user1', value: 'user1' },
  { label: 'user2', value: 'user2' },
  { label: 'user3', value: 'user3' },
  { label: 'user4', value: 'user4' },
  { label: 'user5', value: 'user5' }
]

// 演训数据选择器逻辑
const drillSelectorVisible = ref(false)
const drillFilter = reactive({
  unit: '',
  level: '',
  name: ''
})
const drillPage = reactive({ pageNo: 1, pageSize: 10 })

// 模拟演训数据
const drillDataList = [
  {
    id: '1',
    name: '2024联合演习',
    unit: '第一军团',
    org: '参谋部',
    level: '战略级',
    startTime: '2024-01-01',
    endTime: '2024-01-15'
  },
  {
    id: '2',
    name: '跨区机动演练',
    unit: '装甲旅',
    org: '训练处',
    level: '战术级',
    startTime: '2024-03-10',
    endTime: '2024-03-20'
  },
  {
    id: '3',
    name: '山地攻防演练',
    unit: '合成营',
    org: '作训科',
    level: '战术级',
    startTime: '2024-04-05',
    endTime: '2024-04-12'
  },
  {
    id: '4',
    name: '网络安全演习',
    unit: '信息中心',
    org: '网络部',
    level: '战略级',
    startTime: '2024-05-20',
    endTime: '2024-05-25'
  }
]

const filteredDrillData = computed(() => {
  return filter(drillDataList, (item) => {
    const matchUnit = isEmpty(drillFilter.unit) || item.unit === drillFilter.unit
    const matchLevel = isEmpty(drillFilter.level) || item.level === drillFilter.level
    const matchName = isEmpty(drillFilter.name) || includes(item.name, drillFilter.name)
    return matchUnit && matchLevel && matchName
  })
})

const openDrillSelector = () => {
  drillSelectorVisible.value = true
}

//
const handleDrillSelect = (row: any) => {
  if (!row) return
  formData.drillDataId = row.id
  formData.drillDataName = row.name
  drillSelectorVisible.value = false
  // 清除校验
  formRef.value?.validateField('drillDataId')
}

// 文件选择变化
const handleFileChange = (file: any) => {
  console.log('文件选择:', file)
  uploadFile.value = file.raw
}

// 文件移除
const handleFileRemove = () => {
  uploadFile.value = null
}

// 新建
const handleAdd = () => {
  dialogTitle.value = '新建筹划方案'
  isEditMode.value = false // 新建模式
  currentEditId.value = null
  dialogVisible.value = true
  // 重置表单
  Object.assign(formData, {
    drillDataId: '',
    drillDataName: '',
    name: '',
    docCategory: '',
    brief: '',
    editableUser: [],
    creationMethod: 'new'
  })
  // 重置上传文件
  uploadFileList.value = []
  uploadFile.value = null
  // 清除验证
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 编辑数据
const handleEditData = (row: PerformanceApi.TrainingPerformanceVO) => {
  dialogTitle.value = '编辑筹划方案'
  isEditMode.value = true // 编辑模式（隐藏创建方式）
  currentEditId.value = row.id || null
  dialogVisible.value = true

  // 填充表单数据
  Object.assign(formData, {
    drillDataId: row.drillDataId || '',
    drillDataName: row.drillDataName || row.name || '',
    name: row.name || '',
    docCategory: row.docCategory || '',
    brief: row.brief || '',
    editableUser: row.editableUser ? row.editableUser.split(',') : []
    // 编辑模式不设置 creationMethod
  })

  // 重置上传文件
  uploadFileList.value = []
  uploadFile.value = null

  // 清除验证
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()

    // 只有新建模式且选择上传文档时，才验证是否已选择文件
    if (!isEditMode.value && formData.creationMethod === 'upload' && !uploadFile.value) {
      ElMessage.warning('请选择要上传的文件')
      return
    }

    loading.value = true

    // 根据选择的 docCategory 找到对应的分类 id 作为 fileType
    const selectedCat = find(
      docCategoryOptions.value,
      (item) => item.value === formData.docCategory
    )
    const fileType = selectedCat?.id || ''

    // 编辑模式
    if (isEditMode.value) {
      // 构建编辑数据（不传递 creationMethod）
      const editData: any = {
        id: currentEditId.value,
        drillDataId: formData.drillDataId,
        drillDataName: formData.drillDataName,
        name: formData.name,
        docCategory: formData.docCategory,
        brief: formData.brief,
        editableUser: formData.editableUser.join(','),
        fileType: fileType
      }

      await PerformanceApi.updatePerformanceData(editData)
      ElMessage.success('更新成功')
      dialogVisible.value = false
      getList()
      return
    }

    // 新建模式
    // 构建保存数据
    const saveData: any = {
      drillDataId: formData.drillDataId,
      drillDataName: formData.drillDataName,
      name: formData.name,
      docCategory: formData.docCategory,
      brief: formData.brief,
      editableUser: formData.editableUser.join(','), // 数组转字符串
      creationMethod: formData.creationMethod,
      fileType: fileType, // 新建文档和上传文档都传递 fileType
      author: 'admin' // 当前用户
    }

    // 判断创建方式
    if (formData.creationMethod === 'upload') {
      // 上传文档模式
      // 先上传文档文件
      console.log('上传文档文件:', uploadFile.value!.name)
      const uploadResult = await PerformanceApi.uploadDocument({
        file: uploadFile.value!
      })
      console.log('上传结果:', uploadResult, typeof uploadResult)

      // 处理上传结果 - 兼容两种响应格式:
      // 1. 完整响应对象: {code: 200, data: "fileId", msg: "操作成功"}
      // 2. axios 解包后直接返回 data 值: "fileId" (字符串)
      let fileId: string | null = null

      if (isString(uploadResult)) {
        // axios 封装解包后直接返回了 data 值
        fileId = uploadResult
        console.log('上传成功(解包响应), 文件ID:', fileId)
      } else if (isObject(uploadResult)) {
        // 完整响应对象
        const result = uploadResult as { code?: number; data?: string; msg?: string }
        if (result.code === 200 || result.code === 0) {
          fileId = result.data || null
          console.log('上传成功(完整响应), 文件ID:', fileId)
        } else {
          ElMessage.error(result.msg || '上传文档失败')
          return
        }
      }

      if (isEmpty(fileId)) {
        ElMessage.error('上传文档失败：未获取到文件ID')
        return
      }

      // 将上传返回的 fileId 传递给 createNewData
      saveData.fileId = fileId

      // 创建筹划方案记录
      await PerformanceApi.createNewData(saveData)
      ElMessage.success('创建成功')
    } else {
      // 新建文档模式
      await PerformanceApi.createNewData(saveData)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    getList()
  } catch (error: any) {
    if (error !== false) {
      // 不是验证失败
      console.error('保存失败:', error)
      ElMessage.error(error.message || '保存失败')
    }
  } finally {
    loading.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 文档生成
const handleGenerate = () => {
  ElMessage.info('文档生成功能开发中')
}

// Tab 切换 list
const handleTabClick = (tab: any) => {
  console.log('切换Tab:', tab.props.name)
  activeTab.value = tab.props.name

  // 标签页切换：
  // 1、最近文档 - 查询全部数据（不传 tabType）
  // 2、审核列表 - 传递 tabType='review'
  // 3、文档发布 - 传递 tabType='publish'

  handleQuery()
}

// 选择变化
const handleSelectionChange = (val: PerformanceApi.TrainingPerformanceVO[]) => {
  selectedRows.value = val
  console.log('选择变化:', val)
}

// 写作
const handleEdit = async (row: any) => {
  console.log('写作:', row)

  // 创建 loading 实例
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在校验权限...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 1. 获取或创建协作用户
    const collaborationUser = collaborationUserStore.getOrCreateUser()
    const userId = collaborationUser.id
    console.log('协作用户:', collaborationUser.name, `(${userId})`)

    // 2. 调用权限校验接口
    console.log('调用权限校验接口, id:', row.id, 'userId:', userId)
    const checkData = { id: row.id, userId: userId as any } // 权限校验请求数据
    const permResult = await PerformanceApi.checkWritePermission(
      checkData as PerformanceApi.checkWriteData
    )
    console.log('权限校验结果:', permResult)

    // 3. 检查权限 - status=500 或 data=false 表示无权限
    if (permResult.status === 500 || permResult.data === false) {
      ElMessage.error('您没有该文档的写作权限')
      ElMessage.error(permResult.msg)
      return
    }

    // 4. 权限通过，获取文件流
    loadingInstance.setText('正在加载文档内容...')
    console.log('调用文件流接口, id:', row.id)
    const streamResult = await PerformanceApi.getFileStream(row.id)
    console.log('文件流结果:', streamResult, 'instanceof Blob:', streamResult instanceof Blob)

    // 5. 处理文件流数据
    let hasContent = false
    if (streamResult && streamResult.size > 0) {
      console.log('文件流有效, size:', streamResult.size, 'type:', streamResult.type)
      // 将 blob 转为 base64 存储到 sessionStorage
      const base64Content = await blobToBase64(streamResult)
      console.log(
        'base64 转换完成, 长度:',
        base64Content.length,
        '前100字符:',
        base64Content.substring(0, 100)
      )
      sessionStorage.setItem(`doc_content_${row.id}`, base64Content)
      hasContent = true
      console.log('文件流已存储到 sessionStorage, key:', `doc_content_${row.id}`)
    } else {
      console.warn('文件流为空或无效:', streamResult)
    }

    // 6. 准备文档信息并存储到 sessionStorage
    const documentInfo = {
      id: String(row.id),
      title: row.name,
      content: '',
      createTime: row.createTime || new Date().toISOString(),
      updateTime: row.createTime || new Date().toISOString(),
      version: 'V1.0',
      tags: row.docCategory ? [row.docCategory] : [],
      creatorId: 0,
      creatorName: row.author || '未知'
    }
    sessionStorage.setItem(`doc_info_${row.id}`, JSON.stringify(documentInfo))

    // 7. 跳转编辑器
    router.push({
      name: 'DocumentEdit',
      params: { id: row.id },
      query: {
        title: row.name, // 传递方案名称作为标题
        hasContent: hasContent ? 'true' : 'false'
      }
    })
  } catch (error) {
    console.error('写作权限校验失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    loadingInstance.close()
  }
}

/**
 * Blob 转 Base64 工具函数
 * @param blob Blob 对象
 * @returns Base64 字符串
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}

// 审核弹窗相关
const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const currentAuditRow = ref<PerformanceApi.TrainingPerformanceVO>()
const auditFormData = reactive({
  flowName: 'flow1', // 默认选一个
  auditors: {
    node1: '',
    node2: [] as string[],
    node3: 'user5', // 默认回显
    node4: 'user4' // 默认回显
  },
  comment: ''
})

// 打开审核弹窗
const openAuditDialog = (row: PerformanceApi.TrainingPerformanceVO) => {
  currentAuditRow.value = row
  auditDialogVisible.value = true
  // 重置/初始化表单
  auditFormData.flowName = 'flow1'
  auditFormData.auditors.node1 = ''
  auditFormData.auditors.node2 = ['user1', 'user2', 'user3'] // 示例默认值
  auditFormData.auditors.node3 = 'user5'
  auditFormData.auditors.node4 = 'user4'
  auditFormData.comment = ''
}

// 确认审核
const handleAuditSubmit = async () => {
  if (isNil(currentAuditRow.value?.id)) return

  auditLoading.value = true
  try {
    const result = await PerformanceApi.submitAudit({
      id: currentAuditRow.value.id,
      ...auditFormData
    })
    console.log('提交审核结果:', result)

    // 处理响应 - 兼容两种格式
    if (isObject(result) && !isNil(result)) {
      const res = result as { code?: number; msg?: string }
      if (res.code === 200 || res.code === 0) {
        ElMessage.success(res.msg || '提交审核成功')
        auditDialogVisible.value = false
        getList()
      } else {
        ElMessage.error(res.msg || '提交审核失败')
      }
    } else {
      // 直接成功
      ElMessage.success('提交审核成功')
      auditDialogVisible.value = false
      getList()
    }
  } catch (error: any) {
    console.error('提交审核失败:', error)
    ElMessage.error(error.message || '提交审核失败')
  } finally {
    auditLoading.value = false
  }
}

// 发布弹窗相关
const publishDialogVisible = ref(false)
const publishLoading = ref(false)
const currentPublishRow = ref<PerformanceApi.TrainingPerformanceVO>()
const publishFormData = reactive({
  visibleScope: [] as string[]
})

// 打开发布弹窗
const openPublishDialog = (row: PerformanceApi.TrainingPerformanceVO) => {
  currentPublishRow.value = row
  publishDialogVisible.value = true
  publishFormData.visibleScope = ['user1', 'user2', 'user3'] // 默认回显
}

// 确认发布
const handlePublishSubmit = async () => {
  if (isNil(currentPublishRow.value?.id)) return

  publishLoading.value = true
  try {
    const result = await PerformanceApi.publishDocument({
      id: currentPublishRow.value.id,
      visibleScope: publishFormData.visibleScope
    })
    console.log('发布结果:', result)

    // 处理响应 - 兼容两种格式
    if (isObject(result) && !isNil(result)) {
      const res = result as { code?: number; msg?: string }
      if (res.code === 200 || res.code === 0) {
        ElMessage.success(res.msg || '发布成功')
        publishDialogVisible.value = false
        getList()
      } else {
        ElMessage.error(res.msg || '发布失败')
      }
    } else {
      // 直接成功
      ElMessage.success('发布成功')
      publishDialogVisible.value = false
      getList()
    }
  } catch (error: any) {
    console.error('发布失败:', error)
    ElMessage.error(error.message || '发布失败')
  } finally {
    publishLoading.value = false
  }
}

// 驳回弹窗相关
const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const rejectHistoryList = ref<PerformanceApi.RejectRecordVO[]>([])
const rejectReason = ref('')
const currentRejectRow = ref<PerformanceApi.TrainingPerformanceVO>()

// 打开驳回弹窗
const openRejectDialog = async (row: PerformanceApi.TrainingPerformanceVO) => {
  if (!row.id) return
  currentRejectRow.value = row
  rejectDialogVisible.value = true
  rejectReason.value = '' // 重置输入
  rejectHistoryList.value = [] // 先清空

  // 获取历史记录
  try {
    const res = await PerformanceApi.getRejectHistory(row.id)
    rejectHistoryList.value = res
  } catch (error) {
    console.error('获取驳回历史失败:', error)
    rejectHistoryList.value = []
  }
}

// 提交驳回
const handleRejectSubmit = async () => {
  if (isEmpty(trim(rejectReason.value))) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  if (isNil(currentRejectRow.value?.id)) return

  rejectLoading.value = true
  try {
    await PerformanceApi.rejectTrainingPerformance({
      id: currentRejectRow.value.id,
      reason: rejectReason.value,
      rejectBy: 'admin' // 模拟当前用户
    })
    ElMessage.success('驳回成功')
    rejectDialogVisible.value = false
    getList() // 刷新列表
  } catch (error) {
    console.error('驳回失败:', error)
    ElMessage.error('驳回失败')
  } finally {
    rejectLoading.value = false
  }
}

// 删除（单个）
const handleDelete = async (row: PerformanceApi.TrainingPerformanceVO) => {
  if (isNil(row.id)) {
    ElMessage.error('无效的数据ID')
    return
  }

  try {
    await ElMessageBox.confirm('确认要删除该方案吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await PerformanceApi.deleteTrainingPerformance(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (isEmpty(selectedRows.value)) {
    ElMessage.warning('请先选择要删除的数据')
    return
  }

  // 检查是否所有选中的数据都是"编辑中"状态
  const notEditingRows = filter(selectedRows.value, (row) => row.status !== '编辑中')
  if (!isEmpty(notEditingRows)) {
    ElMessage.warning('只能删除"编辑中"状态的数据，请重新选择')
    return
  }

  try {
    await ElMessageBox.confirm(`确认要删除选中的 ${selectedRows.value.length} 条数据吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = filter(
      map(selectedRows.value, (item) => item.id),
      (id): id is number => !isNil(id)
    )
    if (isEmpty(ids)) {
      ElMessage.error('无效的数据ID')
      return
    }

    await PerformanceApi.deleteTrainingPerformance(ids)
    ElMessage.success(`成功删除 ${ids.length} 条数据`)
    selectedRows.value = []
    getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 状态样式
const getStatusClass = (status: string) => {
  switch (status) {
    case '编辑中':
      return 'bg-red-500'
    case '审核通过':
      return 'bg-green-500'
    case '发布成功':
      return 'bg-blue-500'
    case '待审核':
      return 'bg-orange-500'
    case '驳回':
      return 'bg-gray-400'
    default:
      return 'bg-gray-500'
  }
}

// 页面初始化
onMounted(() => {
  getCategories() // 获取文档分类
  getList() // 获取表格数据
})

// 页面销毁时清理
onUnmounted(() => {
  // 清理选中状态，避免内存泄漏
  selectedRows.value = []
  list.value = []
  categories.value = []
  rejectHistoryList.value = []
})
</script>
<style scoped>
:deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin-bottom: 4px;
  border-radius: 4px;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-table) {
  font-size: 14px;
}
</style>
