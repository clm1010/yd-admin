import request from '@/config/axios'

// 模板数据接口
export interface TemplateVO {
  id?: number
  name: string // 模板名称
  subCategory: string // 模板子类
  status: string // 模板状态：启用/禁用
  description?: string // 描述
  uploadTime?: string // 上传时间
  creator?: string // 创建人
  auditStatus?: string // 审核状态：待提交/审核中/审核通过/审核驳回
  createTime?: string // 创建时间
}

// 查询参数接口
export interface TemplatePageReqVO extends PageParam {
  name?: string // 模板名称
  category?: string // 模板分类
  dateRange?: string[] // 日期范围
  tabType?: string // 标签页类型: 'recent' | 'review' | 'publish'
}

// 模板分类接口
export interface TemplateCategoryVO {
  id: string
  name: string
}

// 提交审核参数接口
export interface SubmitAuditReqVO {
  id: number
  auditor: string
  comment?: string
}

// 导入模板参数接口
export interface ImportTemplateData {
  file: File
}

// collaborative-middleware 服务的基础 URL
const BASE_URL = `${import.meta.env.VITE_COLLABORATION_API_URL || 'http://localhost:3001'}/api`

/**
 * 获取分页列表数据
 * @param params 查询参数
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
 * @param data 模板数据
 */
export const createTemplate = async (data: TemplateVO) => {
  return await request.post({
    url: `${BASE_URL}/template/management/create`,
    data
  })
}

/**
 * 更新模板
 * @param data 模板数据
 */
export const updateTemplate = async (data: TemplateVO) => {
  return await request.put({
    url: `${BASE_URL}/template/management/update`,
    data
  })
}

/**
 * 删除模板
 * @param id 模板ID
 */
export const deleteTemplate = async (id: number) => {
  return await request.delete({
    url: `${BASE_URL}/template/management/delete`,
    data: { ids: [id] }
  })
}

/**
 * 批量删除模板
 * @param ids 模板ID数组
 */
export const batchDeleteTemplate = async (ids: number[]) => {
  return await request.delete({
    url: `${BASE_URL}/template/management/delete`,
    data: { ids }
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
 * 导入模板
 * @param data 导入数据
 */
export const importTemplate = async (data: ImportTemplateData) => {
  const formData = new FormData()
  formData.append('file', data.file)

  return await request.post({
    url: `${BASE_URL}/template/management/import`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
