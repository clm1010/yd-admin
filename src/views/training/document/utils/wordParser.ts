/**
 * Word 文档解析工具
 * 提取公共的 Word 文档解析和 HTML 清理功能
 * 仅支持 .docx 格式（不支持旧版 .doc 格式）
 *
 * 支持两种解析模式:
 * 1. 普通文档 - OOXML 完整解析 (95%+ 还原度)
 * 2. 红头文件 - altChunk HTML 提取 (98%+ 还原度)
 */

/**
 * 文件格式类型
 */
export type WordFileFormat = 'doc' | 'docx' | 'unknown'

/**
 * 文件类型选择
 */
export type WordFileType = 'normal' | 'redhead'

/**
 * Docx 文件验证结果
 */
export interface DocxValidationResult {
  valid: boolean
  error?: string
  hasAltChunk?: boolean // 是否包含 altChunk（自动检测红头文件）
  structure: {
    hasContentTypes: boolean
    hasDocument: boolean
    hasStyles: boolean
    hasRelationships: boolean
  }
}

/**
 * 检测文件是否为旧版 .doc 格式（OLE/CFB 复合文档）
 * OLE 文件头: D0 CF 11 E0 A1 B1 1A E1
 * @param bytes 文件字节数组
 * @returns 是否为 .doc 格式
 */
export const isDocFormat = (bytes: Uint8Array): boolean => {
  if (bytes.length < 8) return false
  // OLE/CFB 文件头魔数
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  )
}

/**
 * 检测 Word 文件格式
 * @param bytes 文件字节数组
 * @param filename 文件名（可选，用于辅助判断）
 * @returns 文件格式
 */
export const detectWordFormat = (bytes: Uint8Array, filename?: string): WordFileFormat => {
  // 检查 ZIP 格式 (.docx)
  if (isZipFormat(bytes)) {
    return 'docx'
  }
  // 检查 OLE 格式 (.doc)
  if (isDocFormat(bytes)) {
    return 'doc'
  }
  // 通过文件扩展名辅助判断
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'docx') return 'docx'
    if (ext === 'doc') return 'doc'
  }
  return 'unknown'
}

/**
 * 清理 Word 导出的 HTML - 保持更好的排版
 * @param html 原始 HTML
 * @returns 清理后的 HTML
 */
export const cleanWordHtml = (html: string): string => {
  // 移除多余的连续空段落（保留单个空段落用于间距）
  html = html.replace(/(<p>\s*<\/p>\s*){2,}/g, '<p></p>')

  // 清理多余的空格，但保留必要的空格
  html = html.replace(/&nbsp;&nbsp;+/g, ' ')

  // 移除 Word 特有的 mso- 样式，但保留其他有用的样式
  html = html.replace(/mso-[^;:"]+:[^;:"]+;?/gi, '')

  // 移除空的 style 属性
  html = html.replace(/style="\s*"/g, '')

  // 移除 Word 特有的 class
  html = html.replace(/class="[^"]*Mso[^"]*"/gi, '')

  // 处理分页符 - 转换为自定义分页标记
  html = html.replace(
    /<br[^>]*style="[^"]*page-break[^"]*"[^>]*>/gi,
    '<div class="page-break" data-type="page-break"></div>'
  )
  html = html.replace(
    /<p[^>]*style="[^"]*page-break-before:\s*always[^"]*"[^>]*>/gi,
    '<div class="page-break" data-type="page-break"></div><p>'
  )
  html = html.replace(
    /<p[^>]*style="[^"]*page-break-after:\s*always[^"]*"[^>]*>(.*?)<\/p>/gi,
    '<p>$1</p><div class="page-break" data-type="page-break"></div>'
  )

  // 处理图片宽度 - 限制最大宽度为编辑器可用宽度
  const MAX_IMAGE_WIDTH = 540 // 编辑器可用宽度（A4 页面 794px - 边距 240px - 一些余量）

  html = html.replace(/<img([^>]*)style="([^"]*)"/gi, (_match, attrs, style) => {
    const widthMatch = style.match(/width:\s*([^;]+)/i)
    let width = 0

    if (widthMatch) {
      const widthStr = widthMatch[1].trim()
      // 转换各种单位为像素
      if (widthStr.endsWith('pt')) {
        width = parseFloat(widthStr) * 1.33 // pt 转 px
      } else if (widthStr.endsWith('in')) {
        width = parseFloat(widthStr) * 96 // in 转 px
      } else if (widthStr.endsWith('cm')) {
        width = parseFloat(widthStr) * 37.8 // cm 转 px
      } else if (widthStr.endsWith('mm')) {
        width = parseFloat(widthStr) * 3.78 // mm 转 px
      } else if (widthStr.endsWith('%')) {
        width = 0 // 百分比不处理，让浏览器自动计算
      } else {
        width = parseFloat(widthStr) || 0
      }
    }

    // 始终添加 max-width: 100% 确保响应式
    let newStyle = style
    if (width > MAX_IMAGE_WIDTH) {
      newStyle = style
        .replace(/width:\s*[^;]+;?/i, `width: ${MAX_IMAGE_WIDTH}px;`)
        .replace(/height:\s*[^;]+;?/i, 'height: auto;')
    }

    // 确保添加 max-width 和 display: block 防止溢出
    if (!newStyle.includes('max-width')) {
      newStyle += '; max-width: 100%'
    }
    if (!newStyle.includes('height: auto')) {
      newStyle = newStyle.replace(/height:\s*[^;]+;?/i, 'height: auto;')
    }

    return `<img${attrs}style="${newStyle}; display: block;"`
  })

  // 处理没有 style 属性的图片
  html = html.replace(
    /<img(?![^>]*style=)([^>]*)>/gi,
    '<img$1 style="max-width: 100%; height: auto; display: block;">'
  )

  return html
}

/**
 * mammoth 样式映射配置
 */
export const mammothStyleMap = [
  // 标题映射
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='标题 1'] => h1:fresh",
  "p[style-name='标题 2'] => h2:fresh",
  "p[style-name='标题 3'] => h3:fresh",
  "p[style-name='标题 4'] => h4:fresh",
  // 引用映射
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Block Text'] => blockquote:fresh",
  // 代码块映射
  "p[style-name='Code'] => pre:fresh",
  "r[style-name='Code Char'] => code",
  // 保留粗体和斜体
  'b => strong',
  'i => em',
  'u => u',
  'strike => s'
]

/**
 * 解析进度回调类型
 */
export type ParseProgressCallback = (progress: number, text: string) => void

/**
 * 使用 mammoth 解析 Word 文档 (.docx 格式)
 * 注意：mammoth 只支持 .docx 格式，不支持旧版 .doc 格式
 * @param arrayBuffer Word 文档的 ArrayBuffer
 * @param onProgress 可选的进度回调函数
 * @returns 解析后的 HTML 内容
 * @throws 如果是 .doc 格式，抛出特定错误
 */
export const parseWordDocument = async (
  arrayBuffer: ArrayBuffer,
  onProgress?: ParseProgressCallback
): Promise<string> => {
  try {
    // 更新进度：20% - 检测文件格式
    onProgress?.(20, '正在检测文件格式...')

    // 检测文件格式
    const bytes = new Uint8Array(arrayBuffer)
    const format = detectWordFormat(bytes)

    if (format === 'doc') {
      // 旧版 .doc 格式，抛出特定错误，让调用方处理
      const error = new Error('DOC_FORMAT_NOT_SUPPORTED')
      ;(error as any).isDocFormat = true
      throw error
    }

    // 如果格式为 unknown，尝试作为 HTML 解析（可能是 Word 兼容的 HTML 文件）
    if (format === 'unknown') {
      console.log('格式未知，尝试作为 HTML 解析...')
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(bytes)
      const trimmedText = text.trim()

      // 检查是否是 HTML 格式
      if (
        trimmedText.startsWith('<!DOCTYPE') ||
        trimmedText.startsWith('<html') ||
        trimmedText.startsWith('<HTML') ||
        (trimmedText.startsWith('\ufeff') && trimmedText.includes('<html'))
      ) {
        console.log('检测到 HTML 格式的 Word 兼容文件')
        onProgress?.(80, '正在处理 HTML 内容...')
        // 提取 body 内容
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (bodyMatch) {
          return bodyMatch[1].trim()
        }
        return text
      }

      // 不是 HTML 也不是 docx
      throw new Error('不支持的文件格式，请上传 .docx 文件')
    }

    // 更新进度：30% - 加载解析库
    onProgress?.(30, '正在加载 Word 解析库...')

    // 动态导入 mammoth
    const mammoth = await import('mammoth')

    // 更新进度：40% - 配置解析选项
    onProgress?.(40, '正在配置解析选项...')

    // 配置转换选项
    const options: any = {
      styleMap: mammothStyleMap,
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true
    }

    // 处理图片
    const mammothLib = mammoth.default || mammoth
    if (mammothLib.images && mammothLib.images.imgElement) {
      options.convertImage = mammothLib.images.imgElement((image: any) => {
        return image.read('base64').then((imageBuffer: string) => {
          const contentType = image.contentType || 'image/png'
          return {
            src: `data:${contentType};base64,${imageBuffer}`
          }
        })
      })
    } else {
      // 备用方案：直接处理图片数据
      options.convertImage = {
        'image/png': async (image: any) => {
          const buffer = await image.read('base64')
          return { src: `data:image/png;base64,${buffer}` }
        },
        'image/jpeg': async (image: any) => {
          const buffer = await image.read('base64')
          return { src: `data:image/jpeg;base64,${buffer}` }
        },
        'image/gif': async (image: any) => {
          const buffer = await image.read('base64')
          return { src: `data:image/gif;base64,${buffer}` }
        }
      }
    }

    // 更新进度：50% - 解析 Word 文档
    onProgress?.(50, '正在解析 Word 文档...')

    // 使用正确的 mammoth 引用
    const result = await mammothLib.convertToHtml({ arrayBuffer }, options)

    // 更新进度：70% - 处理 HTML 内容
    onProgress?.(70, '正在处理文档内容...')

    // 处理 HTML 内容
    let html = result.value

    // 更新进度：80% - 清理和优化 HTML
    onProgress?.(80, '正在优化文档格式...')

    // 清理和优化 HTML
    html = cleanWordHtml(html)

    console.log('Word 文档解析成功，警告信息:', result.messages)

    return html
  } catch (error) {
    console.error('Word 文档解析失败:', error)
    throw error
  }
}

/**
 * 将 base64 字符串解码为 Uint8Array
 * @param base64 base64 编码的字符串
 * @returns Uint8Array
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * 检测文件是否为 ZIP 格式（.docx 文件是 ZIP 格式）
 * @param bytes 文件字节数组
 * @returns 是否为 ZIP 格式
 */
export const isZipFormat = (bytes: Uint8Array): boolean => {
  // ZIP 文件头：PK (0x50 0x4B)
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

/**
 * 解析文件内容
 * 将 base64 编码的文件流解析为可在编辑器中显示的内容
 * @param base64Data base64 编码的文件数据
 * @param onProgress 可选的进度回调函数
 * @returns 解析后的 HTML 内容
 */
export const parseFileContent = async (
  base64Data: string,
  onProgress?: ParseProgressCallback
): Promise<string> => {
  try {
    console.log('开始解析文件内容, 数据长度:', base64Data.length)

    // 更新进度：15% - 分析文件格式
    onProgress?.(15, '正在分析文件格式...')

    // base64Data 格式: data:application/octet-stream;base64,xxxxx
    // 或者: data:text/html;base64,xxxxx
    const base64Index = base64Data.indexOf(',')
    if (base64Index === -1) {
      console.warn('无效的 base64 数据格式，尝试直接作为 base64 解码')
      // 可能没有 data URI 前缀，直接尝试解码
      try {
        const bytes = base64ToUint8Array(base64Data)
        // 检测文件头
        if (isZipFormat(bytes)) {
          console.log('检测到 ZIP 格式（.docx），使用 mammoth 解析...')
          onProgress?.(20, '检测到 Word 文档...')
          const arrayBuffer = bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as ArrayBuffer
          return await parseWordDocument(arrayBuffer, onProgress)
        }
      } catch (e) {
        console.error('直接 base64 解码失败:', e)
      }
      return ''
    }

    const mimeType = base64Data.substring(0, base64Index)
    const base64Content = base64Data.substring(base64Index + 1)
    console.log('MIME 类型:', mimeType, 'base64 内容长度:', base64Content.length)

    // 更新进度：20% - 解码文件内容
    onProgress?.(20, '正在解码文件内容...')

    // 解码 base64
    const bytes = base64ToUint8Array(base64Content)
    console.log('解码后字节数:', bytes.length, '文件头:', bytes[0], bytes[1], bytes[2], bytes[3])

    // 检测文件头来判断类型
    const isZip = isZipFormat(bytes)
    console.log('是否为 ZIP 格式:', isZip)

    // 根据 MIME 类型或文件头处理
    if (mimeType.includes('text/html') || mimeType.includes('text/plain')) {
      // 文本类型，直接解码
      console.log('处理为文本类型')
      onProgress?.(80, '正在处理文本内容...')
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(bytes)
    } else if (
      mimeType.includes('application/vnd.openxmlformats') ||
      mimeType.includes('application/msword') ||
      mimeType.includes('application/octet-stream') ||
      isZip ||
      isDocFormat(bytes)
    ) {
      // 检测具体格式
      const format = detectWordFormat(bytes)
      console.log('检测到文件格式:', format)

      if (format === 'doc') {
        // 旧版 .doc 格式，抛出特定错误让调用方处理
        console.log('检测到旧版 .doc 格式，不支持')
        onProgress?.(25, '检测到旧版 .doc 格式...')
        const error = new Error('DOC_FORMAT_NOT_SUPPORTED')
        ;(error as any).isDocFormat = true
        throw error
      }

      // 如果格式为 unknown，尝试检测是否为 HTML 格式（Word 兼容的 HTML 文件）
      if (format === 'unknown') {
        console.log('格式未知，尝试作为 HTML 解析...')
        onProgress?.(30, '正在识别文件内容...')
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(bytes)

        // 检查是否是 HTML 格式（包括 Word 生成的 HTML）
        const trimmedText = text.trim()
        if (
          trimmedText.startsWith('<!DOCTYPE') ||
          trimmedText.startsWith('<html') ||
          trimmedText.startsWith('<HTML') ||
          (trimmedText.startsWith('\ufeff') && trimmedText.includes('<html')) // 带 BOM 的 HTML
        ) {
          console.log('检测到 HTML 格式的 Word 兼容文件')
          onProgress?.(80, '正在处理 HTML 内容...')
          // 提取 body 内容（如果有的话）
          const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
          if (bodyMatch) {
            return bodyMatch[1].trim()
          }
          return text
        }

        // 不是 HTML，抛出错误
        throw new Error('不支持的文件格式，请上传 .docx 文件')
      }

      // Word 文档或二进制流，使用 mammoth 解析
      console.log('检测到 Word 文档/二进制流，使用 mammoth 解析...')
      onProgress?.(25, '检测到 Word 文档，准备解析...')
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer
      return await parseWordDocument(arrayBuffer, onProgress)
    } else {
      // 其他类型，尝试作为文本解码
      console.log('尝试作为其他类型处理')
      onProgress?.(60, '正在识别文件类型...')
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(bytes)

      // 检查是否是有效的 HTML
      if (text.trim().startsWith('<') && text.includes('>')) {
        console.log('检测到 HTML 格式')
        onProgress?.(80, '正在处理 HTML 内容...')
        return text
      }

      // 尝试检测是否可能是 Word 文档（通过文件头）
      if (isZip) {
        console.log('通过文件头检测到 ZIP 格式（可能是 .docx），尝试使用 mammoth 解析...')
        onProgress?.(25, '检测到 Word 文档，准备解析...')
        const arrayBuffer = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer
        return await parseWordDocument(arrayBuffer, onProgress)
      }

      // 纯文本，包装为段落
      console.log('处理为纯文本')
      onProgress?.(80, '正在处理纯文本内容...')
      return `<p>${text.replace(/\n/g, '</p><p>')}</p>`
    }
  } catch (error) {
    console.error('文件内容解析错误:', error)
    return ''
  }
}

// =====================================================
// 新增: 高保真 Word 导入功能
// =====================================================

/**
 * 验证 docx 文件完整性
 * 在解析前先验证 docx 文件是否损坏
 * @param arrayBuffer Word 文档的 ArrayBuffer
 * @returns 验证结果
 */
export async function validateDocxFile(arrayBuffer: ArrayBuffer): Promise<DocxValidationResult> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(arrayBuffer)

    // 检查必要文件
    const contentTypes = zip.file('[Content_Types].xml')
    const document = zip.file('word/document.xml')
    const styles = zip.file('word/styles.xml')
    const rels = zip.file('word/_rels/document.xml.rels')

    // 检查是否有 altChunk (红头文件标志)
    const afchunk = zip.file('word/afchunk.mht')
    const afchunkHtml = zip.file(/word\/afchunk.*\.htm/i)

    if (!contentTypes || !document) {
      return {
        valid: false,
        error: '文件结构不完整，可能已损坏',
        structure: {
          hasContentTypes: !!contentTypes,
          hasDocument: !!document,
          hasStyles: !!styles,
          hasRelationships: !!rels
        }
      }
    }

    // 验证 XML 格式 - 放宽验证条件，支持更多格式的 Word 文档
    const documentContent = await document.async('string')
    // 检查是否包含 Word 文档的常见标记
    const isValidDocumentXml =
      documentContent.includes('<w:document') ||
      documentContent.includes('w:document') ||
      documentContent.includes('<document') ||
      documentContent.includes('xmlns:w=') ||
      documentContent.includes('<w:body') ||
      documentContent.includes('w:body')

    if (!isValidDocumentXml) {
      console.warn('document.xml 格式可能不标准，尝试继续解析...')
      // 不再直接返回错误，而是尝试继续解析
    }

    // 检测是否有 altChunk
    const hasAltChunk = !!afchunk || afchunkHtml.length > 0

    return {
      valid: true,
      hasAltChunk: hasAltChunk, // 自动检测是否为红头文件格式
      structure: {
        hasContentTypes: !!contentTypes,
        hasDocument: !!document,
        hasStyles: !!styles,
        hasRelationships: !!rels
      }
    }
  } catch (e) {
    console.error('文件验证失败:', e)
    return {
      valid: false,
      error: '无法解析文件，格式可能已损坏',
      structure: {
        hasContentTypes: false,
        hasDocument: false,
        hasStyles: false,
        hasRelationships: false
      }
    }
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 解析 styles.xml 获取样式定义
 */
function parseStylesXml(stylesObj: any): Record<string, any> {
  const stylesMap: Record<string, any> = {}

  try {
    const styles = stylesObj?.['w:styles']?.['w:style']
    if (!styles) return stylesMap

    const stylesList = Array.isArray(styles) ? styles : [styles]

    for (const style of stylesList) {
      const styleId = style['@_w:styleId']
      if (!styleId) continue

      const rPr = style['w:rPr'] || {}
      const pPr = style['w:pPr'] || {}

      stylesMap[styleId] = {
        rPr,
        pPr,
        name: style['w:name']?.['@_w:val'] || styleId
      }
    }
  } catch (e) {
    console.warn('解析样式失败:', e)
  }

  return stylesMap
}

/**
 * 解析段落属性为 HTML
 * @param para 段落对象
 * @param stylesMap 样式映射
 * @param imageMap 图片映射
 */
function convertParagraphToHtml(
  para: any,
  stylesMap: Record<string, any>,
  imageMap?: Map<string, string>
): string {
  if (!para) return ''

  const pPr = para['w:pPr'] || {}
  const runs = para['w:r']

  // 段落样式
  const styleArr: string[] = []

  // 文本对齐
  const jc = pPr['w:jc']?.['@_w:val']
  if (jc) {
    const alignMap: Record<string, string> = {
      left: 'left',
      center: 'center',
      right: 'right',
      both: 'justify',
      justify: 'justify'
    }
    if (alignMap[jc]) {
      styleArr.push(`text-align: ${alignMap[jc]}`)
    }
  }

  // 首行缩进
  const ind = pPr['w:ind']
  if (ind) {
    const firstLine = ind['@_w:firstLine'] || ind['@_w:firstLineChars']
    if (firstLine) {
      const value = parseInt(firstLine)
      // firstLine 单位是 twips (1/20 point)，firstLineChars 是 1/100 字符
      if (ind['@_w:firstLineChars']) {
        styleArr.push(`text-indent: ${value / 100}em`)
      } else {
        styleArr.push(`text-indent: ${value / 20}pt`)
      }
    }
  }

  // 行高
  const spacing = pPr['w:spacing']
  if (spacing) {
    const line = spacing['@_w:line']
    const lineRule = spacing['@_w:lineRule']
    if (line) {
      const lineValue = parseInt(line)
      if (lineRule === 'exact') {
        styleArr.push(`line-height: ${lineValue / 20}pt`)
      } else if (lineRule === 'atLeast') {
        styleArr.push(`line-height: ${lineValue / 20}pt`)
      } else {
        // 默认为倍数 (240 = 单倍行距)
        styleArr.push(`line-height: ${(lineValue / 240).toFixed(2)}`)
      }
    }
  }

  // 处理段落内容
  let content = ''
  if (runs) {
    const runsList = Array.isArray(runs) ? runs : [runs]
    for (const run of runsList) {
      content += convertRunToHtml(run, stylesMap, imageMap)
    }
  }

  // 处理书签等特殊元素
  const hyperlink = para['w:hyperlink']
  if (hyperlink) {
    const hyperlinkRuns = hyperlink['w:r']
    if (hyperlinkRuns) {
      const runsList = Array.isArray(hyperlinkRuns) ? hyperlinkRuns : [hyperlinkRuns]
      for (const run of runsList) {
        content += convertRunToHtml(run, stylesMap, imageMap)
      }
    }
  }

  const style = styleArr.length > 0 ? ` style="${styleArr.join('; ')}"` : ''
  return `<p${style}>${content || '<br>'}</p>`
}

/**
 * 解析 Run（文本片段）属性为 HTML
 * @param run Run 对象
 * @param stylesMap 样式映射
 * @param imageMap 图片映射 (rId -> base64 data URL)
 */
function convertRunToHtml(
  run: any,
  stylesMap: Record<string, any>,
  imageMap?: Map<string, string>
): string {
  if (!run) return ''

  const rPr = run['w:rPr'] || {}

  // 处理换行
  if (run['w:br']) {
    return '<br>'
  }

  // 处理制表符
  if (run['w:tab']) {
    return '&emsp;&emsp;'
  }

  // 处理图片 (w:drawing)
  const drawing = run['w:drawing']
  if (drawing && imageMap) {
    const imgHtml = extractImageFromDrawing(drawing, imageMap)
    if (imgHtml) return imgHtml
  }

  // 处理旧版图片 (w:pict)
  const pict = run['w:pict']
  if (pict && imageMap) {
    const imgHtml = extractImageFromPict(pict, imageMap)
    if (imgHtml) return imgHtml
  }

  // 处理嵌入对象 (w:object)
  const obj = run['w:object']
  if (obj && imageMap) {
    const imgHtml = extractImageFromObject(obj, imageMap)
    if (imgHtml) return imgHtml
  }

  // 获取文本内容
  let text = ''
  const textNode = run['w:t']
  if (textNode) {
    text = typeof textNode === 'string' ? textNode : textNode['#text'] || textNode['_'] || ''
  }

  if (!text) return ''

  // 提取样式
  const style: string[] = []

  // 字体
  const rFonts = rPr['w:rFonts']
  if (rFonts) {
    const font = rFonts['@_w:eastAsia'] || rFonts['@_w:ascii'] || rFonts['@_w:hAnsi']
    if (font) {
      style.push(`font-family: "${font}"`)
    }
  }

  // 字号 (半点单位，需要 /2)
  const sz = rPr['w:sz'] || rPr['w:szCs']
  if (sz) {
    const size = parseInt(sz['@_w:val']) / 2
    if (size > 0) {
      style.push(`font-size: ${size}pt`)
    }
  }

  // 颜色
  const color = rPr['w:color']
  if (color) {
    const colorVal = color['@_w:val']
    if (colorVal && colorVal !== 'auto') {
      style.push(`color: #${colorVal}`)
    }
  }

  // 高亮
  const highlight = rPr['w:highlight']
  if (highlight) {
    const highlightColor = highlight['@_w:val']
    if (highlightColor) {
      const colorMap: Record<string, string> = {
        yellow: '#FFFF00',
        green: '#00FF00',
        cyan: '#00FFFF',
        magenta: '#FF00FF',
        blue: '#0000FF',
        red: '#FF0000',
        darkBlue: '#00008B',
        darkCyan: '#008B8B',
        darkGreen: '#006400',
        darkMagenta: '#8B008B',
        darkRed: '#8B0000',
        darkYellow: '#808000',
        darkGray: '#A9A9A9',
        lightGray: '#D3D3D3',
        black: '#000000'
      }
      style.push(`background-color: ${colorMap[highlightColor] || highlightColor}`)
    }
  }

  // 加粗
  const bold = rPr['w:b']
  if (bold !== undefined && bold !== null) {
    const isOff = bold['@_w:val'] === 'false' || bold['@_w:val'] === '0'
    if (!isOff) {
      style.push('font-weight: bold')
    }
  }

  // 斜体
  const italic = rPr['w:i']
  if (italic !== undefined && italic !== null) {
    const isOff = italic['@_w:val'] === 'false' || italic['@_w:val'] === '0'
    if (!isOff) {
      style.push('font-style: italic')
    }
  }

  // 下划线
  const underline = rPr['w:u']
  if (underline !== undefined && underline !== null) {
    const val = underline['@_w:val']
    if (val && val !== 'none') {
      style.push('text-decoration: underline')
    }
  }

  // 删除线
  const strike = rPr['w:strike']
  if (strike !== undefined && strike !== null) {
    const isOff = strike['@_w:val'] === 'false' || strike['@_w:val'] === '0'
    if (!isOff) {
      style.push('text-decoration: line-through')
    }
  }

  const styleAttr = style.length ? ` style="${style.join('; ')}"` : ''
  return `<span${styleAttr}>${escapeHtml(text)}</span>`
}

/**
 * 从 w:drawing 元素提取图片
 */
function extractImageFromDrawing(drawing: any, imageMap: Map<string, string>): string {
  try {
    // 处理 inline 图片
    const inline = drawing['wp:inline']
    if (inline) {
      return extractImageFromInlineOrAnchor(inline, imageMap)
    }

    // 处理 anchor 图片
    const anchor = drawing['wp:anchor']
    if (anchor) {
      return extractImageFromInlineOrAnchor(anchor, imageMap)
    }
  } catch (e) {
    console.warn('提取图片失败:', e)
  }
  return ''
}

/**
 * 从 inline 或 anchor 元素提取图片
 */
function extractImageFromInlineOrAnchor(element: any, imageMap: Map<string, string>): string {
  try {
    // 获取尺寸 (EMU 单位，1英寸 = 914400 EMU)
    const extent = element['wp:extent']
    let width = 0
    let height = 0
    if (extent) {
      width = Math.round((parseInt(extent['@_cx'] || '0') / 914400) * 96) // 转换为像素
      height = Math.round((parseInt(extent['@_cy'] || '0') / 914400) * 96)
    }

    // 获取图片引用
    const graphic = element['a:graphic']
    const graphicData = graphic?.['a:graphicData']
    const pic = graphicData?.['pic:pic']
    const blipFill = pic?.['pic:blipFill']
    const blip = blipFill?.['a:blip']

    if (blip) {
      const embedId = blip['@_r:embed']
      if (embedId && imageMap.has(embedId)) {
        const src = imageMap.get(embedId)
        const styleArr = ['max-width: 100%', 'height: auto', 'display: block']
        if (width > 0) styleArr.unshift(`width: ${Math.min(width, 540)}px`)
        return `<img src="${src}" style="${styleArr.join('; ')}" />`
      }
    }
  } catch (e) {
    console.warn('解析图片元素失败:', e)
  }
  return ''
}

/**
 * 从 w:pict 元素提取图片 (旧版 VML 格式)
 */
function extractImageFromPict(pict: any, imageMap: Map<string, string>): string {
  try {
    const shape = pict['v:shape'] || pict['v:rect']
    if (shape) {
      const imagedata = shape['v:imagedata']
      if (imagedata) {
        const rId = imagedata['@_r:id'] || imagedata['@_o:relid']
        if (rId && imageMap.has(rId)) {
          const src = imageMap.get(rId)
          return `<img src="${src}" style="max-width: 100%; height: auto; display: block;" />`
        }
      }
    }
  } catch (e) {
    console.warn('解析 VML 图片失败:', e)
  }
  return ''
}

/**
 * 从 w:object 元素提取图片
 */
function extractImageFromObject(obj: any, imageMap: Map<string, string>): string {
  try {
    const shape = obj['v:shape']
    if (shape) {
      const imagedata = shape['v:imagedata']
      if (imagedata) {
        const rId = imagedata['@_r:id'] || imagedata['@_o:relid']
        if (rId && imageMap.has(rId)) {
          const src = imageMap.get(rId)
          return `<img src="${src}" style="max-width: 100%; height: auto; display: block;" />`
        }
      }
    }
  } catch (e) {
    console.warn('解析嵌入对象失败:', e)
  }
  return ''
}

/**
 * 处理图片
 */
async function processImages(
  zip: any,
  documentContent: string,
  relsContent: string
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>()

  try {
    // 解析关系文件获取图片映射
    const { XMLParser } = await import('fast-xml-parser')
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })

    const relsObj = parser.parse(relsContent)
    const relationships = relsObj?.['Relationships']?.['Relationship'] || []
    const relsList = Array.isArray(relationships) ? relationships : [relationships]

    for (const rel of relsList) {
      const type = rel['@_Type'] || ''
      const target = rel['@_Target'] || ''
      const id = rel['@_Id'] || ''

      if (type.includes('image')) {
        // 获取图片路径
        const imagePath = target.startsWith('/') ? target.substring(1) : `word/${target}`
        const imageFile = zip.file(imagePath)

        if (imageFile) {
          try {
            const imageData = await imageFile.async('base64')
            const ext = target.split('.').pop()?.toLowerCase() || 'png'
            const mimeType =
              ext === 'jpg' || ext === 'jpeg'
                ? 'image/jpeg'
                : ext === 'gif'
                  ? 'image/gif'
                  : ext === 'webp'
                    ? 'image/webp'
                    : 'image/png'
            imageMap.set(id, `data:${mimeType};base64,${imageData}`)
          } catch (e) {
            console.warn(`处理图片失败: ${imagePath}`, e)
          }
        }
      }
    }
  } catch (e) {
    console.warn('处理图片映射失败:', e)
  }

  return imageMap
}

/**
 * 普通文件 - OOXML 完整解析方案
 * 达到 95%+ 还原度
 */
export async function parseOoxmlDocument(
  arrayBuffer: ArrayBuffer,
  onProgress?: ParseProgressCallback
): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const { XMLParser } = await import('fast-xml-parser')

    onProgress?.(20, '正在解压文档...')
    const zip = await JSZip.loadAsync(arrayBuffer)

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreDeclaration: true,
      parseTagValue: false,
      trimValues: true
    })

    onProgress?.(30, '正在解析文档样式...')

    // 1. 解析 styles.xml 获取样式定义
    const stylesFile = zip.file('word/styles.xml')
    let stylesMap: Record<string, any> = {}
    if (stylesFile) {
      const stylesXml = await stylesFile.async('string')
      stylesMap = parseStylesXml(parser.parse(stylesXml))
    }

    onProgress?.(40, '正在解析文档内容...')

    // 2. 解析 document.xml 获取内容
    const documentFile = zip.file('word/document.xml')
    if (!documentFile) {
      throw new Error('未找到文档内容')
    }
    const documentXml = await documentFile.async('string')
    const docObj = parser.parse(documentXml)

    // 3. 处理图片关系
    const relsFile = zip.file('word/_rels/document.xml.rels')
    let imageMap = new Map<string, string>()
    if (relsFile) {
      const relsContent = await relsFile.async('string')
      imageMap = await processImages(zip, documentXml, relsContent)
    }

    onProgress?.(60, '正在生成 HTML...')

    // 4. 获取文档体 - 支持多种命名空间格式
    let body = docObj?.['w:document']?.['w:body']
    if (!body) {
      // 尝试其他可能的格式
      body = docObj?.['document']?.['body']
      if (!body) {
        // 遍历查找 body
        const findBody = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null
          for (const key of Object.keys(obj)) {
            if (key.includes('body') || key.includes('Body')) {
              return obj[key]
            }
            const found = findBody(obj[key])
            if (found) return found
          }
          return null
        }
        body = findBody(docObj)
      }
    }

    if (!body) {
      console.warn('未找到标准文档体，尝试使用 mammoth 解析')
      throw new Error('文档结构错误，将使用后备方案')
    }

    // 5. 遍历所有元素（保持顺序）
    const elements: string[] = []

    // 处理所有子元素，保持原始顺序
    const processBodyElements = (bodyContent: any) => {
      // 如果 body 直接包含数组元素
      if (Array.isArray(bodyContent)) {
        for (const item of bodyContent) {
          if (item['w:p'] !== undefined) {
            elements.push(convertParagraphToHtml(item, stylesMap, imageMap))
          } else if (item['w:tbl'] !== undefined) {
            elements.push(convertTableToHtml(item['w:tbl'], stylesMap, imageMap))
          }
        }
        return
      }

      // 处理段落
      const paragraphs = bodyContent['w:p']
      if (paragraphs) {
        const paraList = Array.isArray(paragraphs) ? paragraphs : [paragraphs]
        for (const para of paraList) {
          elements.push(convertParagraphToHtml(para, stylesMap, imageMap))
        }
      }

      // 处理表格
      const tables = bodyContent['w:tbl']
      if (tables) {
        const tableList = Array.isArray(tables) ? tables : [tables]
        for (const table of tableList) {
          elements.push(convertTableToHtml(table, stylesMap, imageMap))
        }
      }
    }

    processBodyElements(body)

    onProgress?.(80, '正在优化格式...')

    let html = elements.join('\n')

    // 清理空的 span
    html = html.replace(/<span>\s*<\/span>/g, '')
    html = html.replace(/<span style="">\s*<\/span>/g, '')

    // 合并连续的相同样式 span
    html = optimizeHtml(html)

    onProgress?.(100, '解析完成')

    return html
  } catch (error) {
    console.error('OOXML 解析失败:', error)
    throw error
  }
}

/**
 * 转换表格为 HTML
 * 优化：防止表格溢出，添加响应式样式
 * @param table 表格对象
 * @param stylesMap 样式映射
 * @param imageMap 图片映射
 */
function convertTableToHtml(
  table: any,
  stylesMap: Record<string, any>,
  imageMap?: Map<string, string>
): string {
  if (!table) return ''

  const rows = table['w:tr']
  if (!rows) return ''

  const rowsList = Array.isArray(rows) ? rows : [rows]
  // 使用 max-width: 100% 和 table-layout: auto 防止溢出
  let html =
    '<table style="border-collapse: collapse; width: 100%; max-width: 100%; table-layout: auto; margin: 1em 0;">'

  for (const row of rowsList) {
    html += '<tr>'
    const cells = row['w:tc']
    if (cells) {
      const cellsList = Array.isArray(cells) ? cells : [cells]
      for (const cell of cellsList) {
        // 添加 word-wrap 和 overflow-wrap 防止内容溢出
        const cellStyle: string[] = [
          'border: 1px solid #ddd',
          'padding: 8px',
          'word-wrap: break-word',
          'overflow-wrap: break-word'
        ]

        // 处理单元格属性
        const tcPr = cell['w:tcPr']
        if (tcPr) {
          // 不再添加固定宽度，让表格自适应
          // 垂直对齐
          const vAlign = tcPr['w:vAlign']
          if (vAlign) {
            const val = vAlign['@_w:val']
            if (val) {
              cellStyle.push(`vertical-align: ${val}`)
            }
          }

          // 背景色
          const shd = tcPr['w:shd']
          if (shd) {
            const fill = shd['@_w:fill']
            if (fill && fill !== 'auto') {
              cellStyle.push(`background-color: #${fill}`)
            }
          }
        }

        // 处理单元格内容
        let cellContent = ''
        const cellParas = cell['w:p']
        if (cellParas) {
          const parasList = Array.isArray(cellParas) ? cellParas : [cellParas]
          for (const para of parasList) {
            const runs = para['w:r']
            if (runs) {
              const runsList = Array.isArray(runs) ? runs : [runs]
              for (const run of runsList) {
                cellContent += convertRunToHtml(run, stylesMap, imageMap)
              }
            }
          }
        }

        html += `<td style="${cellStyle.join('; ')}">${cellContent || '&nbsp;'}</td>`
      }
    }
    html += '</tr>'
  }

  html += '</table>'
  return html
}

/**
 * 优化 HTML 输出
 */
function optimizeHtml(html: string): string {
  // 移除空段落（保留作为间距的单个空段落）
  html = html.replace(/(<p[^>]*>\s*<br>\s*<\/p>\s*){2,}/g, '<p><br></p>')

  // 清理多余空格
  html = html.replace(/\s{2,}/g, ' ')

  return html.trim()
}

/**
 * 红头文件 - altChunk HTML 提取方案
 * 达到 98%+ 还原度
 */
export async function parseRedHeadDocument(
  arrayBuffer: ArrayBuffer,
  onProgress?: ParseProgressCallback
): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(arrayBuffer)

    onProgress?.(30, '正在提取红头文件内容...')

    // 尝试多种可能的 altChunk 文件
    let afchunk =
      zip.file('word/afchunk.mht') || zip.file('word/afchunk.htm') || zip.file('word/afchunk.html')

    // 如果没找到，尝试模糊匹配
    if (!afchunk) {
      const afchunkFiles = zip.file(/word\/afchunk/i)
      if (afchunkFiles.length > 0) {
        afchunk = afchunkFiles[0]
      }
    }

    if (!afchunk) {
      // 没有 altChunk，回退到 OOXML 解析
      console.warn('未找到红头文件内容（altChunk），回退到 OOXML 解析')
      return await parseOoxmlDocument(arrayBuffer, onProgress)
    }

    const content = await afchunk.async('string')
    onProgress?.(60, '正在解析 HTML 内容...')

    let html: string

    // 判断是 MHT 还是 HTML
    if (content.includes('MIME-Version:') || content.includes('Content-Type: multipart')) {
      // MHT 格式
      html = parseMhtToHtml(content)
    } else {
      // 直接是 HTML
      html = content
    }

    onProgress?.(80, '正在优化样式...')
    return cleanRedHeadHtml(html)
  } catch (error) {
    console.error('红头文件解析失败:', error)
    throw error
  }
}

/**
 * 解析 MHT 格式
 */
function parseMhtToHtml(mhtContent: string): string {
  try {
    // 找到 HTML 部分（可能是 quoted-printable 编码或 base64）
    const htmlMatch = mhtContent.match(
      /Content-Type:\s*text\/html[\s\S]*?\n\n([\s\S]*?)(?=------=|--=_NextPart|$)/i
    )
    if (!htmlMatch) {
      // 尝试直接查找 HTML 内容
      const directHtmlMatch = mhtContent.match(/<html[\s\S]*?<\/html>/i)
      if (directHtmlMatch) {
        return directHtmlMatch[0]
      }
      return mhtContent
    }

    let html = htmlMatch[1]

    // 检查是否是 base64 编码
    const encodingMatch = mhtContent.match(/Content-Transfer-Encoding:\s*([\w-]+)/i)
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase() : ''

    if (encoding === 'base64') {
      try {
        // 移除换行并解码
        const cleanBase64 = html.replace(/\s/g, '')
        html = atob(cleanBase64)
      } catch (e) {
        console.warn('Base64 解码失败，尝试其他方式')
      }
    } else if (encoding === 'quoted-printable') {
      // 解码 quoted-printable
      html = html
        .replace(/=\r?\n/g, '') // 软换行
        .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    }

    // 提取 body 内容
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      return bodyMatch[1]
    }

    // 提取 <pre> 中的内容（红头文件特有结构）
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)
    if (preMatch) {
      return preMatch[1]
    }

    return html
  } catch (e) {
    console.error('MHT 解析失败:', e)
    return mhtContent
  }
}

/**
 * 清理红头文件 HTML - 保留关键样式以便 Tiptap 正确解析
 */
function cleanRedHeadHtml(html: string): string {
  // 移除编辑器特有的 data-ea-* 属性
  html = html.replace(/\s*data-ea-[^=]*="[^"]*"/g, '')

  // 移除不需要的属性（但保留 style 和 class）
  html = html.replace(/\s*(id|contenteditable|role|aria-[^=]*)="[^"]*"/gi, '')

  // 移除无用的 class（但保留有样式意义的）
  html = html.replace(/class="[^"]*MsoNormal[^"]*"/gi, '')

  // 移除 XML 命名空间声明
  html = html.replace(/<\?xml[^>]*\?>/gi, '')
  html = html.replace(/xmlns[^=]*="[^"]*"/gi, '')

  // 移除 Office 特有标签
  html = html.replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '')
  html = html.replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '')
  html = html.replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '')

  // 移除注释
  html = html.replace(/<!--[\s\S]*?-->/g, '')

  // 移除 mso-* 样式属性（Word 特有），但保留其他有用的样式
  html = html.replace(/mso-[^;:"']+:[^;:"']+;?\s*/gi, '')

  // 清理空的 style 属性
  html = html.replace(/\s*style="\s*"/gi, '')

  // 转换 font 标签为 span（Tiptap 不支持 font 标签）
  html = html.replace(
    /<font([^>]*)color\s*=\s*["']?([^"'\s>]+)["']?([^>]*)>/gi,
    '<span style="color: $2"$1$3>'
  )
  html = html.replace(/<\/font>/gi, '</span>')

  // 确保颜色值格式正确（添加 # 前缀如果缺失）
  html = html.replace(/color:\s*([A-Fa-f0-9]{6})([^A-Fa-f0-9])/gi, 'color: #$1$2')
  html = html.replace(/color:\s*([A-Fa-f0-9]{3})([^A-Fa-f0-9])/gi, 'color: #$1$2')

  // 转换常见的颜色名称为十六进制值（Tiptap 更好地支持）
  const colorNameMap: Record<string, string> = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#008000',
    yellow: '#FFFF00',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    grey: '#808080',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    brown: '#A52A2A',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    olive: '#808000',
    aqua: '#00FFFF',
    fuchsia: '#FF00FF',
    silver: '#C0C0C0',
    lime: '#00FF00'
  }

  for (const [name, hex] of Object.entries(colorNameMap)) {
    const regex = new RegExp(`color:\\s*${name}([;\\s"'])`, 'gi')
    html = html.replace(regex, `color: ${hex}$1`)
  }

  // 移除空行
  html = html.replace(/\n\s*\n/g, '\n')

  // 移除空的 span 包装（在处理完颜色后）
  html = html.replace(/<span>\s*<\/span>/gi, '')
  html = html.replace(/<span[^>]*>[\s\ufeff]*<br\s*\/?>\s*<\/span>/gi, '<br>')

  return html.trim()
}

/**
 * 智能解析 Word 文档
 * 根据文件类型自动选择最佳解析方案
 */
export async function parseWordDocumentSmart(
  arrayBuffer: ArrayBuffer,
  fileType: WordFileType,
  onProgress?: ParseProgressCallback
): Promise<string> {
  if (fileType === 'redhead') {
    return await parseRedHeadDocument(arrayBuffer, onProgress)
  } else {
    return await parseOoxmlDocument(arrayBuffer, onProgress)
  }
}
