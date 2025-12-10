<template>
  <div class="template-management">
    <!-- 页面头部信息 -->
    <!-- <ContentWrap class="mb-4">
      <div class="header-info">
        <div class="text-18px font-bold mb-2">模板分类：筹划文档</div>
        <div class="text-14px text-gray-500">模板子类：11种文档分类</div>
      </div>
    </ContentWrap> -->

    <!-- 工具栏和搜索栏 -->
    <ContentWrap>
      <!-- 工具栏 -->
      <div class="mb-4 flex gap-3">
        <el-button type="primary" @click="handleImport">
          <Icon icon="ep:upload" class="mr-1" />
          导入
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <Icon icon="ep:plus" class="mr-1" />
          新建
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="80px"
      >
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            class="!w-280px"
          />
        </el-form-item>
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入" clearable class="!w-200px" />
        </el-form-item>
        <el-form-item label="模板分类" prop="category">
          <el-select v-model="queryParams.category" placeholder="请选择" clearable class="!w-200px">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <Icon icon="ep:search" class="mr-1" />
            查询
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-1" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 标签页和表格 -->
    <ContentWrap class="mt-4">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="最近文档" name="recent" />
        <el-tab-pane label="审核列表" name="review" />
        <el-tab-pane label="文档发布" name="publish" />
      </el-tabs>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="模板名称" prop="name" align="center" min-width="150" />
        <el-table-column label="模板子类" prop="subCategory" align="center" width="120" />
        <el-table-column label="模板状态" prop="status" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="描述"
          prop="description"
          align="center"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="上传时间" prop="uploadTime" align="center" width="180" />
        <el-table-column label="创建人" prop="creator" align="center" width="120" />
        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">
              <Icon icon="ep:edit" />
              写作
            </el-button>
            <el-button
              v-if="scope.row.auditStatus === '待提交'"
              link
              type="primary"
              @click="handleSubmitAudit(scope.row)"
            >
              <Icon icon="ep:upload" />
              提交审核
            </el-button>
            <el-button v-else-if="scope.row.auditStatus === '审核中'" link type="warning" disabled>
              <Icon icon="ep:clock" />
              审核中
            </el-button>
            <el-button v-else-if="scope.row.auditStatus === '审核通过'" link type="success">
              <Icon icon="ep:check" />
              审核通过
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">
              <Icon icon="ep:delete" />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt-4 flex justify-between items-center">
        <div class="text-gray-500">共 {{ total }} 条</div>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </ContentWrap>

    <!-- 新建/编辑模板弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模板名称" clearable />
        </el-form-item>
        <el-form-item label="模板子类" prop="subCategory">
          <el-select v-model="formData.subCategory" placeholder="请选择" clearable class="w-full">
            <el-option
              v-for="item in subCategoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="模板状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入模板弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入模板"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :file-list="uploadFileList"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept=".doc,.docx,.xlsx,.xls"
      >
        <Icon icon="ep:upload-filled" class="text-50px text-gray-400" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-gray-400">支持 doc, docx, xlsx, xls 格式文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importLoading"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 提交审核弹窗 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="提交审核"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="auditFormRef" :model="auditFormData" label-width="100px">
        <el-form-item label="审核人">
          <el-select v-model="auditFormData.auditor" placeholder="请选择审核人" class="w-full">
            <el-option
              v-for="item in auditorOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核说明">
          <el-input
            v-model="auditFormData.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading"
          >确认提交</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as TemplateApi from '@/api/template/management'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'TemplateManagement' })

const router = useRouter()

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)
const importLoading = ref(false)
const auditLoading = ref(false)

// 列表数据
const list = ref<TemplateApi.TemplateVO[]>([])
const total = ref(0)

// 当前标签页
const activeTab = ref('recent')

// 查询参数
const queryParams = reactive<TemplateApi.TemplatePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  category: undefined,
  dateRange: [],
  tabType: undefined
})

const queryFormRef = ref()

// 分类选项
const categoryOptions = ref<TemplateApi.TemplateCategoryVO[]>([])
const subCategoryOptions = ref<TemplateApi.TemplateCategoryVO[]>([])

// 新建/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建模板')
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  subCategory: '',
  description: '',
  status: '启用'
})

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  subCategory: [{ required: true, message: '请选择模板子类', trigger: 'change' }]
}

// 导入弹窗
const importDialogVisible = ref(false)
const uploadFileList = ref<any[]>([])
const uploadFile = ref<File | null>(null)

// 审核弹窗
const auditDialogVisible = ref(false)
const auditFormData = reactive({
  id: undefined as number | undefined,
  auditor: '',
  comment: ''
})

// 审核人选项
const auditorOptions = [
  { label: '审核员A', value: 'auditor_a' },
  { label: '审核员B', value: 'auditor_b' },
  { label: '审核员C', value: 'auditor_c' }
]

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      tabType: activeTab.value
    }
    // 移除空值
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof typeof params]
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete params[key as keyof typeof params]
      }
    })

    const data = await TemplateApi.getPageList(params)
    list.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取分类数据
const getCategories = async () => {
  try {
    const data = await TemplateApi.getCategories()
    categoryOptions.value = data
    subCategoryOptions.value = data.filter(
      (item: TemplateApi.TemplateCategoryVO) => item.id !== '0'
    )
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 重置
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  activeTab.value = 'recent'
  handleQuery()
}

// 标签页切换
const handleTabClick = () => {
  queryParams.pageNo = 1
  getList()
}

// 新建
const handleAdd = () => {
  dialogTitle.value = '新建模板'
  Object.assign(formData, {
    id: undefined,
    name: '',
    subCategory: '',
    description: '',
    status: '启用'
  })
  dialogVisible.value = true
}

// 编辑/写作 - 跳转到 Markdown 协同编辑器
const handleEdit = (row: TemplateApi.TemplateVO) => {
  // 存储文档信息到 sessionStorage，供编辑器页面使用
  const docInfo = {
    id: String(row.id),
    title: row.name,
    content: '',
    createTime: row.uploadTime || new Date().toISOString(),
    updateTime: row.uploadTime || new Date().toISOString(),
    version: 'V1.0',
    tags: [],
    creatorId: 0,
    creatorName: row.creator || '未知'
  }
  sessionStorage.setItem(`markdown_info_${row.id}`, JSON.stringify(docInfo))

  // 跳转到模板编辑器页面
  router.push({
    path: `/template/editor/${row.id}`,
    query: {
      title: row.name
    }
  })
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    submitLoading.value = true

    if (formData.id) {
      await TemplateApi.updateTemplate(formData as TemplateApi.TemplateVO)
      ElMessage.success('更新成功')
    } else {
      await TemplateApi.createTemplate(formData as TemplateApi.TemplateVO)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    getList()
  } catch (error: any) {
    if (error !== false) {
      console.error('保存失败:', error)
      ElMessage.error(error.message || '保存失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 删除
const handleDelete = async (row: TemplateApi.TemplateVO) => {
  try {
    await ElMessageBox.confirm('确认要删除该模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await TemplateApi.deleteTemplate(row.id!)
    ElMessage.success('删除成功')
    getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 导入
const handleImport = () => {
  uploadFileList.value = []
  uploadFile.value = null
  importDialogVisible.value = true
}

// 文件选择
const handleFileChange = (file: any) => {
  uploadFile.value = file.raw
}

// 文件移除
const handleFileRemove = () => {
  uploadFile.value = null
}

// 导入提交
const handleImportSubmit = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importLoading.value = true
  try {
    await TemplateApi.importTemplate({ file: uploadFile.value })
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    getList()
  } catch (error: any) {
    console.error('导入失败:', error)
    ElMessage.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

// 提交审核
const handleSubmitAudit = (row: TemplateApi.TemplateVO) => {
  auditFormData.id = row.id
  auditFormData.auditor = ''
  auditFormData.comment = ''
  auditDialogVisible.value = true
}

// 审核提交
const handleAuditSubmit = async () => {
  if (!auditFormData.auditor) {
    ElMessage.warning('请选择审核人')
    return
  }

  auditLoading.value = true
  try {
    await TemplateApi.submitAudit({
      id: auditFormData.id!,
      auditor: auditFormData.auditor,
      comment: auditFormData.comment
    })
    ElMessage.success('提交审核成功')
    auditDialogVisible.value = false
    getList()
  } catch (error: any) {
    console.error('提交审核失败:', error)
    ElMessage.error(error.message || '提交审核失败')
  } finally {
    auditLoading.value = false
  }
}

// 页面初始化
onMounted(() => {
  getCategories()
  getList()
})
</script>

<style scoped>
.template-management {
  padding: 0;
}

.header-info {
  padding: 10px 0;
}

:deep(.el-table) {
  font-size: 14px;
}
</style>
