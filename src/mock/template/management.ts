/**
 * 模板管理 Mock 数据和 API
 * 用于开发调试，可通过配置切换到 Java 后端
 */
import type {
  TemplateVO,
  TemplatePageReqVO,
  SubmitAuditReqVO,
  ImportTemplateData,
  PermissionCheckReqVO,
  PermissionCheckResponse,
  ExamRecordVO,
  ExamApplyReqVO,
  PublishDocReqVO
} from '@/api/template/management/types'
import {
  templateCategories,
  type TemplateCategoryVO
} from '@/views/template/management/config/categories'

// ==================== Mock 数据 ====================

/**
 * 审核状态枚举（编辑中:1、审核中:2、审核通过:3、发布:4、驳回:5）
 */
const AuditStatus = {
  EDITING: '1', // 编辑中
  REVIEWING: '2', // 审核中
  APPROVED: '3', // 审核通过
  PUBLISHED: '4', // 发布
  REJECTED: '5' // 驳回
}

/**
 * 模拟延迟（模拟网络请求）
 */
const mockDelay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 生成模拟 ID
 */
let mockIdCounter = 100
const generateMockId = () => ++mockIdCounter

/**
 * 模拟模板数据列表
 */
const mockDataList: TemplateVO[] = [
  {
    id: '1',
    fileId: 'file-001',
    templateName: '作战命令模板',
    temCategory: '筹划文档',
    temSubclass: '文档模板',
    temStatus: '启用',
    description: '用于生成标准作战命令文档',
    createTime: '2024-12-10 09:30:00',
    createBy: 'admin',
    applyNode: AuditStatus.APPROVED // 审核通过
  },
  {
    id: '2',
    fileId: 'file-002',
    templateName: '演训方案模板',
    temCategory: '筹划文档',
    temSubclass: '演训方案',
    temStatus: '启用',
    description: '标准演训方案编写模板',
    createTime: '2024-12-08 10:00:00',
    createBy: 'staff_a',
    applyNode: AuditStatus.REVIEWING // 审核中
  },
  {
    id: '3',
    fileId: 'file-003',
    templateName: '作战计划模板',
    temCategory: '筹划文档',
    temSubclass: '作战计划',
    temStatus: '禁用',
    description: '作战计划编制标准模板',
    createTime: '2024-12-05 08:30:00',
    createBy: 'staff_b',
    applyNode: AuditStatus.EDITING // 编辑中
  },
  {
    id: '4',
    fileId: 'file-004',
    templateName: '编组模板-联合作战',
    temCategory: '筹划文档',
    temSubclass: '编组模板',
    temStatus: '启用',
    description: '联合作战编组标准模板',
    createTime: '2024-12-01 14:00:00',
    createBy: 'admin',
    applyNode: AuditStatus.PUBLISHED // 发布
  },
  {
    id: '5',
    fileId: 'file-005',
    templateName: '总结报告模板',
    temCategory: '筹划文档',
    temSubclass: '总结报告',
    temStatus: '启用',
    description: '演训总结报告编写模板',
    createTime: '2024-11-28 11:30:00',
    createBy: 'staff_a',
    applyNode: AuditStatus.REJECTED // 驳回
  },
  {
    id: '6',
    fileId: 'file-006',
    templateName: '导调计划模板',
    temCategory: '筹划文档',
    temSubclass: '导调计划',
    temStatus: '启用',
    description: '标准导调计划编制模板',
    createTime: '2024-11-25 09:00:00',
    createBy: 'admin',
    applyNode: AuditStatus.APPROVED // 审核通过
  }
]

/**
 * 模拟审核记录数据
 * 审核结果: 1通过 2驳回
 */
const mockExamRecordList: Record<string | string, ExamRecordVO[]> = {
  1: [
    {
      id: 'exam-t001',
      applyId: 'apply-t001',
      examNode: '节点1',
      examResult: '1',
      examOpinion: '模板规范，审核通过',
      examOffice: 'office-001',
      examUserId: 'user1',
      nextUserId: 'user2',
      examOfficeName: '模板管理部',
      createTime: '2024-12-08 10:00:00'
    },
    {
      id: 'exam-t002',
      applyId: 'apply-t001',
      examNode: '节点2',
      examResult: '1',
      examOpinion: '内容完整，同意通过',
      examOffice: 'office-002',
      examUserId: 'user2',
      nextUserId: '',
      examOfficeName: '审核部',
      createTime: '2024-12-09 14:30:00'
    }
  ],
  2: [
    {
      id: 'exam-t003',
      applyId: 'apply-t002',
      examNode: '节点1',
      examResult: '1',
      examOpinion: '初审通过',
      examOffice: 'office-001',
      examUserId: 'user1',
      nextUserId: 'user2',
      examOfficeName: '模板管理部',
      createTime: '2024-12-07 09:00:00'
    }
  ],
  4: [
    {
      id: 'exam-t004',
      applyId: 'apply-t003',
      examNode: '节点1',
      examResult: '1',
      examOpinion: '审核通过',
      examOffice: 'office-001',
      examUserId: 'user1',
      nextUserId: 'user2',
      examOfficeName: '模板管理部',
      createTime: '2024-11-28 10:00:00'
    },
    {
      id: 'exam-t005',
      applyId: 'apply-t003',
      examNode: '节点2',
      examResult: '1',
      examOpinion: '模板可用，同意发布',
      examOffice: 'office-002',
      examUserId: 'user2',
      nextUserId: '',
      examOfficeName: '审核部',
      createTime: '2024-11-29 15:00:00'
    }
  ],
  6: [
    {
      id: 'exam-t006',
      applyId: 'apply-t004',
      examNode: '节点1',
      examResult: '1',
      examOpinion: '格式规范',
      examOffice: 'office-001',
      examUserId: 'user1',
      nextUserId: 'user2',
      examOfficeName: '模板管理部',
      createTime: '2024-11-22 10:00:00'
    },
    {
      id: 'exam-t007',
      applyId: 'apply-t004',
      examNode: '节点2',
      examResult: '1',
      examOpinion: '同意',
      examOffice: 'office-002',
      examUserId: 'user2',
      nextUserId: '',
      examOfficeName: '审核部',
      createTime: '2024-11-23 11:00:00'
    }
  ]
}

// ==================== Mock API 实现 ====================

/**
 * 获取分页列表数据
 */
export const getPageList = async (params: TemplatePageReqVO) => {
  await mockDelay()

  let filteredList = [...mockDataList]

  // 按模板名称筛选
  if (params.templateName) {
    filteredList = filteredList.filter((item) =>
      item.templateName.toLowerCase().includes(params.templateName!.toLowerCase())
    )
  }

  // 按模板子类筛选
  if (params.temSubclass) {
    filteredList = filteredList.filter((item) => item.temSubclass === params.temSubclass)
  }

  // 按标签页类型筛选
  // tabType=recent: 显示全部数据
  // tabType=review: 只显示审核中(2)和审核通过(3)
  // tabType=publish: 只显示发布(4)
  if (params.tabType === 'review') {
    filteredList = filteredList.filter((item) =>
      [AuditStatus.REVIEWING, AuditStatus.APPROVED].includes(item.applyNode || '')
    )
  } else if (params.tabType === 'publish') {
    filteredList = filteredList.filter((item) => item.applyNode === AuditStatus.PUBLISHED)
  }

  // 分页
  const pageNo = params.pageNo || 1
  const pageSize = params.pageSize || 10
  const startIndex = (pageNo - 1) * pageSize
  const endIndex = startIndex + pageSize
  const list = filteredList.slice(startIndex, endIndex)

  return {
    code: 200,
    data: {
      records: list,
      total: filteredList.length
    },
    msg: 'success'
  }
}

/**
 * 获取模板分类列表
 */
export const getCategories = async (): Promise<{ data: TemplateCategoryVO[] }> => {
  await mockDelay(100)
  return { data: templateCategories }
}

/**
 * 创建模板
 */
export const savaTemplate = async (data: TemplateVO) => {
  await mockDelay()

  const newItem: TemplateVO = {
    ...data,
    id: String(generateMockId()),
    temStatus: data.temStatus === '启用' ? '启用' : '禁用',
    applyNode: AuditStatus.EDITING, // 编辑中
    createTime: new Date().toLocaleString('zh-CN'),
    createBy: 'admin'
  }

  mockDataList.unshift(newItem)

  return {
    code: 200,
    data: newItem,
    msg: '创建成功'
  }
}

/**
 * 更新模板
 */
export const updateTemplate = async (data: TemplateVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => item.id === data.id)
  if (index !== -1) {
    mockDataList[index] = {
      ...mockDataList[index],
      ...data,
      temStatus: data.temStatus === '启用' ? '启用' : '禁用'
    }

    return {
      code: 200,
      data: mockDataList[index],
      msg: '更新成功'
    }
  }

  return {
    code: 500,
    data: null,
    msg: '数据不存在'
  }
}

/**
 * 删除模板
 */
export const deleteTemplate = async (id: number | string) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => String(item.id) === String(id))
  if (index !== -1) {
    mockDataList.splice(index, 1)
    return {
      code: 200,
      data: null,
      msg: '删除成功'
    }
  }

  return {
    code: 500,
    data: null,
    msg: '数据不存在'
  }
}

/**
 * 批量删除模板
 */
export const batchDeleteTemplate = async (ids: (number | string)[]) => {
  await mockDelay()

  ids.forEach((id) => {
    const index = mockDataList.findIndex((item) => String(item.id) === String(id))
    if (index !== -1) {
      mockDataList.splice(index, 1)
    }
  })

  return {
    code: 200,
    data: null,
    msg: '批量删除成功'
  }
}

/**
 * 提交审核
 * @param data { id: number|string, flowId: string, auditors: Record<string, string[]>, comment?: string }
 */
export const submitAudit = async (data: SubmitAuditReqVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => String(item.id) === String(data.id))
  if (index !== -1) {
    mockDataList[index].applyNode = AuditStatus.REVIEWING // 审核中
    mockDataList[index].flowId = data.flowId

    return {
      code: 200,
      success: true,
      message: '提交审核成功'
    }
  }

  return {
    code: 500,
    success: false,
    message: '数据不存在'
  }
}

/**
 * 写作权限校验
 */
export const checkWritePermission = async (
  data: PermissionCheckReqVO
): Promise<PermissionCheckResponse> => {
  await mockDelay(100)

  // 模拟权限校验：admin 用户始终有权限
  const hasPermission = data.userId === 'admin' || Math.random() > 0.3

  return {
    code: 200,
    data: hasPermission,
    status: 200,
    msg: hasPermission ? '有编辑权限' : '无编辑权限'
  }
}

/**
 * 获取模板文件流
 */
export const getFileStream = async (_id: string): Promise<Blob | null> => {
  await mockDelay()

  // 模拟返回一个简单的文本文件
  const content = '# 模板内容\n\n这是模拟的模板文档内容，用于开发测试。\n\n## 第一章\n\n正文内容...'
  return new Blob([content], { type: 'text/plain' })
}

/**
 * 上传文档文件
 */
export const saveDocument = async (data: ImportTemplateData) => {
  await mockDelay(500)

  return {
    code: 200,
    data: {
      fileId: `mock-file-${Date.now()}`
    },
    msg: '上传成功'
  }
}

/**
 * 保存模板文件（带 ID）
 */
export const saveTemplateFile = async (_id: string, _file: File) => {
  await mockDelay(500)

  return {
    code: 200,
    data: {
      fileId: `mock-file-${Date.now()}`
    },
    msg: '保存成功'
  }
}

/**
 * 获取审核记录列表
 * GET /examRecord/examApply
 * @param id 当前表格数据id
 */
export const getExamRecordList = async (id: string): Promise<{ data: ExamRecordVO[] }> => {
  await mockDelay(200)
  return { data: mockExamRecordList[id] || [] }
}

/**
 * 审核/驳回操作
 * POST /examRecord/examTem
 * @param data { apply, examResult, examOpinion, examuserId }
 */
export const examApply = async (data: ExamApplyReqVO) => {
  await mockDelay(300)

  // 查找对应数据
  const index = mockDataList.findIndex((item) => String(item.id) === String(data.applyId))
  if (index !== -1) {
    // 更新审核状态
    if (data.examResult === '1') {
      // 审核通过
      mockDataList[index].applyNode = AuditStatus.APPROVED
    } else if (data.examResult === '2') {
      // 驳回
      mockDataList[index].applyNode = AuditStatus.REJECTED
    }

    return {
      code: 200,
      data: mockDataList[index],
      msg: data.examResult === '1' ? '审核通过' : '驳回成功'
    }
  }

  return {
    code: 500,
    data: null,
    msg: '数据不存在'
  }
}

/**
 * 发布模板
 * POST /tbTemplate/publishData
 * @param data { id, visibleScope }
 */
export const publishDocument = async (data: PublishDocReqVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => String(item.id) === String(data.id))
  if (index !== -1) {
    mockDataList[index].applyNode = AuditStatus.PUBLISHED // 发布

    return {
      code: 200,
      data: mockDataList[index],
      msg: '发布成功'
    }
  }

  return {
    code: 500,
    data: null,
    msg: '数据不存在'
  }
}

// 导出所有 Mock API
export default {
  getPageList,
  getCategories,
  savaTemplate,
  updateTemplate,
  deleteTemplate,
  batchDeleteTemplate,
  submitAudit,
  checkWritePermission,
  getFileStream,
  saveDocument,
  saveTemplateFile,
  getExamRecordList,
  examApply,
  publishDocument
}
