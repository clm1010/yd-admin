/**
 * 文档 API 服务
 * 通过环境变量配置后端地址
 * 开发环境: http://localhost:3001
 * 生产环境: http://192.168.8.100:3001
 */
import axios from 'axios'

// 创建专用的 axios 实例，直接连接到文档协作后端
const documentRequest = axios.create({
  baseURL: `${import.meta.env.VITE_COLLABORATION_API_URL || 'http://localhost:3001'}/api/document`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 文档信息接口
export interface DocumentInfo {
  id: string
  title: string
  content?: string
  createTime: string
  updateTime: string
  version: string
  tags: string[]
  creatorId: number
  creatorName: string
}

// 文档保存参数
export interface SaveDocumentParams {
  id: string
  title?: string
  content: string
  creatorId?: number
  creatorName?: string
}

// 参考素材
export interface ReferenceMaterial {
  id: number
  title: string
  date: string
  author: string
  content: string
}

// API 响应格式
interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

/**
 * 保存文档
 * @param params 保存参数
 */
export const saveDocument = async (params: SaveDocumentParams): Promise<DocumentInfo> => {
  try {
    const res = await documentRequest.post<ApiResponse<DocumentInfo>>('/save', params)
    return res.data.data
  } catch (error) {
    console.error('保存文档失败:', error)
    throw error
  }
}

/**
 * 删除文档
 * @param docId 文档ID
 */
export const deleteDocument = async (docId: string): Promise<boolean> => {
  try {
    await documentRequest.delete(`/${docId}`)
    return true
  } catch (error) {
    console.error('删除文档失败:', error)
    throw error
  }
}

/**
 * 获取文档列表
 */
export const getDocumentList = async (): Promise<DocumentInfo[]> => {
  try {
    const res = await documentRequest.get<ApiResponse<DocumentInfo[]>>('/list/all')
    return res.data.data
  } catch (error) {
    console.error('获取文档列表失败:', error)
    return []
  }
}

/**
 * 获取参考素材列表
 * 调用 NestJS 中间层: POST /api/document/:id/materials
 * 中间层代理调用 Java 后端: POST /api/users/getMaterial
 * @param docId 文档ID
 */
export const getReferenceMaterials = async (docId: string): Promise<ReferenceMaterial[]> => {
  try {
    const res = await documentRequest.post<ApiResponse<ReferenceMaterial[]>>(`/${docId}/materials`)
    return res.data.data || []
  } catch (error) {
    console.error('获取参考素材失败:', error)
    return []
  }
}

/**
 * 导出文档为 HTML
 * @param title 文档标题
 * @param content 文档内容
 */
export const exportDocumentHtml = async (title: string, content: string): Promise<Blob> => {
  try {
    const res = await documentRequest.post(
      '/export/html',
      { title, content },
      {
        responseType: 'blob'
      }
    )
    return res.data
  } catch (error) {
    console.error('导出 HTML 失败:', error)
    throw error
  }
}

/**
 * 导出文档为 JSON
 * @param id 文档ID
 * @param title 文档标题
 * @param content 文档内容
 */
export const exportDocumentJson = async (
  id: string,
  title: string,
  content: string
): Promise<Blob> => {
  try {
    const res = await documentRequest.post(
      '/export/json',
      { id, title, content },
      {
        responseType: 'blob'
      }
    )
    return res.data
  } catch (error) {
    console.error('导出 JSON 失败:', error)
    throw error
  }
}

/**
 * 保存文档响应接口
 */
export interface SaveDocumentFileResponse {
  code: number
  data: any
  status: number
  msg?: string
}

/**
 * 保存文档文件到后端
 * 调用 /api/document/saveDocument 接口
 * @param id 文档ID
 * @param file Blob 文件流
 * @param filename 文件名（可选）
 */
export const saveDocumentFile = async (
  id: string,
  file: Blob,
  filename: string = 'document.docx'
): Promise<SaveDocumentFileResponse> => {
  try {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('file', file, filename)

    const res = await documentRequest.post<SaveDocumentFileResponse>('/saveDocument', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 文件上传超时设为 60 秒
    })

    console.log('保存文档响应:', res.data)
    return res.data
  } catch (error) {
    console.error('保存文档失败:', error)
    throw error
  }
}
