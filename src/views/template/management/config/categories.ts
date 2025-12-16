/**
 * 模板分类配置
 * 从 collaborative-middleware 迁移
 */

/**
 * 模板分类接口
 */
export interface TemplateCategoryVO {
  id: string
  name: string
}

/**
 * 模板分类数据
 */
export const templateCategories: TemplateCategoryVO[] = [{ id: 'CHWD', name: '筹划文档' }]

/**
 * 模板子类数据（11种文档分类）
 */
export const templateSubCategories: TemplateCategoryVO[] = [
  { id: 'QTLA', name: '企图立案' },
  { id: 'ZZJH', name: '作战计划' },
  { id: 'YXFA', name: '演训方案' },
  { id: 'ZZWS', name: '作战文书' },
  { id: 'DTJH', name: '导调计划' },
  { id: 'ZZXD', name: '作战想定' },
  { id: 'ZJZG', name: '战绩战报' },
  { id: 'ZJBG', name: '总结报告' },
  { id: 'TZ', name: '通知' },
  { id: 'TG', name: '通告' },
  { id: 'PGJG', name: '评估结果' }
]

/**
 * 根据 ID 获取分类名称
 * @param id 分类 ID
 */
export const getCategoryNameById = (id: string): string => {
  const category = templateCategories.find((c) => c.id === id)
  return category?.name || ''
}

/**
 * 根据名称获取分类 ID
 * @param name 分类名称
 */
export const getCategoryIdByName = (name: string): string => {
  const category = templateCategories.find((c) => c.name === name)
  return category?.id || ''
}

/**
 * 根据子类 ID 获取子类名称
 * @param id 子类 ID
 */
export const getSubCategoryNameById = (id: string): string => {
  const subCategory = templateSubCategories.find((c) => c.id === id)
  return subCategory?.name || ''
}

/**
 * 根据子类名称获取子类 ID
 * @param name 子类名称
 */
export const getSubCategoryIdByName = (name: string): string => {
  const subCategory = templateSubCategories.find((c) => c.name === name)
  return subCategory?.id || ''
}
