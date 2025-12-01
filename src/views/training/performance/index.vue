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
              <el-tag
                v-if="category.count && category.count > 0"
                class="ml-2"
                size="small"
                type="info"
              >
                {{ category.count }}
              </el-tag>
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
                  <el-option label="审核中" value="reviewing" />
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
          <el-button type="primary" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-1" />
            新建
          </el-button>
          <el-button plain @click="handleGenerate">
            <Icon icon="ep:document-add" class="mr-1" />
            文档生成
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="selectedRows.length === 0"
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
          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleEdit(scope.row)">
                <Icon icon="ep:edit" />
                写作
              </el-button>
              <el-button
                link
                type="primary"
                @click="handleSubmit(scope.row)"
                v-if="scope.row.status === '编辑中'"
              >
                <Icon icon="ep:upload" />
                提交审核
              </el-button>
              <el-button link type="danger" @click="handleDelete(scope.row)">
                <Icon icon="ep:delete" />
                删除
              </el-button>
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

  <!-- 新建弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="演训主题" prop="drillTheme">
            <el-input v-model="formData.drillTheme" placeholder="请选择" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="方案名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属学院" prop="college">
            <el-select v-model="formData.college" placeholder="请选择" clearable class="w-full">
              <el-option
                v-for="item in collegeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="演训等级" prop="drillLevel">
            <el-select v-model="formData.drillLevel" placeholder="请选择" clearable class="w-full">
              <el-option
                v-for="item in drillLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="演训类型" prop="drillType">
            <el-select v-model="formData.drillType" placeholder="请选择" clearable class="w-full">
              <el-option
                v-for="item in drillTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文档分类" prop="docCategory">
            <el-select v-model="formData.docCategory" placeholder="请选择" clearable class="w-full">
              <el-option
                v-for="item in docCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="编辑方式">
        <el-radio-group v-model="formData.editMode">
          <el-radio v-for="item in editModeOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">关闭</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as PerformanceApi from '@/api/training/performance'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'TrainingPerformance' })

const router = useRouter()
const loading = ref(false)
const total = ref(0)
const list = ref<PerformanceApi.TrainingPerformanceVO[]>([])
const activeTab = ref('recent')
const selectedCategory = ref('all')
const categories = ref<PerformanceApi.DocCategoryVO[]>([])
const selectedRows = ref<PerformanceApi.TrainingPerformanceVO[]>([])

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

// 获取数据列表
const getList = async () => {
  loading.value = true
  try {
    const data = await PerformanceApi.getTrainingPerformancePage(queryParams)
    list.value = data.list
    total.value = data.total
    // 每次获取数据后更新分类统计
    await updateCategoryCounts()
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

// 动态统计每个分类的文档数量
const updateCategoryCounts = async () => {
  try {
    // 获取所有数据（不分页）用于统计
    const allData = await PerformanceApi.getTrainingPerformancePage({
      pageNo: 1,
      pageSize: 9999 // 获取全部数据
    })

    // 分类ID到分类名称的映射
    const categoryIdMap: Record<string, string> = {
      plan: '企图立案',
      combat: '作战计划',
      scheme: '演训方案',
      book: '作战文书',
      guide: '导调计划',
      idea: '作战想点',
      report: '战绩战报',
      summary: '总结报告',
      notice: '通知',
      announce: '通告',
      result: '评估结果'
    }

    // 统计每个分类的数量
    categories.value = categories.value.map((category) => {
      if (category.id === 'all') {
        // "全部"显示总数
        return { ...category, count: allData.total }
      } else {
        // 根据 docCategory 统计
        const categoryName = categoryIdMap[category.id]
        const count = allData.list.filter((item) => item.docCategory === categoryName).length
        return { ...category, count }
      }
    })
  } catch (error) {
    console.error('统计分类数量失败:', error)
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
  selectedCategory.value = 'all'
  queryParams.fileType = undefined // 重置分类过滤
  handleQuery()
}

// 文档分类选择
const handleCategorySelect = (index: string) => {
  selectedCategory.value = index
  console.log('选择分类:', index)

  // 将选择的分类传递到查询参数
  if (index === 'all') {
    // 选择全部时，清空分类过滤
    queryParams.fileType = undefined
  } else {
    // 将分类 ID 传递给查询参数
    queryParams.fileType = index
  }

  // 触发查询
  handleQuery()
}

// 新建弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建')
const formRef = ref()

// 表单数据
const formData = reactive({
  drillTheme: '', // 演训主题
  name: '', // 方案名称
  college: '', // 所属学院
  drillLevel: '', // 演训等级
  drillType: '', // 演训类型
  docCategory: '', // 文档分类
  description: '', // 描述
  editMode: 'standard' // 编辑方式：standard-标准文档, upload-上传文档, select-选择文档
})

// 表单验证规则
const formRules = {
  drillTheme: [{ required: true, message: '请输入演训主题', trigger: 'blur' }],
  name: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  college: [{ required: true, message: '请选择所属学院', trigger: 'change' }],
  drillLevel: [{ required: true, message: '请选择演训等级', trigger: 'change' }],
  drillType: [{ required: true, message: '请选择演训类型', trigger: 'change' }],
  docCategory: [{ required: true, message: '请选择文档分类', trigger: 'change' }]
}

// 下拉框选项（前端写死）
const collegeOptions = [
  { label: '学院A', value: '学院A' },
  { label: '学院B', value: '学院B' },
  { label: '学院C', value: '学院C' }
]

const drillLevelOptions = [
  { label: '战略级', value: '战略级' },
  { label: '战术级', value: '战术级' }
]

const drillTypeOptions = [
  { label: '类型A', value: 'A' },
  { label: '类型B', value: 'B' },
  { label: '类型C', value: 'C' }
]

const docCategoryOptions = [
  { label: '企图立案', value: '企图立案' },
  { label: '总体方案', value: '总体方案' },
  { label: '作战计划', value: '作战计划' },
  { label: '演训方案', value: '演训方案' },
  { label: '作战文书', value: '作战文书' },
  { label: '导调计划', value: '导调计划' },
  { label: '作战想定', value: '作战想定' },
  { label: '战绩战报', value: '战绩战报' },
  { label: '总结报告', value: '总结报告' },
  { label: '通知', value: '通知' },
  { label: '通告', value: '通告' },
  { label: '评估结果', value: '评估结果' }
]

// 编辑方式选项
const editModeOptions = [
  { label: '标准文档', value: 'standard' },
  { label: '上传文档', value: 'upload' },
  { label: '选择文档', value: 'select' }
]

// 新建
const handleAdd = () => {
  dialogTitle.value = '新建'
  dialogVisible.value = true
  // 重置表单
  Object.assign(formData, {
    drillTheme: '',
    name: '',
    college: '',
    drillLevel: '',
    drillType: '',
    docCategory: '',
    description: '',
    editMode: 'standard'
  })
  // 清除验证
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const saveData = {
      ...formData,
      author: 'admin', // 当前用户
      scope: '可编辑',
      status: '编辑中'
    }

    await PerformanceApi.createTrainingPerformance(saveData)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    getList()
  } catch (error: any) {
    if (error !== false) {
      // 不是验证失败
      console.error('创建失败:', error)
      ElMessage.error('创建失败')
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

// Tab 切换
const handleTabClick = (tab: any) => {
  console.log('切换Tab:', tab.props.name)
  activeTab.value = tab.props.name
}

// 选择变化
const handleSelectionChange = (val: PerformanceApi.TrainingPerformanceVO[]) => {
  selectedRows.value = val
  console.log('选择变化:', val)
}

// 写作
const handleEdit = (row: any) => {
  console.log('写作:', row)
  router.push({
    name: 'DocumentEdit',
    params: { id: row.id },
    query: { title: row.name } // 传递方案名称作为标题
  })
}

// 提交审核
const handleSubmit = async (row: PerformanceApi.TrainingPerformanceVO) => {
  try {
    await ElMessageBox.confirm('确认要提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    console.log('提交审核方案ID:', row.id)
    ElMessage.success('提交审核成功')
    getList()
  } catch {
    // 用户取消
  }
}

// 删除（单个）
const handleDelete = async (row: PerformanceApi.TrainingPerformanceVO) => {
  if (!row.id) {
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
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的数据')
    return
  }

  try {
    await ElMessageBox.confirm(`确认要删除选中的 ${selectedRows.value.length} 条数据吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = selectedRows.value
      .map((item) => item.id)
      .filter((id): id is number => id !== undefined)
    if (ids.length === 0) {
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
    case '审核中':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

// 初始化
onMounted(() => {
  getCategories()
  getList()
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
