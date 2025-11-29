import request from '@/config/axios'

// 演训方案数据接口
export interface TrainingPerformanceVO {
  id?: number
  name: string // 方案名称
  college: string // 所属学院
  docCategory: string // 文档分类
  drillLevel: string // 演训等级
  drillType?: string // 演训类型
  drillTheme?: string // 演训主题
  author: string // 作者
  scope: string // 权限范围
  status: string // 审核状态
  description?: string // 描述
  editMode?: string // 编辑方式
  createTime?: string // 创建时间
}

// 查询参数接口
export interface TrainingPerformancePageReqVO extends PageParam {
  name?: string // 方案名称
  status?: string // 文档状态: 'editing', 'reviewing', 'approved', 'published'
  uploadTime?: string[] // 上传时间范围
  docCategory?: string // 文档分类（顶部下拉框）
  fileType?: string // 左侧文档分类ID: 'all', 'plan', 'combat' 等
  drillType?: string // 演训类型
  drillTheme?: string // 演训主题
  drillLevel?: string // 演训等级: 'strategy', 'tactics'
  docType?: string // 文档类型
}

// 文档分类接口
export interface DocCategoryVO {
  id: string // 分类ID: 'all', 'plan', 'combat', 'scheme' 等
  fileType: string // 分类名称: '全部', '企图立案', '作战计划' 等
  count?: number // 该分类下的文档数量（由前端动态计算）
}

// Node 服务的基础 URL
const BASE_URL = 'http://localhost:3001'

// 获取演训方案分页数据
export const getTrainingPerformancePage = async (params: TrainingPerformancePageReqVO) => {
  return await request.get({
    url: `${BASE_URL}/api/training/performance/page`,
    params
  })
}

// 获取文档分类列表
export const getDocCategories = async () => {
  return await request.get({
    url: `${BASE_URL}/api/training/performance/categories`
  })
}

// 创建演训方案
export const createTrainingPerformance = async (data: TrainingPerformanceVO) => {
  return await request.post({
    url: `${BASE_URL}/api/training/performance/create`,
    data
  })
}

// 更新演训方案
export const updateTrainingPerformance = async (data: TrainingPerformanceVO) => {
  return await request.put({
    url: `${BASE_URL}/api/training/performance/update`,
    data
  })
}

// 删除演训方案（支持单个和批量删除）
export const deleteTrainingPerformance = async (ids: number | number[]) => {
  // 统一转为数组格式
  const idsArray = Array.isArray(ids) ? ids : [ids]
  return await request.delete({
    url: `${BASE_URL}/api/training/performance/delete`,
    data: { ids: idsArray }
  })
}

// 导出演训方案
export const exportTrainingPerformance = async (params: TrainingPerformancePageReqVO) => {
  return await request.get({
    url: `${BASE_URL}/api/training/performance/export`,
    params
  })
}
