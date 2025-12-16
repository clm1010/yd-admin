/**
 * 演训方案 Mock 数据和 API
 * 用于开发调试，可通过配置切换到 Java 后端
 */
import type {
  TrainingPerformanceVO,
  TrainingPerformancePageReqVO,
  SubmitAuditReqVO,
  PublishDocReqVO,
  RejectRecordVO,
  RejectReqVO,
  PermissionCheckResponse,
  checkWriteData,
  UploadDocumentData
} from '@/api/training/performance/types'
import {
  performanceCategories,
  type DocCategoryVO
} from '@/views/training/performance/config/categories'

// ==================== Mock 数据 ====================

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
 * 模拟演训方案数据列表
 */
const mockDataList: TrainingPerformanceVO[] = [
  {
    id: 1,
    drillDataId: 'drill-001',
    drillDataName: '2024年度联合作战演练',
    planName: '联合作战演练筹划方案',
    collegeCode: 'LHZZXY',
    fileType: '演训方案',
    activeUser: 'admin,staff_a',
    description: '本方案用于指导2024年度联合作战演练的组织实施',
    level: 'ZLJ',
    exerciseType: 'LHL',
    exerciseTheme: '联合作战',
    docType: 'doc',
    createBy: 'admin',
    applyNode: '编辑中',
    createTime: '2024-12-10 09:30:00',
    updateTime: '2024-12-12 14:20:00',
    delFlg: '0'
  },
  {
    id: 2,
    drillDataId: 'drill-002',
    drillDataName: '战略级演训项目',
    planName: '战略级综合演练方案',
    collegeCode: 'GFDX',
    fileType: '作战计划',
    activeUser: 'staff_b',
    description: '战略级综合演练的总体方案设计',
    level: 'ZLJ',
    exerciseType: 'ZUOZL',
    exerciseTheme: '战略演练',
    docType: 'doc',
    createBy: 'staff_b',
    applyNode: '待审核',
    createTime: '2024-12-08 10:00:00',
    updateTime: '2024-12-11 16:45:00',
    delFlg: '0'
  },
  {
    id: 3,
    drillDataId: 'drill-003',
    drillDataName: '网络安全演练',
    planName: '网络攻防演练实施方案',
    collegeCode: 'GJAQXY',
    fileType: '导调计划',
    activeUser: 'admin',
    description: '网络空间安全攻防演练方案',
    level: 'YXJ',
    exerciseType: 'WLL',
    exerciseTheme: '网络安全',
    docType: 'doc',
    createBy: 'admin',
    applyNode: '审核通过',
    createTime: '2024-12-05 08:30:00',
    updateTime: '2024-12-10 11:20:00',
    delFlg: '0'
  },
  {
    id: 4,
    drillDataId: 'drill-004',
    drillDataName: '后勤保障演练',
    planName: '联合勤务保障方案',
    collegeCode: 'LHQWXY',
    fileType: '作战文书',
    activeUser: 'staff_a,staff_b',
    description: '后勤保障体系综合演练方案',
    level: 'ZSJ',
    exerciseType: 'HZL',
    exerciseTheme: '后勤保障',
    docType: 'doc',
    createBy: 'staff_a',
    applyNode: '发布成功',
    createTime: '2024-12-01 14:00:00',
    updateTime: '2024-12-09 09:15:00',
    delFlg: '0'
  },
  {
    id: 5,
    drillDataId: 'drill-005',
    drillDataName: '电磁频谱管控演练',
    planName: '电磁环境管控方案',
    collegeCode: 'SGLXY',
    fileType: '企图立案',
    activeUser: 'admin',
    description: '复杂电磁环境下的频谱管控方案',
    level: 'YXJ',
    exerciseType: 'DCL',
    exerciseTheme: '电磁管控',
    docType: 'doc',
    createBy: 'admin',
    applyNode: '驳回',
    createTime: '2024-11-28 11:30:00',
    updateTime: '2024-12-08 15:40:00',
    delFlg: '0'
  }
]

/**
 * 模拟驳回历史记录
 */
const mockRejectHistory: Record<number, RejectRecordVO[]> = {
  5: [
    {
      rejectBy: '审核员A',
      rejectTime: '2024-12-08 15:40:00',
      reason: '方案描述不够详细，请补充具体实施步骤'
    }
  ]
}

// ==================== Mock API 实现 ====================

/**
 * 获取分页列表数据
 */
export const getPageList = async (params: TrainingPerformancePageReqVO) => {
  await mockDelay()

  let filteredList = [...mockDataList]

  // 按状态筛选
  if (params.applyNode) {
    filteredList = filteredList.filter((item) => item.applyNode === params.applyNode)
  }

  // 按方案名称筛选
  if (params.planName) {
    filteredList = filteredList.filter((item) =>
      item.planName.toLowerCase().includes(params.planName!.toLowerCase())
    )
  }

  // 按文档分类筛选
  if (params.fileType) {
    filteredList = filteredList.filter((item) => item.fileType === params.fileType)
  }

  // 按演训主题筛选
  if (params.exerciseTheme) {
    filteredList = filteredList.filter((item) =>
      item.exerciseTheme?.toLowerCase().includes(params.exerciseTheme!.toLowerCase())
    )
  }

  // 按演训类型筛选
  if (params.exerciseType) {
    filteredList = filteredList.filter((item) => item.exerciseType === params.exerciseType)
  }

  // 按演训等级筛选
  if (params.level) {
    filteredList = filteredList.filter((item) => item.level === params.level)
  }

  // 按标签页类型筛选
  if (params.tabType === 'review') {
    filteredList = filteredList.filter((item) =>
      ['待审核', '审核通过', '驳回'].includes(item.applyNode || '')
    )
  } else if (params.tabType === 'publish') {
    filteredList = filteredList.filter((item) => item.applyNode === '发布成功')
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
      list,
      total: filteredList.length
    },
    msg: 'success'
  }
}

/**
 * 获取文档分类列表
 */
export const getDocCategories = async (): Promise<{ data: DocCategoryVO[] }> => {
  await mockDelay(100)
  return { data: performanceCategories }
}

/**
 * 新建筹划方案
 */
export const createNewData = async (data: TrainingPerformanceVO) => {
  await mockDelay()

  const newItem: TrainingPerformanceVO = {
    ...data,
    id: generateMockId(),
    applyNode: '编辑中',
    createTime: new Date().toLocaleString('zh-CN'),
    updateTime: new Date().toLocaleString('zh-CN'),
    delFlg: '0'
  }

  mockDataList.unshift(newItem)

  return {
    code: 200,
    data: newItem,
    msg: '创建成功'
  }
}

/**
 * 编辑演训方案数据
 */
export const updatePerformanceData = async (data: any) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => item.id === data.id)
  if (index !== -1) {
    mockDataList[index] = {
      ...mockDataList[index],
      ...data,
      updateTime: new Date().toLocaleString('zh-CN')
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
 * 删除演训方案
 */
export const deleteTrainingPerformance = async (ids: number | number[]) => {
  await mockDelay()

  const idsArray = Array.isArray(ids) ? ids : [ids]
  idsArray.forEach((id) => {
    const index = mockDataList.findIndex((item) => item.id === id)
    if (index !== -1) {
      mockDataList.splice(index, 1)
    }
  })

  return {
    code: 200,
    data: null,
    msg: '删除成功'
  }
}

/**
 * 提交审核
 */
export const submitAudit = async (data: SubmitAuditReqVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => item.id === data.id)
  if (index !== -1) {
    mockDataList[index].applyNode = '待审核'
    mockDataList[index].updateTime = new Date().toLocaleString('zh-CN')

    return {
      code: 200,
      data: mockDataList[index],
      msg: '提交审核成功'
    }
  }

  return {
    code: 500,
    data: null,
    msg: '数据不存在'
  }
}

/**
 * 发布文档
 */
export const publishDocument = async (data: PublishDocReqVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => item.id === data.id)
  if (index !== -1) {
    mockDataList[index].applyNode = '发布成功'
    mockDataList[index].updateTime = new Date().toLocaleString('zh-CN')

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

/**
 * 写作权限校验
 */
export const checkWritePermission = async (
  data: checkWriteData
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
 * 获取文档文件流
 */
export const getFileStream = async (_id: number): Promise<Blob | null> => {
  await mockDelay()

  // 模拟返回一个简单的文本文件
  const content = '这是模拟的文档内容\n\n用于开发测试。'
  return new Blob([content], { type: 'text/plain' })
}

/**
 * 上传文档文件
 */
export const uploadDocument = async (data: UploadDocumentData) => {
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
 * 获取驳回历史
 */
export const getRejectHistory = async (id: number): Promise<{ data: RejectRecordVO[] }> => {
  await mockDelay(100)
  return { data: mockRejectHistory[id] || [] }
}

/**
 * 驳回演训方案
 */
export const rejectTrainingPerformance = async (data: RejectReqVO) => {
  await mockDelay()

  const index = mockDataList.findIndex((item) => item.id === data.id)
  if (index !== -1) {
    mockDataList[index].applyNode = '驳回'
    mockDataList[index].updateTime = new Date().toLocaleString('zh-CN')

    // 添加驳回记录
    if (!mockRejectHistory[data.id]) {
      mockRejectHistory[data.id] = []
    }
    mockRejectHistory[data.id].push({
      rejectBy: data.rejectBy || '当前用户',
      rejectTime: new Date().toLocaleString('zh-CN'),
      reason: data.reason
    })

    return {
      code: 200,
      success: true,
      message: '驳回成功'
    }
  }

  return {
    code: 500,
    success: false,
    message: '数据不存在'
  }
}

/**
 * 导出演训方案
 */
export const exportTrainingPerformance = async (_params: TrainingPerformancePageReqVO) => {
  await mockDelay()
  return { data: mockDataList }
}

/**
 * 模拟获取演训数据列表
 */
export const getDrillDataList = async (_params?: any) => {
  await mockDelay(100)

  return [
    { id: 'drill-001', name: '2024年度联合作战演练' },
    { id: 'drill-002', name: '战略级演训项目' },
    { id: 'drill-003', name: '网络安全演练' },
    { id: 'drill-004', name: '后勤保障演练' },
    { id: 'drill-005', name: '电磁频谱管控演练' },
    { id: 'drill-006', name: '太空作战演练' },
    { id: 'drill-007', name: '海上联合演练' }
  ]
}

// 导出所有 Mock API
export default {
  getPageList,
  getDocCategories,
  createNewData,
  updatePerformanceData,
  deleteTrainingPerformance,
  submitAudit,
  publishDocument,
  checkWritePermission,
  getFileStream,
  uploadDocument,
  getRejectHistory,
  rejectTrainingPerformance,
  exportTrainingPerformance,
  getDrillDataList
}
