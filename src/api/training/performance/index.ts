import request from '@/config/axios'
import { isArray, isNil } from 'lodash-es'

// 演训方案数据接口
export interface TrainingPerformanceVO {
  id?: number
  drillDataId?: string // 演训数据ID
  drillDataName?: string // 演训数据名称
  planName: string // 筹划方案名称
  collegeCode?: string // 学院代码
  fileType: string //左侧树文档分类
  activeUser?: string // 可编辑用户
  description?: string // 简介/描述
  level?: string //演训等级
  exerciseType?: string // 演训类型
  exerciseTheme?: string // 演训主题
  docType?: string // 文件类型
  createBy?: string // 创建人
  applyNode?: string // 审核状态
  createTime?: string // 创建时间 (上传时间)
  updateTime?: string // 更新时间
  delFlg?: string // 删除(0-未删除,1-已删除)
  flowId?: string // 审核流程id
  flowNode?: string // 当前审核节点
  creationMethod?: string // 创建方式: 'new', 'upload'
  newFileType?: string //新建文档时选择的文件类型
  fileId?: any //上传文档时返回的文件ID
  scope?: string // 权限范围

  // 保留原有字段以兼容列表显示
  offset?: number // 偏移量
  userId?: string // 用户ID
  version?: string // 版本号
  author?: string // 作者
}

// 查询参数接口
export interface TrainingPerformancePageReqVO extends PageParam {
  planName?: string // 方案名称
  applyNode?: string // 审核状态
  createTime?: string //创建时间 (上传时间)
  fileType?: string //左侧文档分类
  exerciseTheme?: string //演训主题
  exerciseType?: string //演训类型
  level?: string // 演训等级
  collegeCode?: string // 所属学院
  docType?: string // 文件类型
  tabType?: string // 标签页类型undefined(recent)
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

// 上传文档参数接口
export interface UploadDocumentData {
  id?: string // 文档ID（可选）
  file: File // 文件对象
}

// 获取演训方案分页数据 (旧接口，保留兼容)
export const getTrainingPerformancePage = async (params: TrainingPerformancePageReqVO) => {
  return await request.get({
    url: `${BASE_URL}/training/performance/page`,
    params
  })
}

/**
 * 获取分页列表数据 - 调用 Java 后端
 * POST /api/users/getPageList
 * @param params 查询参数
 * @param params.tabType 标签页类型: 'recent' | 'review' | 'publish'
 */
export const getPageList = async (params: TrainingPerformancePageReqVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/pageList`,
    data: params
  })
}

// 获取文档分类列表
export const getDocCategories = async () => {
  return await request.get({
    url: `${BASE_URL}/training/performance/categories`
  })
}

// 创建演训方案 (Mock)
export const createTrainingPerformance = async (data: TrainingPerformanceVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/create`,
    data
  })
}

// 新建筹划方案 - 调用 Java 后端
export const createNewData = async (data: TrainingPerformanceVO) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/newData`,
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

/**
 * 编辑演训方案数据
 * 调用 Java 后端: POST /api/tbTemplate/update
 * @param data 更新数据
 */
export const updatePerformanceData = async (data: any) => {
  return await request.post({
    url: `${BASE_URL}/training/performance/editData`,
    data
  })
}

// 删除演训方案
export const deleteTrainingPerformance = async (ids: number | number[]) => {
  const idsArray = isArray(ids) ? ids : [ids]
  return await request.delete({
    url: `${BASE_URL}/training/performance/delete`,
    data: idsArray
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

/**
 * 上传文档文件
 * 使用 template/management/saveFile 接口，调用 Java 后端 /api/tbTemplate/saveFile
 * @param data 上传数据 { file, id? }
 * @returns 返回 fileId
 */
export const uploadDocument = async (data: UploadDocumentData) => {
  const formData = new FormData()
  // id 参数可选，不传也可以
  if (data.id) {
    formData.append('id', data.id)
  }
  formData.append('file', data.file)

  return await request.post({
    url: `${BASE_URL}/template/management/saveFile`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
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
          if (isNil(json.data) || json.code !== 0) {
            return null
          }
        } catch {
          // 不是有效的 JSON，当作二进制数据处理
        }
      }
      return response
    }

    // 如果不是 Blob，尝试检查是否是 ArrayBuffer 或其他二进制数据
    if (!isNil(response) && (response as any).data instanceof Blob) {
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
