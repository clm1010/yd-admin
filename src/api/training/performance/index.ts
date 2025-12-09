import request from '@/config/axios'

// 演训方案数据接口
export interface TrainingPerformanceVO {
  id?: number
  drillDataId?: string // 演训数据ID
  drillDataName?: string // 演训数据名称
  name: string // 筹划方案名称
  docCategory: string // 文档分类
  brief?: string // 简介
  editableUser?: string // 可编辑用户
  creationMethod: string // 创建方式: 'new', 'upload'
  fileType?: string // 新建文档时选择的文件类型

  // 保留原有字段以兼容列表显示
  college?: string
  drillLevel?: string
  drillType?: string
  drillTheme?: string
  author?: string
  scope?: string
  status?: string
  createTime?: string
}

// 查询参数接口
export interface TrainingPerformancePageReqVO extends PageParam {
  name?: string // 方案名称
  status?: string // 文档状态
  statusList?: string[] // 文档状态列表（用于多选查询）
  uploadTime?: string[] // 上传时间范围
  docCategory?: string // 文档分类
  fileType?: string // 左侧文档分类ID
  drillTheme?: string // 演训主题
  drillType?: string // 演训类型
  drillLevel?: string // 演训等级
  docType?: string // 文档类型
}

// 文档分类接口
export interface DocCategoryVO {
  id: string
  fileType: string
  count?: number
}

// 提交审核参数接口
export interface SubmitAuditReqVO {
  id: number // 方案ID
  flowName: string // 流程名称
  auditors: {
    node1?: string
    node2?: string[]
    node3?: string
    node4?: string
  }
  comment?: string // 审核说明
}

// 发布文档参数接口
export interface PublishDocReqVO {
  id: number // 方案ID
  visibleScope: string[] // 可见范围（用户ID列表）
}

// 驳回记录接口
export interface RejectRecordVO {
  rejectBy: string
  rejectTime: string
  reason: string
}

// 驳回请求接口
export interface RejectReqVO {
  id: number
  reason: string
  rejectBy?: string // 可选，通常由后端从 token 获取，这里模拟传递
}

// 权限校验响应接口
export interface PermissionCheckResponse {
  code: number
  data: boolean // true=有权限, false=无权限
  status: number // 200=正常, 500=异常
  msg?: string
}

// 权限校验请求接口
export interface checkWriteData {
  id: string
  userId: string
}

// 文件流响应接口
export interface FileStreamResponse {
  code: number
  data: Blob | null
  msg?: string
}

// collaborative-middleware 服务的基础 URL
// 通过环境变量配置，支持开发和生产环境切换
const BASE_URL = `${import.meta.env.VITE_COLLABORATION_API_URL || 'http://localhost:3001'}/api`

// 获取演训方案分页数据
export const getTrainingPerformancePage = async (params: TrainingPerformancePageReqVO) => {
  return await request.get({
    url: `${BASE_URL}/training/performance/page`,
    params
  })
}

// 获取文档分类列表
export const getDocCategories = async () => {
  return await request.get({
    url: `${BASE_URL}/training/performance/categories`
  })
}

// 创建演训方案
export const createTrainingPerformance = async (data: TrainingPerformanceVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/create`,
    data
  })
}

// 更新演训方案
export const updateTrainingPerformance = async (data: TrainingPerformanceVO) => {
  return await request.put({
    url: `${BASE_URL}/training/performance/update`,
    data
  })
}

// 删除演训方案
export const deleteTrainingPerformance = async (ids: number | number[]) => {
  const idsArray = Array.isArray(ids) ? ids : [ids]
  return await request.delete({
    url: `${BASE_URL}/training/performance/delete`,
    data: { ids: idsArray }
  })
}

// 导出演训方案
export const exportTrainingPerformance = async (params: TrainingPerformancePageReqVO) => {
  return await request.get({
    url: `${BASE_URL}/training/performance/export`,
    params
  })
}

// 提交审核
export const submitAudit = async (data: SubmitAuditReqVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/audit/submit`,
    data
  })
}

// 发布文档
export const publishDocument = async (data: PublishDocReqVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/publish`,
    data
  })
}

// 获取驳回历史
export const getRejectHistory = async (id: number) => {
  return await request.get({
    url: `${BASE_URL}/training/performance/audit/reject/history`,
    params: { id }
  })
}

// 驳回演训方案
export const rejectTrainingPerformance = async (data: RejectReqVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/audit/reject`,
    data
  })
}

// 模拟获取演训数据列表（供前端选择使用）
export const getDrillDataList = async (_params?: any) => {
  // 这里只是定义接口，实际用前端mock数据
  return Promise.resolve([])
}

// ==================== 权限校验与文件流接口 ====================

/**
 * 写作权限校验
 * 调用中间件代理 -> Java 后端: /api/users/getPermissionCheck
 * @param id 文档ID
 * @param userId 用户ID
 * @returns 权限校验结果
 */
export const checkWritePermission = async (
  data: checkWriteData
): Promise<PermissionCheckResponse> => {
  return await request.post({
    url: `${BASE_URL}/users/getPermissionCheck`,
    data
  })
}

/**
 * 获取文档文件流
 * 调用中间件代理 -> Java 后端: /api/users/getfileStream
 * @param id 文档ID
 * @returns 文件流数据 (Blob)
 */
export const getFileStream = async (id: number): Promise<Blob | null> => {
  try {
    // 使用 download 方法获取 blob，因为 get 方法会对 blob 响应处理不正确
    const response = await request.download({
      url: `${BASE_URL}/users/getfileStream`,
      params: { id }
    })

    console.log('getFileStream 原始响应:', response, typeof response)

    // 检查响应是否为有效的 Blob
    if (response instanceof Blob && response.size > 0) {
      console.log('响应是 Blob, size:', response.size, 'type:', response.type)
      // 检查是否是 JSON 错误响应
      if (response.type.includes('application/json')) {
        const text = await response.text()
        console.log('JSON 响应内容:', text)
        try {
        const json = JSON.parse(text)
        if (json.data === null || json.code !== 0) {
          return null
          }
        } catch (e) {
          // 不是有效的 JSON，当作二进制数据处理
        }
      }
      return response
    }

    // 如果不是 Blob，尝试检查是否是 ArrayBuffer 或其他二进制数据
    if (response && (response as any).data instanceof Blob) {
      const blob = (response as any).data as Blob
      console.log('响应包含 Blob data, size:', blob.size)
      if (blob.size > 0) {
        return blob
      }
    }

    console.log('响应不是有效的 Blob:', response)
    return null
  } catch (error) {
    console.error('获取文件流失败:', error)
    return null
  }
}
