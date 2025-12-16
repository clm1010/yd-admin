/**
 * 模板管理 API
 * 支持 Mock/Java 后端统一切换
 *
 * 切换方式：设置环境变量 VITE_USE_MOCK=true/false
 */
import { USE_MOCK } from '@/config/apiConfig'
import { javaRequest } from '@/config/axios/javaService'
import {
  templateCategories,
  type TemplateCategoryVO
} from '@/views/template/management/config/categories'

// 导出类型定义
export * from './types'
export type { TemplateCategoryVO }

// 导入类型
import type {
  TemplateVO,
  TemplatePageReqVO,
  SubmitAuditReqVO,
  ImportTemplateData,
  PermissionCheckReqVO,
  PermissionCheckResponse
} from './types'

// ==================== Java 后端 API 实现 ====================

const javaApi = {
  /**
   * 获取分页列表数据 - Java 后端
   */
  getPageList: async (params: TemplatePageReqVO) => {
    return await javaRequest.post('/tbTemplate/getPageList', params)
  },

  /**
   * 获取模板分类列表
   */
  getCategories: async (): Promise<{ data: TemplateCategoryVO[] }> => {
    return Promise.resolve({ data: templateCategories })
  },

  /**
   * 创建模板 - Java 后端
   */
  savaTemplate: async (data: TemplateVO) => {
    const requestData: any = {
      templateName: data.templateName,
      temSubclass: data.temSubclass,
      temStatus: data.temStatus === '启用' ? '0' : '1',
      description: data.description || ''
    }
    if (data.fileId) {
      requestData.fileId = data.fileId
    }
    return await javaRequest.post('/tbTemplate/savaTemplate', requestData)
  },

  /**
   * 更新模板 - Java 后端
   */
  updateTemplate: async (data: TemplateVO) => {
    const requestData = {
      id: data.id,
      templateName: data.templateName,
      temSubclass: data.temSubclass,
      temStatus: data.temStatus === '启用' ? '0' : '1',
      description: data.description || ''
    }
    return await javaRequest.post('/tbTemplate/editData', requestData)
  },

  /**
   * 删除模板 - Java 后端
   */
  deleteTemplate: async (id: number | string) => {
    return await javaRequest.post('/tbTemplate/delList', [String(id)])
  },

  /**
   * 批量删除模板 - Java 后端
   */
  batchDeleteTemplate: async (ids: (number | string)[]) => {
    return await javaRequest.post(
      '/api/tbTemplate/delList',
      ids.map((id) => String(id))
    )
  },

  /**
   * 提交审核
   */
  submitAudit: async (data: SubmitAuditReqVO) => {
    console.log('提交审核:', data)
    return Promise.resolve({ success: true, message: '提交审核成功' })
  },

  /**
   * 写作权限校验 - Java 后端
   */
  checkWritePermission: async (data: PermissionCheckReqVO): Promise<PermissionCheckResponse> => {
    return await javaRequest.postOriginal('/tbTemplate/getPermissionCheck', data)
  },

  /**
   * 获取模板文件流 - Java 后端
   */
  getFileStream: async (id: string): Promise<Blob | null> => {
    try {
      const response = await javaRequest.download('/tbTemplate/getfileStream', { id })
      if (response instanceof Blob && response.size > 0) {
        if (response.type.includes('application/json')) {
          const text = await response.text()
          try {
            const json = JSON.parse(text)
            if (json.data === null || json.code !== 200) {
              return null
            }
          } catch {
            // 不是有效的 JSON，当作二进制数据处理
          }
        }
        return response
      }
      return null
    } catch (error) {
      console.error('获取文件流失败:', error)
      return null
    }
  },

  /**
   * 上传文档文件 - Java 后端
   */
  saveDocument: async (data: ImportTemplateData) => {
    const formData = new FormData()
    formData.append('file', data.file)
    return await javaRequest.upload('/tbTemplate/saveFile', formData)
  },

  /**
   * 保存模板文件（带 ID） - Java 后端
   */
  saveTemplateFile: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('file', file)
    return await javaRequest.upload('/tbTemplate/saveFile', formData)
  }
}

// ==================== Mock API 实现 ====================
// Mock API 返回格式与 Java 后端响应拦截器处理后的格式保持一致

const mockApi = {
  getPageList: async (params: TemplatePageReqVO) => {
    const { getPageList } = await import('@/mock/template/management')
    const res = await getPageList(params)
    // 返回 data 部分，与 javaRequest 响应拦截器处理后格式一致
    return res.data
  },

  getCategories: async (): Promise<{ data: TemplateCategoryVO[] }> => {
    const { getCategories } = await import('@/mock/template/management')
    return getCategories()
  },

  savaTemplate: async (data: TemplateVO) => {
    const { savaTemplate } = await import('@/mock/template/management')
    const res = await savaTemplate(data)
    return res
  },

  updateTemplate: async (data: TemplateVO) => {
    const { updateTemplate } = await import('@/mock/template/management')
    const res = await updateTemplate(data)
    return res
  },

  deleteTemplate: async (id: number | string) => {
    const { deleteTemplate } = await import('@/mock/template/management')
    const res = await deleteTemplate(id)
    return res.data
  },

  batchDeleteTemplate: async (ids: (number | string)[]) => {
    const { batchDeleteTemplate } = await import('@/mock/template/management')
    const res = await batchDeleteTemplate(ids)
    return res.data
  },

  submitAudit: async (data: SubmitAuditReqVO) => {
    const { submitAudit } = await import('@/mock/template/management')
    return submitAudit(data)
  },

  checkWritePermission: async (data: PermissionCheckReqVO): Promise<PermissionCheckResponse> => {
    const { checkWritePermission } = await import('@/mock/template/management')
    return checkWritePermission(data)
  },

  getFileStream: async (id: string): Promise<Blob | null> => {
    const { getFileStream } = await import('@/mock/template/management')
    return getFileStream(id)
  },

  saveDocument: async (data: ImportTemplateData) => {
    const { saveDocument } = await import('@/mock/template/management')
    const res = await saveDocument(data)
    return res
  },

  saveTemplateFile: async (id: string, file: File) => {
    const { saveTemplateFile } = await import('@/mock/template/management')
    const res = await saveTemplateFile(id, file)
    return res
  }
}

// ==================== 统一导出 API (自动切换) ====================

// 选择使用的 API 实现
const api = USE_MOCK ? mockApi : javaApi

/**
 * 获取分页列表数据
 * @param params 查询参数 { pageNo, pageSize, tabType: 'recent' | 'review' | 'publish' }
 */
export const getPageList = api.getPageList

/**
 * 获取模板分类列表
 */
export const getCategories = api.getCategories

/**
 * 创建模板
 * @param data 模板数据 { templateName, temSubclass, temStatus, description, fileId? }
 */
export const savaTemplate = api.savaTemplate

/**
 * 更新模板
 * @param data 模板数据 { id, templateName, temSubclass, temStatus, description }
 */
export const updateTemplate = api.updateTemplate

/**
 * 删除模板
 * @param id 模板ID
 */
export const deleteTemplate = api.deleteTemplate

/**
 * 批量删除模板
 * @param ids 模板ID数组
 */
export const batchDeleteTemplate = api.batchDeleteTemplate

/**
 * 提交审核
 * @param data 审核数据
 */
export const submitAudit = api.submitAudit

/**
 * 写作权限校验
 * @param data.id 模板ID
 * @param data.userId 用户ID
 * @returns 权限校验结果
 */
export const checkWritePermission = api.checkWritePermission

/**
 * 获取模板文件流
 * @param id 模板ID
 * @returns 文件流数据 (Blob)
 */
export const getFileStream = api.getFileStream

/**
 * 上传文档文件
 * @param data 上传数据 { file }
 * @returns 返回 fileId
 */
export const saveDocument = api.saveDocument

/**
 * 保存模板文件（带 ID）
 * @param id 模板ID
 * @param file 文件对象
 * @returns 保存结果
 */
export const saveTemplateFile = api.saveTemplateFile

// 重新导出分类配置
export { templateCategories } from '@/views/template/management/config/categories'
