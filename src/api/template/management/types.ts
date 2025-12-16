/**
 * 模板管理 API 类型定义
 */

// 审核状态枚举（编辑中:1、审核中:2、审核通过:3、发布:4、驳回:5）
export enum AuditStatusEnum {
  EDITING = '1', // 编辑中
  REVIEWING = '2', // 审核中
  APPROVED = '3', // 审核通过
  PUBLISHED = '4', // 发布
  REJECTED = '5' // 驳回
}

// 审核状态文本映射
export const AuditStatusTextMap: Record<string, string> = {
  '1': '编辑中',
  '2': '审核中',
  '3': '审核通过',
  '4': '发布',
  '5': '驳回'
}

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
  auditStatus?: string // 审核状态：1-编辑中/2-审核中/3-审核通过/4-发布/5-驳回
  flowId?: string // 审核流程ID
}

// 查询参数接口
export interface TemplatePageReqVO extends PageParam {
  templateName?: string // 模板名称
  temCategory?: string // 模板分类
  temSubclass?: string // 模板子类
  createTime?: string // 日期范围，格式："2025-12-10, 2025-12-11"
  tabType?: string // 切换状态: 'recent' | 'review' | 'publish'
  auditStatus?: string // 审核状态
}

// 审核节点接口
export interface AuditNodeVO {
  nodeId: string // 节点ID
  nodeName: string // 节点名称
  users: string[] // 节点用户列表
}

// 审核流程接口
export interface AuditFlowVO {
  flowId: string // 流程ID
  flowName: string // 流程名称
  nodes: AuditNodeVO[] // 流程节点列表
}

// 提交审核参数接口
export interface SubmitAuditReqVO {
  id: number | string
  flowId: string // 流程ID
  auditors: Record<string, string[]> // 节点审核人 { node1: ['user1'], node2: ['user2', 'user3'] }
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

// 审核记录接口 - GET /examRecord/examApply 返回参数
export interface ExamRecordVO {
  id: number | string // 记录ID
  apply: string // 记录id（关联apply）
  examNode: string // 审核节点
  examResult: string // 审核结果 1通过 2驳回
  examOpinion: string // 审核意见
  examOffice: string // 审核部门id
  examUserid: string // 审批用户id
  nextUserid: string // 下一审批用户id
  examofficeName: string // 审核部门名称
  createTime?: string // 创建时间
}

// 审核结果枚举
export enum ExamResultEnum {
  PASS = '1', // 通过
  REJECT = '2' // 驳回
}

// 审核结果文本映射
export const ExamResultTextMap: Record<string, string> = {
  '1': '通过',
  '2': '驳回'
}

// 审核/驳回操作请求接口 - POST /examRecord/examTem
export interface ExamApplyReqVO {
  apply: number | string // 当前数据id
  examResult: string // 审核结果 1通过 2驳回
  examOpinion: string // 审核意见/驳回原因
  examuserId: string // 审批用户id
}
