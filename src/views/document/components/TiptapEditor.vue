<template>
  <div class="tiptap-editor-wrapper">
    <!-- 工具栏 -->
    <EditorToolbar v-if="editor" :editor="editor" :save-status="saveStatus" />

    <!-- 编辑器内容 -->
    <div class="tiptap-content-wrapper">
      <editor-content :editor="editor" class="tiptap-content" />
    </div>

    <!-- HTML 预览对话框 -->
    <el-dialog
      v-model="htmlPreviewVisible"
      title="HTML 预览"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="preview-tabs">
        <el-radio-group v-model="previewMode" size="small">
          <el-radio-button value="preview">预览</el-radio-button>
          <el-radio-button value="source">源代码</el-radio-button>
        </el-radio-group>
      </div>
      <div class="preview-container">
        <!-- 预览模式 -->
        <div v-if="previewMode === 'preview'" class="html-preview" v-html="previewContent"></div>
        <!-- 源代码模式 -->
        <div v-else class="html-source">
          <pre><code>{{ formattedHtml }}</code></pre>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="copyHtml" type="primary" plain>
            <Icon icon="mdi:content-copy" class="mr-1" /> 复制 HTML
          </el-button>
          <el-button @click="downloadHtml" type="success" plain>
            <Icon icon="mdi:download" class="mr-1" /> 下载 HTML
          </el-button>
          <el-button @click="htmlPreviewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- PDF 导出对话框 -->
    <el-dialog
      v-model="pdfExportVisible"
      title="导出 PDF"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="pdf-preview-container" ref="pdfPreviewRef">
        <div class="pdf-preview" v-html="previewContent"></div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportToPdf" type="primary" :loading="exportingPdf">
            <Icon icon="mdi:file-pdf-box" class="mr-1" /> 导出 PDF
          </el-button>
          <el-button @click="pdfExportVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - 忽略 Tiptap 版本不兼容导致的类型问题
import { ref, onBeforeUnmount, watch, computed, provide } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { DragHandle } from './toolbar/extensions/DragHandle'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import { EditorToolbar } from './toolbar'
import { EditorKey } from './toolbar/types'

// Props
interface Props {
  ydoc: Y.Doc
  provider: WebsocketProvider
  user: {
    name: string
    color: string
    avatar?: string
  }
  placeholder?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始编写文档内容...',
  title: '文档'
})

// Emits
const emit = defineEmits<{
  (e: 'update', content: string): void
  (e: 'ready', editor: any): void
}>()

// 标记组件是否已销毁，防止异步回调导致内存泄漏
let isComponentDestroyed = false

// 保存状态
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')

// 预览相关状态
const htmlPreviewVisible = ref(false)
const pdfExportVisible = ref(false)
const previewMode = ref<'preview' | 'source'>('preview')
const previewContent = ref('')
const exportingPdf = ref(false)
const pdfPreviewRef = ref<HTMLElement | null>(null)

// 格式化 HTML 用于显示
const formattedHtml = computed(() => {
  if (!previewContent.value) return ''
  // 简单格式化 HTML
  return previewContent.value
    .replace(/></g, '>\n<')
    .replace(/(<\/?[^>]+>)/g, '\n$1')
    .split('\n')
    .filter((line) => line.trim())
    .join('\n')
})

// 自定义 FontSize 扩展
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {}
          }
          return {
            style: `font-size: ${attributes.fontSize}`
          }
        }
      }
    }
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
        }
    }
  }
})

// 编辑器实例
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false // 禁用 history，Collaboration 会处理
    }),
    // 协同编辑
    Collaboration.configure({
      document: props.ydoc
    }),
    // 协同光标
    CollaborationCursor.configure({
      provider: props.provider,
      user: {
        name: props.user.name,
        color: props.user.color
      }
    }),
    // 占位符
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    // 文本对齐
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    // 下划线
    Underline,
    // 高亮
    Highlight.configure({
      multicolor: true
    }),
    // 链接
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer'
      }
    }),
    // 图片
    Image.configure({
      inline: true
    }),
    // 表格
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableCell,
    TableHeader,
    // 任务列表
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    // 文本样式
    FontSize,
    // 字体
    FontFamily.configure({
      types: ['textStyle']
    }),
    // 文字颜色
    Color.configure({
      types: ['textStyle']
    }),
    // 上标
    Superscript,
    // 下标
    Subscript,
    // 拖动手柄
    DragHandle
  ],
  onUpdate: ({ editor }) => {
    // 防止组件销毁后触发回调
    if (isComponentDestroyed) return
    saveStatus.value = 'unsaved'
    emit('update', editor.getHTML())
  },
  onCreate: ({ editor }) => {
    // 防止组件销毁后触发回调
    if (isComponentDestroyed) return
    emit('ready', editor)
  }
})

// 提供编辑器实例给工具栏组件 - 直接提供 editor ref
provide(EditorKey, editor)

// ==================== 预览功能 ====================

// 生成完整的 HTML 文档
const generateFullHtml = () => {
  if (!editor.value) return ''

  const content = editor.value.getHTML()
  const title = props.title || '文档'

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
      background: #fff;
    }
    h1 { font-size: 2em; color: #1a1a1a; margin: 0.67em 0; font-weight: 700; }
    h2 { font-size: 1.5em; color: #2a2a2a; margin-top: 1.5em; font-weight: 600; }
    h3 { font-size: 1.25em; color: #3a3a3a; margin-top: 1.2em; font-weight: 600; }
    p { margin: 1em 0; }
    ul, ol { padding-left: 2em; margin: 1em 0; }
    ul { list-style-type: disc; }
    ol { list-style-type: decimal; }
    li { margin: 0.3em 0; }
    blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
      font-style: italic;
      background: #f8fafc;
      padding: 0.5em 1em;
    }
    code {
      background: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.9em;
      color: #dc2626;
    }
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f9fafb; font-weight: 600; }
    a { color: #2563eb; text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    mark { background: #fef08a; padding: 0 2px; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    s { text-decoration: line-through; }
    u { text-decoration: underline; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
    /* 任务列表 */
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    ul[data-type="taskList"] li input[type="checkbox"] {
      margin-top: 6px;
    }
    @media print {
      body { padding: 20px; }
      pre { white-space: pre-wrap; word-wrap: break-word; }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`
}

// HTML 预览
const previewHtml = () => {
  if (!editor.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }
  previewContent.value = editor.value.getHTML()
  previewMode.value = 'preview'
  htmlPreviewVisible.value = true
}

// 复制 HTML
const copyHtml = async () => {
  try {
    const html = generateFullHtml()
    await navigator.clipboard.writeText(html)
    ElMessage.success('HTML 已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 下载 HTML
const downloadHtml = () => {
  const html = generateFullHtml()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title || '文档'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('HTML 已下载')
}

// PDF 预览
const previewPdf = () => {
  if (!editor.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }
  previewContent.value = editor.value.getHTML()
  pdfExportVisible.value = true
}

// 导出 PDF（使用浏览器打印功能）
const exportToPdf = () => {
  exportingPdf.value = true

  try {
    const html = generateFullHtml()
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      ElMessage.error('无法打开打印窗口，请检查浏览器是否阻止弹窗')
      exportingPdf.value = false
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // 等待内容加载完成后打印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // 打印对话框关闭后关闭窗口
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }, 250)
    }

    // 如果 onload 没有触发（内容已缓存），直接打印
    if (printWindow.document.readyState === 'complete') {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }

    pdfExportVisible.value = false
    ElMessage.success('请在打印对话框中选择"另存为 PDF"')
  } catch (error) {
    ElMessage.error('导出失败: ' + (error as Error).message)
  } finally {
    exportingPdf.value = false
  }
}

// 监听用户信息变化
watch(
  () => props.user,
  (newUser) => {
    if (isComponentDestroyed) return
    if (editor.value && props.provider) {
      try {
        editor.value.commands.updateUser({
          name: newUser.name,
          color: newUser.color
        })
      } catch (e) {
        // 忽略更新用户时的错误
        console.warn('更新用户信息失败:', e)
      }
    }
  },
  { deep: true }
)

// 组件卸载时销毁编辑器 - 防止内存泄漏
onBeforeUnmount(() => {
  // 标记组件已销毁
  isComponentDestroyed = true

  // 销毁编辑器实例
  if (editor.value) {
    try {
      editor.value.destroy()
    } catch (e) {
      console.warn('销毁编辑器时出错:', e)
    }
  }

  // 清理预览相关的引用
  previewContent.value = ''
  pdfPreviewRef.value = null
})

// 暴露编辑器实例和方法
defineExpose({
  editor,
  getHTML: () => editor.value?.getHTML() || '',
  generateFullHtml,
  previewHtml,
  previewPdf
})
</script>

<style lang="scss" scoped>
.tiptap-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.tiptap-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.tiptap-content {
  min-height: 100%;

  :deep(.tiptap) {
    outline: none;
    min-height: 500px;

    > * + * {
      margin-top: 0.75em;
    }

    p {
      line-height: 1.75;
      color: #374151;
    }

    h1 {
      font-size: 2em;
      font-weight: 700;
      color: #111827;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h2 {
      font-size: 1.5em;
      font-weight: 600;
      color: #1f2937;
      margin-top: 1.25em;
      margin-bottom: 0.5em;
    }

    h3 {
      font-size: 1.25em;
      font-weight: 600;
      color: #374151;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    ul,
    ol {
      padding-left: 1.5em;
    }

    ul {
      list-style-type: disc;
    }

    ol {
      list-style-type: decimal;
    }

    li {
      margin: 0.25em 0;
    }

    blockquote {
      padding-left: 1em;
      border-left: 3px solid #2563eb;
      color: #6b7280;
      font-style: italic;
      margin: 1em 0;
    }

    code {
      background: #f3f4f6;
      color: #dc2626;
      padding: 0.125em 0.25em;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;

      code {
        background: transparent;
        color: inherit;
        padding: 0;
      }
    }

    mark {
      background: #fef08a;
      padding: 0.125em 0;
    }

    a {
      color: #2563eb;
      text-decoration: underline;
      cursor: pointer;

      &:hover {
        color: #1d4ed8;
      }
    }

    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    // 表格样式
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      th,
      td {
        border: 1px solid #e5e7eb;
        padding: 8px 12px;
        text-align: left;
        min-width: 100px;
      }

      th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
      }

      td {
        background: #fff;
      }

      tr:hover td {
        background: #f9fafb;
      }
    }

    // 任务列表样式
    ul[data-type='taskList'] {
      list-style: none;
      padding-left: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;

        > label {
          flex-shrink: 0;
          margin-top: 4px;

          input[type='checkbox'] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #2563eb;
          }
        }

        > div {
          flex: 1;
        }

        &[data-checked='true'] > div {
          text-decoration: line-through;
          color: #9ca3af;
        }
      }
    }

    // 占位符样式
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: #9ca3af;
      float: left;
      height: 0;
      pointer-events: none;
    }
  }
}

// 协同光标样式
:deep(.collaboration-cursor__caret) {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid var(--cursor-color, #000);
  border-right: 1px solid var(--cursor-color, #000);
  word-break: normal;
  pointer-events: none;
}

:deep(.collaboration-cursor__label) {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  user-select: none;
  color: #fff;
  padding: 2px 8px;
  border-radius: 6px 6px 6px 0;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

// 选中文本的协同高亮
:deep(.ProseMirror-yjs-selection) {
  background-color: var(--selection-color, rgba(37, 99, 235, 0.2));
}

// 预览相关样式
.preview-tabs {
  margin-bottom: 16px;
}

.preview-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.html-preview {
  padding: 24px;
  background: #fff;

  :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
  }
  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin-top: 1.5em;
  }
  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
  }
  :deep(p) {
    margin: 1em 0;
    line-height: 1.8;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }
  :deep(blockquote) {
    border-left: 4px solid #2563eb;
    padding-left: 1em;
    margin: 1em 0;
    color: #666;
  }
  :deep(code) {
    background: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  :deep(pre) {
    background: #1f2937;
    color: #f9fafb;
    padding: 1em;
    border-radius: 8px;
    overflow-x: auto;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  :deep(th),
  :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
  }
  :deep(th) {
    background: #f9fafb;
  }
  :deep(mark) {
    background: #fef08a;
  }
  :deep(a) {
    color: #2563eb;
    text-decoration: underline;
  }
}

.html-source {
  background: #1f2937;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;

  pre {
    margin: 0;
    color: #f9fafb;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.pdf-preview-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.pdf-preview {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;

  :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
  }
  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin-top: 1.5em;
  }
  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
  }
  :deep(p) {
    margin: 1em 0;
    line-height: 1.8;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 2em;
  }
  :deep(blockquote) {
    border-left: 4px solid #2563eb;
    padding-left: 1em;
    color: #666;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
  }
  :deep(th),
  :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 拖动手柄样式
:global(.drag-handle) {
  position: fixed !important;
  width: 20px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #999;
  border-radius: 4px;
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
  z-index: 50;

  &:hover {
    background: #f0f0f0;
    color: #666;
  }

  &:active {
    cursor: grabbing;
    background: #e0e0e0;
    color: #333;
  }

  svg {
    width: 10px;
    height: 14px;
  }
}

// 拖动中的元素样式
:deep(.dragging) {
  opacity: 0.5;
  background: #f0f7ff;
  outline: 2px dashed #2563eb;
  outline-offset: 2px;
}

// 块级元素悬停时的样式
.tiptap-content :deep(.tiptap) {
  > p,
  > h1,
  > h2,
  > h3,
  > h4,
  > h5,
  > h6,
  > blockquote,
  > pre,
  > ul,
  > ol,
  > table,
  > div {
    position: relative;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(37, 99, 235, 0.02);
    }
  }
}
</style>
