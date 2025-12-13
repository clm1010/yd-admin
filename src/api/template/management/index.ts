import request from '@/config/axios'
import { isNil } from 'lodash-es'

// 模板数据接口
export interface TemplateVO {
  id?: number | string // id
  fileId?: string // 文件id
  templateName: string // 模板名称
  temSubclass: string // 模板子类
  temStatus: string // 模板状态：启用/禁用
  description?: string // 描述
  createTime?: string // 创建时间
  createBy?: string // 创建人
  auditStatus?: string // 审核状态：待提交/审核中/审核通过/审核驳回
}

// 查询参数接口
export interface TemplatePageReqVO extends PageParam {
  templateName?: string // 模板名称
  temSubclass?: string // 模板子类
  createTime?: string // 日期范围，格式："2025-12-10, 2025-12-11"
  tabType?: string // 切换状态: 'recent' | 'review' | 'publish'
}

// 模板分类接口
export interface TemplateCategoryVO {
  id: string
  name: string
}

// 提交审核参数接口
export interface SubmitAuditReqVO {
  id: number | string
  auditor: string
  comment?: string
}

// 导入模板参数接口
export interface ImportTemplateData {
  file: File
}

// 权限校验请求接口
export interface PermissionCheckReqVO {
  id: string
  userId: string
}

// 权限校验响应接口
export interface PermissionCheckResponse {
  code: number
  data: boolean // true=有权限, false=无权限
  status: number // 200=正常, 500=异常
  msg?: string
}

// collaborative-middleware 服务的基础 URL
const BASE_URL = `${import.meta.env.VITE_COLLABORATION_API_URL || 'http://localhost:3001'}/api`

/**
 * 获取分页列表数据
 * 后端 Java: POST /api/tbTemplate/getPageList
 * 通过 collaborative-middleware 代理
 * @param params 查询参数 { pageNo, pageSize, tabType: 'recent' | 'review' | 'publish' }
 */
export const getPageList = async (params: TemplatePageReqVO) => {
  return await request.post({
    url: `${BASE_URL}/template/management/pageList`,
    data: params
  })
}

/**
 * 获取模板分类列表
 */
export const getCategories = async () => {
  return await request.get({
    url: `${BASE_URL}/template/management/categories`
  })
}

/**
 * 创建模板
 * 后端 Java: POST /api/tbTemplate/savaTemplate
 * 通过 collaborative-middleware 代理，参数自动转换
 * @param data 模板数据 { templateName, temSubclass, temStatus, description, fileId? }
 */
export const savaTemplate = async (data: TemplateVO) => {
  return await request.post({
    url: `${BASE_URL}/template/management/savaTemplate`,
    data
  })
}

/**
 * 更新模板（编辑数据）
 * 后端 Java: POST /api/tbTemplate/editData
 * 通过 collaborative-middleware 代理，参数自动转换
 * @param data 模板数据 { id, templateName, temSubclass, temStatus, description }
 */
export const updateTemplate = async (data: TemplateVO) => {
  return await request.put({
    url: `${BASE_URL}/template/management/update`,
    data
  })
}

/**
 * 删除模板
 * 后端 Java: POST /api/tbTemplate/delList
 * 参数格式: ["1"] - 直接传数组格式
 * @param id 模板ID
 */
export const deleteTemplate = async (id: number | string) => {
  return await request.delete({
    url: `${BASE_URL}/template/management/delete`,
    data: [String(id)]
  })
}

/**
 * 批量删除模板
 * 后端 Java: POST /api/tbTemplate/delList
 * 参数格式: ["1", "2", "3", "4", "5"] - 直接传数组格式
 * @param ids 模板ID数组
 */
export const batchDeleteTemplate = async (ids: (number | string)[]) => {
  return await request.delete({
    url: `${BASE_URL}/template/management/delete`,
    data: ids.map((id) => String(id))
  })
}

/**
 * 提交审核
 * @param data 审核数据
 */
export const submitAudit = async (data: SubmitAuditReqVO) => {
  return await request.post({
    url: `${BASE_URL}/template/management/audit/submit`,
    data
  })
}

/**
 * 上传文档文件
 * 调用 template/management/saveFile 接口，代理到 Java 后端 /api/tbTemplate/saveFile
 * @param data 上传数据 { file, id? }
 * @returns 返回 fileId
 */
export const saveDocument = async (data: ImportTemplateData) => {
  const formData = new FormData()
  formData.append('file', data.file)

  return await request.post({
    url: `${BASE_URL}/template/management/saveFile`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 写作权限校验
 * 调用中间件代理 -> Java 后端: POST /api/tbTemplate/getPermissionCheck
 * @param data.id 模板ID（表格中真实数据的id）
 * @param data.userId 用户ID（nanoid生成的）
 * @returns 权限校验结果
 */
export const checkWritePermission = async (
  data: PermissionCheckReqVO
): Promise<PermissionCheckResponse> => {
  return await request.post({
    url: `${BASE_URL}/template/management/getPermissionCheck`,
    data
  })
}

/**
 * 获取模板文件流
 * 调用中间件代理 -> Java 后端: GET /api/tbTemplate/getfileStream
 * @param id 模板ID
 * @returns 文件流数据 (Blob)
 */
export const getFileStream = async (id: string): Promise<Blob | null> => {
  try {
    // 使用 download 方法获取 blob
    const response = await request.download({
      url: `${BASE_URL}/template/management/getFileStream`,
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

    // 如果不是 Blob，尝试检查是否是包含 data 的响应
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
