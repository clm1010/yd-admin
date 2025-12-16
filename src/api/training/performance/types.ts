/**
 * 演训方案 API 类型定义
 */

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

// 上传文档参数接口
export interface UploadDocumentData {
  id?: string // 文档ID（可选）
  file: File // 文件对象
}
