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
      <div class="mb-4 flex gap-3 items-center">
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
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="createTimeRange"
            type="daterange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            class="!w-280px"
          />
        </el-form-item>
        <el-form-item label="模板名称" prop="templateName">
          <el-input
            v-model="queryParams.templateName"
            placeholder="请输入"
            clearable
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="模板分类" prop="temCategory">
          <el-select
            v-model="queryParams.temCategory"
            placeholder="请选择"
            clearable
            class="!w-200px"
          >
            <el-option
              v-for="item in templateCategories"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板子类" prop="temSubclass">
          <el-select
            v-model="queryParams.temSubclass"
            placeholder="模板子类"
            clearable
            class="!w-150px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in subCategoryOptions"
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
      <el-button type="danger" plain :disabled="!canBatchDelete" @click="handleBatchDelete">
        <Icon icon="ep:delete" class="mr-1" />
        批量删除 {{ selectedIds.length > 0 ? `(${selectedIds.length})` : '' }}
      </el-button>
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="最近文档" name="recent" />
        <el-tab-pane label="审核列表" name="review" />
        <el-tab-pane label="文档发布" name="publish" />
      </el-tabs>

      <!-- 表格 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="模板名称" prop="templateName" align="center" min-width="150" />
        <el-table-column label="模板分类" prop="temCategory" align="center" min-width="120">
          <template #default>
            {{ templateCategories[0]?.name || '筹划文档' }}
          </template>
        </el-table-column>
        <el-table-column label="模板子类" prop="temSubclass" align="center" width="120">
          <template #default="scope">
            {{ getSubCategoryNameById(scope.row.temSubclass) || scope.row.temSubclass }}
          </template>
        </el-table-column>
        <el-table-column label="模板状态" prop="temStatus" align="center" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.temStatus)">
              {{ getStatusText(scope.row.temStatus) }}
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
        <el-table-column label="创建时间" prop="createTime" align="center" width="180" />
        <el-table-column label="创建人" prop="createBy" align="center" width="120" />
        <el-table-column label="操作" align="center" width="280" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEditData(scope.row)">
              <Icon icon="ep:edit-pen" />
              编辑
            </el-button>
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
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="formData.templateName" placeholder="请输入模板名称" clearable />
        </el-form-item>
        <el-form-item label="模板分类" prop="temCategory">
          <el-select v-model="formData.temCategory" placeholder="请选择" clearable class="w-full">
            <el-option
              v-for="item in templateCategories"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板子类" prop="temSubclass">
          <el-select v-model="formData.temSubclass" placeholder="请选择" clearable class="w-full">
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
        <el-form-item label="模板状态" prop="temStatus">
          <el-radio-group v-model="formData.temStatus">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 创建方式（仅新建时显示） -->
        <el-form-item v-if="!isEditMode" label="创建方式" prop="creationMethod">
          <el-radio-group v-model="formData.creationMethod">
            <el-radio label="new">新建文档</el-radio>
            <el-radio label="upload">上传文档</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 创建方式：上传文档 (显示上传组件，仅新建时显示) -->
        <div v-if="!isEditMode && formData.creationMethod === 'upload'" class="pl-[100px] mt-4">
          <div class="flex items-start">
            <el-upload
              class="upload-demo w-full"
              drag
              action="#"
              :auto-upload="false"
              :file-list="uploadFileList"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              accept=".md"
            >
              <Icon icon="ep:upload-filled" class="el-icon--upload text-50px text-gray-400" />
              <div class="el-upload__text"> 将文件拖到此处，或 <em>点击上传</em> </div>
              <template #tip>
                <div class="el-upload__tip text-gray-400"> 支持 .md 格式文件 </div>
              </template>
            </el-upload>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="submitLoading">确定</el-button>
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as TemplateApi from '@/api/template/management'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useCollaborationUserStore } from '@/store/modules/collaborationUser'
import { isEmpty, isNil, isString, isObject, pickBy, filter, map, every } from 'lodash-es'
import {
  templateCategories,
  templateSubCategories,
  getSubCategoryNameById
} from './config/categories'

defineOptions({ name: 'TemplateManagement' })

const router = useRouter()
const collaborationUserStore = useCollaborationUserStore()

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)
const auditLoading = ref(false)

// 列表数据
const list = ref<TemplateApi.TemplateVO[]>([])
const total = ref(0)

// 表格引用和选中数据
const tableRef = ref()
const selectedIds = ref<(number | string)[]>([])
const selectedRows = ref<TemplateApi.TemplateVO[]>([])

// 计算属性：判断是否可以批量删除（只有选中的数据都是"待提交"状态才能删除）
const canBatchDelete = computed(() => {
  if (isEmpty(selectedRows.value)) return false
  // 如果数据没有 auditStatus 字段，则允许删除（兼容旧数据）
  return every(selectedRows.value, (row) => !row.auditStatus || row.auditStatus === '待提交')
})

// 当前标签页
const activeTab = ref('recent')

// 日期范围（用于日期选择器，数组格式）
const createTimeRange = ref<string[]>([])

// 查询参数
const queryParams = reactive<TemplateApi.TemplatePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  templateName: undefined,
  temSubclass: undefined,
  createTime: undefined,
  tabType: undefined
})

const queryFormRef = ref()

// 分类选项（使用本地配置）
const categoryOptions = ref(templateCategories)
const subCategoryOptions = ref(templateSubCategories)

// 新建/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建模板')
const isEditMode = ref(false) // 是否为编辑模式（编辑模式隐藏创建方式）
const formRef = ref()
const formData = reactive({
  id: undefined as number | string | undefined,
  templateName: '',
  temSubclass: '',
  description: '',
  temStatus: '启用',
  temCategory: '',
  creationMethod: 'new' as 'new' | 'upload'
})

const formRules = {
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  temCategory: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  temSubclass: [{ required: true, message: '请选择模板子类', trigger: 'change' }]
}

// 上传文件
const uploadFileList = ref<any[]>([])
const uploadFile = ref<File | null>(null)

// 审核弹窗
const auditDialogVisible = ref(false)
const auditFormData = reactive({
  id: undefined as number | string | undefined,
  auditor: '',
  comment: ''
})

// 审核人选项
const auditorOptions = [
  { label: '审核员A', value: 'auditor_a' },
  { label: '审核员B', value: 'auditor_b' },
  { label: '审核员C', value: 'auditor_c' }
]

// 状态显示处理（兼容 "0"/"1" 和 "启用"/"禁用" 两种格式）
const getStatusText = (status: string) => {
  if (status === '0' || status === '启用') return '启用'
  if (status === '1' || status === '禁用') return '禁用'
  return status
}

const getStatusType = (status: string) => {
  if (status === '0' || status === '启用') return 'success'
  return 'info'
}

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    // 复制查询参数
    const params = {
      ...queryParams,
      tabType: activeTab.value
    } as Record<string, any>

    // 将 createTimeRange 数组转换为字符串格式 '2025-10-10,2025-12-12'
    if (Array.isArray(createTimeRange.value) && createTimeRange.value.length === 2) {
      params.createTime = createTimeRange.value.join(',')
    }

    // 使用 lodash pickBy 移除空值
    const cleanParams = pickBy(params, (value) => {
      if (Array.isArray(value)) return !isEmpty(value)
      return !isNil(value) && value !== ''
    })

    console.log('查询参数', cleanParams)

    const data = await TemplateApi.getPageList(cleanParams as TemplateApi.TemplatePageReqVO)
    list.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化分类数据（使用本地配置）
const initCategories = () => {
  categoryOptions.value = templateCategories
  subCategoryOptions.value = templateSubCategories
}

// 查询
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 重置
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.templateName = undefined
  queryParams.temSubclass = undefined
  queryParams.createTime = undefined
  createTimeRange.value = []
  activeTab.value = 'recent'
  handleQuery()
}

// 标签页切换
const handleTabClick = () => {
  queryParams.pageNo = 1
  // 清空选中状态
  selectedIds.value = []
  selectedRows.value = []
  tableRef.value?.clearSelection()
  getList()
}

// 表格选择变更
const handleSelectionChange = (rows: TemplateApi.TemplateVO[]) => {
  selectedRows.value = rows
  selectedIds.value = filter(
    map(rows, (row) => row.id),
    (id) => !isNil(id)
  ) as (number | string)[]
}

// 新建
const handleAdd = () => {
  dialogTitle.value = '新建模板'
  isEditMode.value = false // 新建模式
  Object.assign(formData, {
    id: undefined,
    templateName: '',
    temCategory: '',
    temSubclass: '',
    description: '',
    temStatus: '启用',
    creationMethod: 'new'
  })
  uploadFileList.value = []
  uploadFile.value = null
  dialogVisible.value = true
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

// 编辑/写作 - 跳转到 Markdown 协同编辑器
const handleEdit = async (row: TemplateApi.TemplateVO) => {
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
    const checkData = { id: String(row.id), userId: userId as string }
    const permResult = await TemplateApi.checkWritePermission(checkData)
    console.log('权限校验结果:', permResult)

    // 3. 检查权限 - status=500 或 data=false 表示无权限
    if (permResult.status === 500 || permResult.data === false) {
      ElMessage.error('您没有该模板的写作权限')
      if (permResult.msg) {
        ElMessage.error(permResult.msg)
      }
      return
    }

    // 4. 权限通过，获取文件流
    loadingInstance.setText('正在加载文档内容...')
    console.log('调用文件流接口, id:', row.id)
    const streamResult = await TemplateApi.getFileStream(String(row.id))
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
      sessionStorage.setItem(`markdown_content_${row.id}`, base64Content)
      hasContent = true
      console.log('文件流已存储到 sessionStorage, key:', `markdown_content_${row.id}`)
    } else {
      console.warn('文件流为空或无效:', streamResult)
    }

    // 6. 准备文档信息并存储到 sessionStorage
    const docInfo = {
      id: String(row.id),
      title: row.templateName,
      content: '',
      createTime: row.createTime || new Date().toISOString(),
      updateTime: row.createTime || new Date().toISOString(),
      version: 'V1.0',
      tags: [],
      creatorId: 0,
      creatorName: row.createBy || '未知'
    }
    sessionStorage.setItem(`markdown_info_${row.id}`, JSON.stringify(docInfo))

    // 7. 跳转到模板编辑器页面
    router.push({
      path: `/template/editor/${row.id}`,
      query: {
        title: row.templateName,
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

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()

    // 如果是上传文档方式，检查是否选择了文件
    if (formData.creationMethod === 'upload' && isNil(uploadFile.value)) {
      ElMessage.warning('请选择要上传的文件')
      return
    }

    submitLoading.value = true

    if (formData.id) {
      // 编辑模式
      const updateData: TemplateApi.TemplateVO = {
        id: formData.id,
        templateName: formData.templateName,
        temCategory: formData.temCategory,
        temSubclass: formData.temSubclass,
        temStatus: formData.temStatus,
        description: formData.description
      }
      await TemplateApi.updateTemplate(updateData)
      ElMessage.success('更新成功')
    } else {
      // 新建模式
      // 构建保存数据
      const saveData: any = {
        templateName: formData.templateName,
        temCategory: formData.temCategory,
        temSubclass: formData.temSubclass,
        description: formData.description,
        temStatus: formData.temStatus
      }

      // 判断创建方式
      if (formData.creationMethod === 'upload') {
        // 上传文档模式
        // 先上传文档文件
        console.log('上传文档文件:', uploadFile.value!.name)
        const uploadResult = await TemplateApi.saveDocument({
          file: uploadFile.value!
        })
        console.log('上传结果:', uploadResult, typeof uploadResult)

        // 处理上传结果 - 兼容两种响应格式
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

        // 将上传返回的 fileId 传递给 savaTemplate
        saveData.fileId = fileId

        // 创建模板记录
        await TemplateApi.savaTemplate(saveData)
        ElMessage.success('创建成功')
      } else {
        // 新建文档模式
        await TemplateApi.savaTemplate(saveData)
        ElMessage.success('创建成功')
      }
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

// 批量删除
const handleBatchDelete = async () => {
  if (isEmpty(selectedIds.value)) {
    ElMessage.warning('请先选择要删除的模板')
    return
  }

  // 检查是否所有选中的数据都是"待提交"状态
  const notDeletableRows = filter(
    selectedRows.value,
    (row) => row.auditStatus && row.auditStatus !== '待提交'
  )
  if (!isEmpty(notDeletableRows)) {
    ElMessage.warning('只能删除"待提交"状态的模板，请重新选择')
    return
  }

  try {
    await ElMessageBox.confirm(`确认要删除选中的 ${selectedIds.value.length} 个模板吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await TemplateApi.batchDeleteTemplate(selectedIds.value)
    ElMessage.success(`成功删除 ${selectedIds.value.length} 个模板`)

    // 清空选中状态
    selectedIds.value = []
    selectedRows.value = []
    tableRef.value?.clearSelection()

    // 刷新列表
    getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 编辑数据
const handleEditData = (row: TemplateApi.TemplateVO) => {
  dialogTitle.value = '编辑模板'
  isEditMode.value = true // 编辑模式（隐藏创建方式）
  Object.assign(formData, {
    id: row.id,
    templateName: row.templateName,
    temSubclass: row.temSubclass,
    description: row.description || '',
    temStatus: row.temStatus || '启用'
    // 编辑模式不设置 creationMethod
  })
  uploadFileList.value = []
  uploadFile.value = null
  dialogVisible.value = true
}

// 文件选择
const handleFileChange = (file: any) => {
  uploadFile.value = file.raw
}

// 文件移除
const handleFileRemove = () => {
  uploadFile.value = null
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
  initCategories()
  getList()
})

// 页面销毁时清理
onUnmounted(() => {
  // 清理选中状态和列表数据，避免内存泄漏
  selectedRows.value = []
  selectedIds.value = []
  list.value = []
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
