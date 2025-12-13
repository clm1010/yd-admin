/**
 * Word 文档解析工具
 * 提取公共的 Word 文档解析和 HTML 清理功能
 */

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

    if (width > MAX_IMAGE_WIDTH) {
      const newStyle = style
        .replace(/width:\s*[^;]+;?/i, `width: ${MAX_IMAGE_WIDTH}px;`)
        .replace(/height:\s*[^;]+;?/i, 'height: auto;')
      return `<img${attrs}style="${newStyle}"`
    }
    return `<img${attrs}style="${style}"`
  })

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
 * 使用 mammoth 解析 Word 文档
 * @param arrayBuffer Word 文档的 ArrayBuffer
 * @param onProgress 可选的进度回调函数
 * @returns 解析后的 HTML 内容
 */
export const parseWordDocument = async (
  arrayBuffer: ArrayBuffer,
  onProgress?: ParseProgressCallback
): Promise<string> => {
  try {
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
      isZip
    ) {
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
