/**
 * 模板管理 API 类型定义
 */

// 模板数据接口
export interface TemplateVO {
  id?: number | string // id
  fileId?: string // 文件id
  templateName: string // 模板名称
  temCategory: string // 模板分类
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
  temCategory?: string // 模板分类
  temSubclass?: string // 模板子类
  createTime?: string // 日期范围，格式："2025-12-10, 2025-12-11"
  tabType?: string // 切换状态: 'recent' | 'review' | 'publish'
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
