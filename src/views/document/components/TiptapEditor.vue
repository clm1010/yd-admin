<template>
  <div class="tiptap-editor-wrapper">
    <!-- 工具栏 -->
    <div class="tiptap-toolbar" v-if="editor">
      <!-- 格式按钮组 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          title="加粗"
        >
          <Icon icon="ep:bold" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
          title="斜体"
        >
          <Icon icon="mdi:format-italic" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
          title="下划线"
        >
          <Icon icon="mdi:format-underline" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
          title="删除线"
        >
          <Icon icon="mdi:format-strikethrough" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 标题按钮组 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          title="标题1"
        >
          H1
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="标题2"
        >
          H2
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="标题3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 列表按钮组 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
          title="无序列表"
        >
          <Icon icon="mdi:format-list-bulleted" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          title="有序列表"
        >
          <Icon icon="mdi:format-list-numbered" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('taskList') }"
          @click="editor.chain().focus().toggleTaskList().run()"
          title="任务列表"
        >
          <Icon icon="mdi:checkbox-marked-outline" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 对齐按钮组 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()"
          title="左对齐"
        >
          <Icon icon="mdi:format-align-left" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()"
          title="居中"
        >
          <Icon icon="mdi:format-align-center" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()"
          title="右对齐"
        >
          <Icon icon="mdi:format-align-right" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 引用和代码 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
          title="引用"
        >
          <Icon icon="mdi:format-quote-close" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
          title="行内代码"
        >
          <Icon icon="mdi:code-tags" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          title="代码块"
        >
          <Icon icon="mdi:code-braces-box" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 高亮和链接 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('highlight') }"
          @click="editor.chain().focus().toggleHighlight().run()"
          title="高亮"
        >
          <Icon icon="mdi:marker" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor.isActive('link') }"
          @click="setLink"
          title="链接"
        >
          <Icon icon="mdi:link" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 表格 -->
      <div class="toolbar-group">
        <button class="toolbar-btn" @click="insertTable" title="插入表格">
          <Icon icon="mdi:table" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 撤销/重做 -->
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          title="撤销"
        >
          <Icon icon="mdi:undo" />
        </button>
        <button
          class="toolbar-btn"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          title="重做"
        >
          <Icon icon="mdi:redo" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 预览功能 -->
      <div class="toolbar-group">
        <button class="toolbar-btn" @click="previewHtml" title="预览 HTML">
          <Icon icon="mdi:eye" />
        </button>
        <button class="toolbar-btn" @click="previewPdf" title="导出 PDF">
          <Icon icon="mdi:file-pdf-box" />
        </button>
      </div>
    </div>

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
import { ref, onBeforeUnmount, watch, computed } from 'vue'
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
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'

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
    })
  ],
  onUpdate: ({ editor }) => {
    // 防止组件销毁后触发回调
    if (isComponentDestroyed) return
    emit('update', editor.getHTML())
  },
  onCreate: ({ editor }) => {
    // 防止组件销毁后触发回调
    if (isComponentDestroyed) return
    emit('ready', editor)
  }
})

// 设置链接
const setLink = () => {
  if (!editor.value) return

  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('输入链接地址', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// 插入表格
const insertTable = () => {
  if (!editor.value) return
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

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

.tiptap-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: #111827;
  }

  &.active {
    background: #dbeafe;
    color: #2563eb;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #d1d5db;
  margin: 0 6px;
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
</style>
