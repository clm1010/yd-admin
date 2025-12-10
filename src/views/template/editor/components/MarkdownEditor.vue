<template>
  <div class="markdown-editor-wrapper">
    <!-- 工具栏 -->
    <div v-if="editor && !loading" class="editor-toolbar">
      <div class="toolbar-group">
        <!-- 撤销/重做 -->
        <button
          class="toolbar-btn"
          @click="editor?.chain().focus().undo().run()"
          :disabled="!editor?.can().undo()"
          title="撤销"
        >
          <Icon icon="mdi:undo" />
        </button>
        <button
          class="toolbar-btn"
          @click="editor?.chain().focus().redo().run()"
          :disabled="!editor?.can().redo()"
          title="重做"
        >
          <Icon icon="mdi:redo" />
        </button>
        <div class="toolbar-divider"></div>
      </div>

      <div class="toolbar-group">
        <!-- 标题 -->
        <el-dropdown trigger="click" @command="handleHeading">
          <button class="toolbar-btn" title="标题">
            <Icon icon="mdi:format-header-pound" />
            <Icon icon="mdi:chevron-down" class="ml-0.5 text-xs" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="1">标题 1</el-dropdown-item>
              <el-dropdown-item command="2">标题 2</el-dropdown-item>
              <el-dropdown-item command="3">标题 3</el-dropdown-item>
              <el-dropdown-item command="0">正文</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div class="toolbar-divider"></div>
      </div>

      <div class="toolbar-group">
        <!-- 格式化 -->
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('bold') }"
          @click="editor?.chain().focus().toggleBold().run()"
          title="粗体 (Ctrl+B)"
        >
          <Icon icon="mdi:format-bold" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('italic') }"
          @click="editor?.chain().focus().toggleItalic().run()"
          title="斜体 (Ctrl+I)"
        >
          <Icon icon="mdi:format-italic" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('underline') }"
          @click="editor?.chain().focus().toggleUnderline().run()"
          title="下划线 (Ctrl+U)"
        >
          <Icon icon="mdi:format-underline" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('strike') }"
          @click="editor?.chain().focus().toggleStrike().run()"
          title="删除线"
        >
          <Icon icon="mdi:format-strikethrough" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('code') }"
          @click="editor?.chain().focus().toggleCode().run()"
          title="行内代码"
        >
          <Icon icon="mdi:code-tags" />
        </button>
        <div class="toolbar-divider"></div>
      </div>

      <div class="toolbar-group">
        <!-- 列表 -->
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('bulletList') }"
          @click="editor?.chain().focus().toggleBulletList().run()"
          title="无序列表"
        >
          <Icon icon="mdi:format-list-bulleted" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('orderedList') }"
          @click="editor?.chain().focus().toggleOrderedList().run()"
          title="有序列表"
        >
          <Icon icon="mdi:format-list-numbered" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('taskList') }"
          @click="editor?.chain().focus().toggleTaskList().run()"
          title="任务列表"
        >
          <Icon icon="mdi:checkbox-marked-outline" />
        </button>
        <div class="toolbar-divider"></div>
      </div>

      <div class="toolbar-group">
        <!-- 引用/代码块 -->
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('blockquote') }"
          @click="editor?.chain().focus().toggleBlockquote().run()"
          title="引用"
        >
          <Icon icon="mdi:format-quote-close" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive('codeBlock') }"
          @click="editor?.chain().focus().toggleCodeBlock().run()"
          title="代码块"
        >
          <Icon icon="mdi:code-braces" />
        </button>
        <button class="toolbar-btn" @click="editor?.chain().focus().setHorizontalRule().run()" title="分割线">
          <Icon icon="mdi:minus" />
        </button>
        <div class="toolbar-divider"></div>
      </div>

      <div class="toolbar-group">
        <!-- 对齐 -->
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
          @click="editor?.chain().focus().setTextAlign('left').run()"
          title="左对齐"
        >
          <Icon icon="mdi:format-align-left" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
          @click="editor?.chain().focus().setTextAlign('center').run()"
          title="居中"
        >
          <Icon icon="mdi:format-align-center" />
        </button>
        <button
          class="toolbar-btn"
          :class="{ active: editor?.isActive({ textAlign: 'right' }) }"
          @click="editor?.chain().focus().setTextAlign('right').run()"
          title="右对齐"
        >
          <Icon icon="mdi:format-align-right" />
        </button>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content-wrapper" ref="contentWrapperRef">
      <div v-if="loading || !editor" class="p-6 h-full">
        <el-skeleton :rows="12" animated />
      </div>
      <template v-else>
        <div class="page-container">
          <div class="page-content">
            <editor-content :editor="editor" class="markdown-content" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - 忽略 Tiptap 版本不兼容导致的类型问题
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Icon } from '@/components/Icon'

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
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始编写模板内容...',
  title: '模板文档',
  loading: false
})

// Emits
const emit = defineEmits<{
  (e: 'update', content: string): void
  (e: 'ready', editor: any): void
}>()

// 标记组件是否已销毁，防止异步回调导致内存泄漏
let isComponentDestroyed = false

// 内容区域引用
const contentWrapperRef = ref<HTMLElement | null>(null)

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

// 处理标题选择
const handleHeading = (level: string) => {
  if (!editor.value) return
  const levelNum = parseInt(level)
  if (levelNum === 0) {
    editor.value.chain().focus().setParagraph().run()
  } else {
    editor.value.chain().focus().toggleHeading({ level: levelNum as 1 | 2 | 3 }).run()
  }
}

// 生成完整的 HTML 文档
const generateFullHtml = () => {
  if (!editor.value) return ''

  const content = editor.value.getHTML()
  const title = props.title || '模板文档'

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
    h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
    h2 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; }
    h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.2em; }
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
    }
    code {
      background: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    a { color: #2563eb; text-decoration: underline; }
    mark { background: #fef08a; padding: 0 2px; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    s { text-decoration: line-through; }
    u { text-decoration: underline; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
  </style>
</head>
<body>
${content}
</body>
</html>`
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
})

// 暴露编辑器实例和方法
defineExpose({
  editor,
  getHTML: () => editor.value?.getHTML() || '',
  generateFullHtml
})
</script>

<style lang="scss" scoped>
.markdown-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f4f5f7;
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  flex-wrap: wrap;

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: #e5e7eb;
    margin: 0 6px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      color: #333;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.active {
      background: #e0e7ff;
      color: #4f46e5;
    }

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
}

.editor-content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background: #e8eaed;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 60px;
  min-height: 100%;
}

.page-content {
  width: 794px;
  min-height: 1123px;
  background: #fff;
  padding: 96px 120px;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.08),
    0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.markdown-content {
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
</style>

