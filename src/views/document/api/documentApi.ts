/**
 * 文档 API 服务
 * 直接与后端 localhost:3001 通讯
 */
import axios from 'axios'

// 创建专用的 axios 实例，直接连接到文档协作后端
const documentRequest = axios.create({
  baseURL: 'http://localhost:3001/api/document',
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

// 文档协作者信息
export interface Collaborator {
  userId: number
  nickname: string
  avatar: string
  role: string
  addTime?: string
  isSelf?: boolean
  isOwner?: boolean
  joinTime?: number
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
 * 获取文档详情
 * @param docId 文档ID
 */
export const getDocument = async (docId: string): Promise<DocumentInfo> => {
  try {
    const res = await documentRequest.get<ApiResponse<DocumentInfo>>(`/${docId}`)
    return res.data.data
  } catch (error) {
    console.error('获取文档失败:', error)
    // 返回默认文档
    return {
      id: docId,
      title: '新文档',
      content: '<p></p>',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      version: 'V1.0',
      tags: [],
      creatorId: 1,
      creatorName: '用户'
    }
  }
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
 * 获取文档协作者列表
 * @param docId 文档ID
 */
export const getDocumentCollaborators = async (docId: string): Promise<Collaborator[]> => {
  try {
    const res = await documentRequest.get<ApiResponse<Collaborator[]>>(`/${docId}/collaborators`)
    return res.data.data
  } catch (error) {
    console.error('获取协作者列表失败:', error)
    return []
  }
}

/**
 * 添加文档协作者
 * @param docId 文档ID
 * @param collaborator 协作者信息
 */
export const addCollaborator = async (
  docId: string,
  collaborator: { userId: number; nickname?: string; avatar?: string; role?: string }
): Promise<Collaborator> => {
  try {
    const res = await documentRequest.post<ApiResponse<Collaborator>>(
      `/${docId}/collaborators`,
      collaborator
    )
    return res.data.data
  } catch (error) {
    console.error('添加协作者失败:', error)
    throw error
  }
}

/**
 * 移除文档协作者
 * @param docId 文档ID
 * @param userId 用户ID
 */
export const removeCollaborator = async (docId: string, userId: number): Promise<boolean> => {
  try {
    await documentRequest.delete(`/${docId}/collaborators/${userId}`)
    return true
  } catch (error) {
    console.error('移除协作者失败:', error)
    throw error
  }
}

/**
 * 获取参考素材列表
 * @param docId 文档ID
 */
export const getReferenceMaterials = async (docId: string): Promise<ReferenceMaterial[]> => {
  try {
    const res = await documentRequest.get<ApiResponse<ReferenceMaterial[]>>(`/${docId}/materials`)
    return res.data.data
  } catch (error) {
    console.error('获取参考素材失败:', error)
    return []
  }
}

/**
 * 添加参考素材
 * @param docId 文档ID
 * @param material 素材信息
 */
export const addReferenceMaterial = async (
  docId: string,
  material: { title: string; content: string; author?: string }
): Promise<ReferenceMaterial> => {
  try {
    const res = await documentRequest.post<ApiResponse<ReferenceMaterial>>(
      `/${docId}/materials`,
      material
    )
    return res.data.data
  } catch (error) {
    console.error('添加参考素材失败:', error)
    throw error
  }
}

/**
 * 删除参考素材
 * @param docId 文档ID
 * @param materialId 素材ID
 */
export const deleteReferenceMaterial = async (
  docId: string,
  materialId: number
): Promise<boolean> => {
  try {
    await documentRequest.delete(`/${docId}/materials/${materialId}`)
    return true
  } catch (error) {
    console.error('删除参考素材失败:', error)
    throw error
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
