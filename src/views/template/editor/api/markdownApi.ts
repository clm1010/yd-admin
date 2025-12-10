/**
 * Markdown 文档 API 服务
 * 通过环境变量配置后端地址
 * 开发环境: http://localhost:3001
 * 生产环境: http://192.168.8.100:3001
 */
import axios from 'axios'

// 创建专用的 axios 实例，直接连接到 Markdown 协作后端
const markdownRequest = axios.create({
  baseURL: `${import.meta.env.VITE_COLLABORATION_API_URL || 'http://localhost:3001'}/api/markdown`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Markdown 文档信息接口
export interface MarkdownDocumentInfo {
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

// Markdown 文档保存参数
export interface SaveMarkdownParams {
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
 * 获取 Markdown 文档
 * @param docId 文档ID
 */
export const getMarkdownDocument = async (docId: string): Promise<MarkdownDocumentInfo> => {
  try {
    const res = await markdownRequest.get<ApiResponse<MarkdownDocumentInfo>>(`/${docId}`)
    return res.data.data
  } catch (error) {
    console.error('获取 Markdown 文档失败:', error)
    throw error
  }
}

/**
 * 保存 Markdown 文档
 * @param params 保存参数
 */
export const saveMarkdownDocument = async (
  params: SaveMarkdownParams
): Promise<MarkdownDocumentInfo> => {
  try {
    const res = await markdownRequest.post<ApiResponse<MarkdownDocumentInfo>>('/save', params)
    return res.data.data
  } catch (error) {
    console.error('保存 Markdown 文档失败:', error)
    throw error
  }
}

/**
 * 删除 Markdown 文档
 * @param docId 文档ID
 */
export const deleteMarkdownDocument = async (docId: string): Promise<boolean> => {
  try {
    await markdownRequest.delete(`/${docId}`)
    return true
  } catch (error) {
    console.error('删除 Markdown 文档失败:', error)
    throw error
  }
}

/**
 * 获取 Markdown 文档列表
 */
export const getMarkdownDocumentList = async (): Promise<MarkdownDocumentInfo[]> => {
  try {
    const res = await markdownRequest.get<ApiResponse<MarkdownDocumentInfo[]>>('/list/all')
    return res.data.data
  } catch (error) {
    console.error('获取 Markdown 文档列表失败:', error)
    return []
  }
}

/**
 * 获取参考素材列表
 * 调用 NestJS 中间层: POST /api/markdown/:id/materials
 * 中间层代理调用 Java 后端: POST /api/users/getMaterial
 * @param docId 文档ID
 */
export const getReferenceMaterials = async (docId: string): Promise<ReferenceMaterial[]> => {
  try {
    const res = await markdownRequest.post<ApiResponse<ReferenceMaterial[]>>(`/${docId}/materials`)
    return res.data.data || []
  } catch (error) {
    console.error('获取参考素材失败:', error)
    return []
  }
}

/**
 * 导出 Markdown 文档为 HTML
 * @param title 文档标题
 * @param content 文档内容
 */
export const exportMarkdownHtml = async (title: string, content: string): Promise<Blob> => {
  try {
    const res = await markdownRequest.post(
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
 * 导出 Markdown 文档为 JSON
 * @param id 文档ID
 * @param title 文档标题
 * @param content 文档内容
 */
export const exportMarkdownJson = async (
  id: string,
  title: string,
  content: string
): Promise<Blob> => {
  try {
    const res = await markdownRequest.post(
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
 * 保存 Markdown 文件响应接口
 */
export interface SaveMarkdownFileResponse {
  code: number
  data: any
  status: number
  msg?: string
}

/**
 * 保存 Markdown 文件到后端
 * 调用 /api/markdown/saveDocument 接口
 * @param id 文档ID
 * @param file Blob 文件流
 * @param filename 文件名（可选）
 */
export const saveMarkdownFile = async (
  id: string,
  file: Blob,
  filename: string = 'document.md'
): Promise<SaveMarkdownFileResponse> => {
  try {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('file', file, filename)

    const res = await markdownRequest.post<SaveMarkdownFileResponse>('/saveDocument', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 文件上传超时设为 60 秒
    })

    console.log('保存 Markdown 文档响应:', res.data)
    return res.data
  } catch (error) {
    console.error('保存 Markdown 文档失败:', error)
    throw error
  }
}

/**
 * 提交审核
 * @param params 审核参数
 */
export const submitAudit = async (params: {
  id: string
  auditor: string
  comment?: string
}): Promise<any> => {
  try {
    const res = await markdownRequest.post<ApiResponse<any>>('/submitAudit', params)
    return res.data.data
  } catch (error) {
    console.error('提交审核失败:', error)
    throw error
  }
}

