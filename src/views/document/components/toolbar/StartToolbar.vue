<template>
  <div class="start-toolbar">
    <!-- 撤销/重做 -->
    <div class="toolbar-group">
      <ToolbarButton
        icon="mdi:undo"
        title="撤销"
        :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()"
      />
      <ToolbarButton
        icon="mdi:redo"
        title="重做"
        :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 字体选择 -->
    <div class="toolbar-group">
      <el-select
        v-model="currentFontFamily"
        class="font-select"
        placeholder="字体"
        size="small"
        @change="handleFontFamily"
      >
        <el-option
          v-for="font in fontFamilyOptions"
          :key="font.value"
          :label="font.label"
          :value="font.value"
          :style="{ fontFamily: font.value }"
        />
      </el-select>
    </div>

    <!-- 字号选择 -->
    <div class="toolbar-group">
      <el-select
        v-model="currentFontSize"
        class="size-select"
        placeholder="字号"
        size="small"
        @change="handleFontSize"
      >
        <el-option
          v-for="size in fontSizeOptions"
          :key="size.value"
          :label="size.label"
          :value="size.value"
        />
      </el-select>
      <ToolbarButton
        icon="mdi:format-font-size-increase"
        title="增大字号"
        @click="increaseFontSize"
      />
      <ToolbarButton
        icon="mdi:format-font-size-decrease"
        title="减小字号"
        @click="decreaseFontSize"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 格式刷/清除格式 -->
    <div class="toolbar-group">
      <ToolbarButton
        icon="mdi:format-paint"
        title="格式刷"
        :active="formatPainterActive"
        @click="toggleFormatPainter"
      />
      <ToolbarButton icon="mdi:format-clear" title="清除格式" @click="clearFormat" />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 基本格式 -->
    <div class="toolbar-group">
      <ToolbarButton
        icon="mdi:format-bold"
        title="加粗"
        :active="editor?.isActive('bold')"
        @click="editor?.chain().focus().toggleBold().run()"
      />
      <ToolbarButton
        icon="mdi:format-italic"
        title="斜体"
        :active="editor?.isActive('italic')"
        @click="editor?.chain().focus().toggleItalic().run()"
      />
      <ToolbarButton
        icon="mdi:format-underline"
        title="下划线"
        :active="editor?.isActive('underline')"
        @click="editor?.chain().focus().toggleUnderline().run()"
      />
      <ToolbarButton
        icon="mdi:format-strikethrough"
        title="删除线"
        :active="editor?.isActive('strike')"
        @click="editor?.chain().focus().toggleStrike().run()"
      />
      <ToolbarButton
        icon="mdi:format-superscript"
        title="上标"
        :active="editor?.isActive('superscript')"
        @click="editor?.chain().focus().toggleSuperscript().run()"
      />
      <ToolbarButton
        icon="mdi:format-subscript"
        title="下标"
        :active="editor?.isActive('subscript')"
        @click="editor?.chain().focus().toggleSubscript().run()"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 颜色 -->
    <div class="toolbar-group">
      <ColorPicker
        v-model="textColor"
        icon="mdi:format-color-text"
        title="文字颜色"
        @change="handleTextColor"
      />
      <ColorPicker
        v-model="highlightColor"
        icon="mdi:format-color-highlight"
        title="高亮颜色"
        @change="handleHighlightColor"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 列表 -->
    <div class="toolbar-group">
      <ToolbarButton
        icon="mdi:format-list-numbered"
        title="有序列表"
        :active="editor?.isActive('orderedList')"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      />
      <ToolbarButton
        icon="mdi:format-list-bulleted"
        title="无序列表"
        :active="editor?.isActive('bulletList')"
        @click="editor?.chain().focus().toggleBulletList().run()"
      />
      <ToolbarButton
        icon="mdi:format-list-checks"
        title="任务列表"
        :active="editor?.isActive('taskList')"
        @click="editor?.chain().focus().toggleTaskList().run()"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 缩进和行高 -->
    <div class="toolbar-group">
      <ToolbarButton icon="mdi:format-indent-decrease" title="减少缩进" @click="decreaseIndent" />
      <ToolbarButton icon="mdi:format-indent-increase" title="增加缩进" @click="increaseIndent" />
      <el-popover placement="bottom" :width="120" trigger="click">
        <template #reference>
          <span>
            <el-tooltip content="行高" placement="bottom" :show-after="500">
              <button class="toolbar-btn">
                <Icon icon="mdi:format-line-spacing" class="btn-icon" />
                <Icon icon="ep:arrow-down" class="dropdown-arrow" />
              </button>
            </el-tooltip>
          </span>
        </template>
        <div class="line-height-menu">
          <div
            v-for="opt in lineHeightOptions"
            :key="opt.value"
            class="menu-item"
            :class="{ active: currentLineHeight === opt.value }"
            @click="handleLineHeight(opt.value as string)"
          >
            {{ opt.label }}
          </div>
        </div>
      </el-popover>
    </div>

    <div class="toolbar-divider"></div>

    <!-- 对齐方式 -->
    <div class="toolbar-group">
      <ToolbarButton
        icon="mdi:format-align-left"
        title="左对齐"
        :active="editor?.isActive({ textAlign: 'left' })"
        @click="editor?.chain().focus().setTextAlign('left').run()"
      />
      <ToolbarButton
        icon="mdi:format-align-center"
        title="居中"
        :active="editor?.isActive({ textAlign: 'center' })"
        @click="editor?.chain().focus().setTextAlign('center').run()"
      />
      <ToolbarButton
        icon="mdi:format-align-right"
        title="右对齐"
        :active="editor?.isActive({ textAlign: 'right' })"
        @click="editor?.chain().focus().setTextAlign('right').run()"
      />
      <ToolbarButton
        icon="mdi:format-align-justify"
        title="两端对齐"
        :active="editor?.isActive({ textAlign: 'justify' })"
        @click="editor?.chain().focus().setTextAlign('justify').run()"
      />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 标题样式 -->
    <div class="toolbar-group heading-group">
      <el-tooltip content="正文" placement="bottom" :show-after="500">
        <button
          class="heading-btn"
          :class="{ active: editor?.isActive('paragraph') && !editor?.isActive('heading') }"
          @click="editor?.chain().focus().setParagraph().run()"
        >
          正文
        </button>
      </el-tooltip>
      <el-tooltip content="标题 1" placement="bottom" :show-after="500">
        <button
          class="heading-btn h1"
          :class="{ active: editor?.isActive('heading', { level: 1 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          标题 1
        </button>
      </el-tooltip>
      <el-tooltip content="标题 2" placement="bottom" :show-after="500">
        <button
          class="heading-btn h2"
          :class="{ active: editor?.isActive('heading', { level: 2 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          标题 2
        </button>
      </el-tooltip>
      <el-tooltip content="标题 3" placement="bottom" :show-after="500">
        <button
          class="heading-btn h3"
          :class="{ active: editor?.isActive('heading', { level: 3 }) }"
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          标题 3
        </button>
      </el-tooltip>
    </div>

    <div class="toolbar-divider"></div>

    <!-- 导入/导出功能 -->
    <div class="toolbar-group">
      <el-tooltip content="导入 Word" placement="bottom" :show-after="500">
        <button class="toolbar-btn-large" @click="importWord">
          <Icon icon="mdi:file-word-outline" class="btn-icon-large" />
          <span class="btn-text">导入 Word</span>
        </button>
      </el-tooltip>
      <el-tooltip content="Markdown" placement="bottom" :show-after="500">
        <button class="toolbar-btn-large" @click="importMarkdown">
          <Icon icon="mdi:language-markdown-outline" class="btn-icon-large" />
          <span class="btn-text">Markdown</span>
        </button>
      </el-tooltip>
      <el-tooltip content="查找替换" placement="bottom" :show-after="500">
        <button class="toolbar-btn-large" @click="openFindReplace">
          <Icon icon="mdi:find-replace" class="btn-icon-large" />
          <span class="btn-text">查找替换</span>
        </button>
      </el-tooltip>
      <el-tooltip content="文档预览" placement="bottom" :show-after="500">
        <button class="toolbar-btn-large" @click="previewDocument">
          <Icon icon="mdi:file-eye-outline" class="btn-icon-large" />
          <span class="btn-text">文档预览</span>
        </button>
      </el-tooltip>
      <el-tooltip content="打印" placement="bottom" :show-after="500">
        <button class="toolbar-btn-large" @click="printDocument">
          <Icon icon="mdi:printer-outline" class="btn-icon-large" />
          <span class="btn-text">打印</span>
        </button>
      </el-tooltip>
    </div>

    <!-- 导入 Markdown 文件选择器 -->
    <input
      ref="mdFileInput"
      type="file"
      accept=".md,.markdown,.txt"
      style="display: none"
      @change="handleMdFile"
    />

    <!-- Word 导入对话框 -->
    <el-dialog
      v-model="wordImportDialogVisible"
      title="导入 Word 文档"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="word-import-content">
        <!-- 文件选择区域 -->
        <div class="upload-area" v-if="!wordImportFile">
          <el-upload
            class="word-uploader"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".doc,.docx"
            @change="handleWordFileSelect"
          >
            <Icon icon="mdi:file-word-outline" class="upload-icon" />
            <div class="upload-text">
              <p>将 Word 文档拖到此处，或<em>点击上传</em></p>
              <p class="upload-hint">支持 .doc 和 .docx 格式</p>
            </div>
          </el-upload>
        </div>

        <!-- 导入选项 -->
        <div class="import-options" v-if="wordImportFile">
          <div class="file-info">
            <Icon icon="mdi:file-word" class="file-icon" />
            <span class="file-name">{{ wordImportFile.name }}</span>
            <el-button text type="danger" size="small" @click="clearWordImport">
              <Icon icon="mdi:close" />
            </el-button>
          </div>
          <div class="options-row">
            <el-checkbox v-model="wordImportOptions.preserveStyles">保留文档样式</el-checkbox>
            <el-checkbox v-model="wordImportOptions.convertImages">转换图片</el-checkbox>
            <el-checkbox v-model="wordImportOptions.keepLineBreaks">保留换行</el-checkbox>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-area" v-if="wordImportPreview">
          <div class="preview-header">
            <span>预览</span>
            <el-tag type="success" size="small">解析成功</el-tag>
          </div>
          <div class="preview-content" v-html="wordImportPreview"></div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-area" v-if="wordImportLoading">
          <Icon icon="eos-icons:loading" class="loading-icon" />
          <p>正在解析文档...</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelWordImport">取消</el-button>
        <el-button
          type="primary"
          @click="confirmWordImport"
          :disabled="!wordImportPreview"
          :loading="wordImportLoading"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 查找替换对话框 -->
    <el-dialog
      v-model="findReplaceVisible"
      title="查找和替换"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="find-replace-content">
        <div class="find-row">
          <span class="label">查找:</span>
          <el-input v-model="findText" placeholder="输入要查找的内容" @keyup.enter="findNext" />
          <el-button @click="findNext">查找下一个</el-button>
        </div>
        <div class="find-row">
          <span class="label">替换:</span>
          <el-input v-model="replaceText" placeholder="输入替换内容" />
          <el-button @click="replaceOne">替换</el-button>
          <el-button type="primary" @click="replaceAll">全部替换</el-button>
        </div>
        <div class="find-options">
          <el-checkbox v-model="matchCase">区分大小写</el-checkbox>
          <el-checkbox v-model="matchWholeWord">全字匹配</el-checkbox>
        </div>
        <div v-if="findResultCount >= 0" class="find-result">
          找到 {{ findResultCount }} 处匹配
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - 忽略 Tiptap 自定义扩展命令的类型问题
import { ref, watch, reactive } from 'vue'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import ToolbarButton from './ToolbarButton.vue'
import ColorPicker from './ColorPicker.vue'
import { fontFamilyOptions, fontSizeOptions, lineHeightOptions } from './types'
import { useEditor } from './useEditor'

// 获取编辑器实例
const editor = useEditor()

// 状态
const formatPainterActive = ref(false)
const formatPainterStyle = ref<any>(null)
const textColor = ref('#000000')
const highlightColor = ref('#FFFF00')
const currentFontFamily = ref('')
const currentFontSize = ref('')
const currentLineHeight = ref('')

// 文件输入
const wordFileInput = ref<HTMLInputElement | null>(null)
const mdFileInput = ref<HTMLInputElement | null>(null)

// 查找替换
const findReplaceVisible = ref(false)
const findText = ref('')
const replaceText = ref('')
const matchCase = ref(false)
const matchWholeWord = ref(false)
const findResultCount = ref(-1)

// 监听编辑器选区变化，更新当前样式状态
watch(
  editor,
  (e) => {
    if (e) {
      // 更新当前字体
      const fontFamily = e.getAttributes('textStyle').fontFamily
      currentFontFamily.value = fontFamily || ''

      // 更新当前字号
      const fontSize = e.getAttributes('textStyle').fontSize
      currentFontSize.value = fontSize || ''
    }
  },
  { deep: true }
)

// 字体处理
const handleFontFamily = (value: string) => {
  if (!editor.value) return
  if (value) {
    editor.value.chain().focus().setFontFamily(value).run()
  } else {
    editor.value.chain().focus().unsetFontFamily().run()
  }
}

// 字号处理
const handleFontSize = (value: string) => {
  if (!editor.value) return
  if (value) {
    editor.value.chain().focus().setFontSize(value).run()
  } else {
    editor.value.chain().focus().unsetFontSize().run()
  }
}

// 增大字号
const fontSizeValues = [
  '9pt',
  '10pt',
  '10.5pt',
  '11pt',
  '12pt',
  '14pt',
  '16pt',
  '18pt',
  '20pt',
  '22pt',
  '24pt',
  '26pt',
  '28pt',
  '36pt',
  '42pt',
  '48pt',
  '72pt'
]
const increaseFontSize = () => {
  if (!editor.value) return
  const current = editor.value.getAttributes('textStyle').fontSize || '12pt'
  const currentIndex = fontSizeValues.findIndex((s) => s === current)
  if (currentIndex < fontSizeValues.length - 1) {
    const newSize = fontSizeValues[currentIndex + 1]
    editor.value.chain().focus().setFontSize(newSize).run()
    currentFontSize.value = newSize
  }
}

// 减小字号
const decreaseFontSize = () => {
  if (!editor.value) return
  const current = editor.value.getAttributes('textStyle').fontSize || '12pt'
  const currentIndex = fontSizeValues.findIndex((s) => s === current)
  if (currentIndex > 0) {
    const newSize = fontSizeValues[currentIndex - 1]
    editor.value.chain().focus().setFontSize(newSize).run()
    currentFontSize.value = newSize
  }
}

// 格式刷
const toggleFormatPainter = () => {
  if (!editor.value) return

  if (formatPainterActive.value) {
    formatPainterActive.value = false
    formatPainterStyle.value = null
    return
  }

  // 保存当前选区的格式
  const marks = editor.value.state.selection.$from.marks()
  formatPainterStyle.value = marks
  formatPainterActive.value = true

  ElMessage.info('已复制格式，请选择要应用格式的文本')
}

// 清除格式
const clearFormat = () => {
  if (!editor.value) return
  editor.value.chain().focus().unsetAllMarks().clearNodes().run()
}

// 文字颜色
const handleTextColor = (color: string) => {
  if (!editor.value) return
  if (color) {
    editor.value.chain().focus().setColor(color).run()
  } else {
    editor.value.chain().focus().unsetColor().run()
  }
}

// 高亮颜色
const handleHighlightColor = (color: string) => {
  if (!editor.value) return
  if (color) {
    editor.value.chain().focus().setHighlight({ color }).run()
  } else {
    editor.value.chain().focus().unsetHighlight().run()
  }
}

// 减少缩进
const decreaseIndent = () => {
  if (!editor.value) return
  if (editor.value.isActive('listItem')) {
    editor.value.chain().focus().liftListItem('listItem').run()
  }
}

// 增加缩进
const increaseIndent = () => {
  if (!editor.value) return
  if (editor.value.isActive('listItem')) {
    editor.value.chain().focus().sinkListItem('listItem').run()
  }
}

// 行高处理
const handleLineHeight = (value: string) => {
  if (!editor.value) return
  currentLineHeight.value = value
  // 需要自定义扩展来支持行高
  // editor.value.chain().focus().setLineHeight(value).run()
}

// 导入 Word 对话框状态
const wordImportDialogVisible = ref(false)
const wordImportLoading = ref(false)
const wordImportPreview = ref('')
const wordImportFile = ref<File | null>(null)
const wordImportOptions = reactive({
  preserveStyles: true,
  convertImages: true,
  keepLineBreaks: true
})

// 导入 Word
const importWord = () => {
  wordImportDialogVisible.value = true
  wordImportPreview.value = ''
  wordImportFile.value = null
}

const handleWordFileSelect = async (uploadFile: any) => {
  // Element Plus Upload 组件传递的是 UploadFile 对象
  const file = uploadFile.raw || uploadFile
  if (!file) return

  // 验证文件类型
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  if (!validTypes.includes(file.type) && !file.name.match(/\.(docx?|doc)$/i)) {
    ElMessage.error('请选择有效的 Word 文档 (.doc 或 .docx)')
    return
  }

  wordImportFile.value = file
  wordImportLoading.value = true

  try {
    // 动态导入 mammoth
    const mammoth = await import('mammoth')

    const arrayBuffer = await file.arrayBuffer()

    // 配置转换选项
    const options: any = {
      styleMap: wordImportOptions.preserveStyles
        ? [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='Block Quote'] => blockquote:fresh"
          ]
        : []
    }

    // 处理图片
    if (wordImportOptions.convertImages) {
      options.convertImage = mammoth.images.imgElement((image: any) => {
        return image.read('base64').then((imageBuffer: string) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`
          }
        })
      })
    }

    const result = await mammoth.convertToHtml({ arrayBuffer }, options)

    // 处理HTML内容
    let html = result.value

    // 清理和优化HTML
    html = cleanWordHtml(html)

    wordImportPreview.value = html

    // 显示警告信息
    if (result.messages.length > 0) {
      const warnings = result.messages.filter((m: any) => m.type === 'warning')
      if (warnings.length > 0) {
        console.warn('Word导入警告:', warnings)
      }
    }
  } catch (error) {
    console.error('Word导入失败:', error)
    ElMessage.error('Word 文档解析失败: ' + (error as Error).message)
    wordImportPreview.value = ''
    wordImportFile.value = null
  } finally {
    wordImportLoading.value = false
  }
}

// 清理 Word 导出的 HTML
const cleanWordHtml = (html: string): string => {
  // 移除多余的空段落
  html = html.replace(/<p>\s*<\/p>/g, '')

  // 清理多余的空格
  html = html.replace(/&nbsp;/g, ' ')

  // 移除 Word 特有的标签和属性
  html = html.replace(/class="[^"]*MsoNormal[^"]*"/g, '')
  html = html.replace(/style="[^"]*mso-[^"]*"/g, '')

  // 转换列表
  html = html.replace(/<p[^>]*>\s*[-•]\s*/g, '<li>')

  // 保持换行
  if (wordImportOptions.keepLineBreaks) {
    html = html.replace(/\n/g, '<br>')
  }

  return html.trim()
}

// 确认导入 Word
const confirmWordImport = () => {
  if (!editor.value || !wordImportPreview.value) {
    ElMessage.warning('没有可导入的内容')
    return
  }

  editor.value.chain().focus().setContent(wordImportPreview.value).run()
  wordImportDialogVisible.value = false
  wordImportPreview.value = ''
  wordImportFile.value = null
  ElMessage.success('Word 文档已成功导入')
}

// 清除 Word 文件选择
const clearWordImport = () => {
  wordImportFile.value = null
  wordImportPreview.value = ''
}

// 取消导入
const cancelWordImport = () => {
  wordImportDialogVisible.value = false
  wordImportPreview.value = ''
  wordImportFile.value = null
}

// 导入 Markdown
const importMarkdown = () => {
  mdFileInput.value?.click()
}

const handleMdFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    // 简单的 Markdown 转换（实际应用中应使用专业的 Markdown 解析器）
    if (editor.value) {
      editor.value.chain().focus().setContent(text).run()
      ElMessage.success('Markdown 文件已导入')
    }
  } catch (error) {
    ElMessage.error('文件读取失败')
  }
  ;(event.target as HTMLInputElement).value = ''
}

// 查找替换
const openFindReplace = () => {
  findReplaceVisible.value = true
}

const findNext = () => {
  if (!findText.value || !editor.value) return

  // 简单的查找实现
  const content = editor.value.getText()
  const searchText = matchCase.value ? findText.value : findText.value.toLowerCase()
  const searchIn = matchCase.value ? content : content.toLowerCase()

  const matches = []
  let index = searchIn.indexOf(searchText)
  while (index !== -1) {
    matches.push(index)
    index = searchIn.indexOf(searchText, index + 1)
  }

  findResultCount.value = matches.length
  if (matches.length === 0) {
    ElMessage.warning('未找到匹配内容')
  }
}

const replaceOne = () => {
  if (!findText.value || !editor.value) return
  ElMessage.info('替换功能需要更复杂的实现')
}

const replaceAll = () => {
  if (!findText.value || !editor.value) return
  const content = editor.value.getHTML()
  const regex = new RegExp(findText.value, matchCase.value ? 'g' : 'gi')
  const newContent = content.replace(regex, replaceText.value)
  editor.value.chain().focus().setContent(newContent).run()
  ElMessage.success('替换完成')
}

// 文档预览
const previewDocument = () => {
  if (!editor.value) return

  const content = editor.value.getHTML()
  const previewWindow = window.open('', '_blank')
  if (!previewWindow) {
    ElMessage.error('无法打开预览窗口')
    return
  }

  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>文档预览</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }
        p { line-height: 1.8; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        blockquote { border-left: 3px solid #1a73e8; padding-left: 1em; color: #666; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        pre { background: #1f2937; color: #fff; padding: 16px; border-radius: 8px; overflow-x: auto; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `)
  previewWindow.document.close()
}

// 打印文档
const printDocument = () => {
  if (!editor.value) return

  const content = editor.value.getHTML()
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>打印文档</title>
      <style>
        @media print { body { margin: 1cm; } }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }
        p { line-height: 1.8; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}
</script>

<style lang="scss" scoped>
.start-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 8px 12px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
}

.font-select {
  width: 100px;
}

.size-select {
  width: 80px;
}

:deep(.el-select) {
  .el-input__wrapper {
    box-shadow: none;
    border: 1px solid #e0e0e0;
    border-radius: 4px;

    &:hover {
      border-color: #1a73e8;
    }
  }
}

.toolbar-btn,
.toolbar-btn-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #333;
  transition: all 0.15s ease;

  &:hover {
    background: #e8f0fe;
    color: #1a73e8;
  }

  &.active {
    background: #d3e3fd;
    color: #1a73e8;
  }
}

.toolbar-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;

  .btn-icon {
    font-size: 16px;
  }

  .dropdown-arrow {
    font-size: 10px;
    margin-left: 2px;
  }
}

.toolbar-btn-large {
  flex-direction: column;
  padding: 6px 12px;
  gap: 2px;

  .btn-icon-large {
    font-size: 22px;
  }

  .btn-text {
    font-size: 11px;
  }
}

.heading-group {
  .heading-btn {
    padding: 4px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;

    &:hover {
      border-color: #1a73e8;
      color: #1a73e8;
    }

    &.active {
      background: #d3e3fd;
      border-color: #1a73e8;
      color: #1a73e8;
    }

    &.h1 {
      font-size: 16px;
      font-weight: bold;
    }

    &.h2 {
      font-size: 14px;
      font-weight: bold;
    }

    &.h3 {
      font-size: 13px;
      font-weight: bold;
    }
  }
}

.line-height-menu {
  .menu-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: #f5f5f5;
    }

    &.active {
      background: #e8f0fe;
      color: #1a73e8;
    }
  }
}

.find-replace-content {
  .find-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .label {
      width: 50px;
      flex-shrink: 0;
    }

    .el-input {
      flex: 1;
    }
  }

  .find-options {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  .find-result {
    color: #666;
    font-size: 13px;
  }
}

// Word 导入样式
.word-import-content {
  .upload-area {
    .word-uploader {
      width: 100%;

      :deep(.el-upload-dragger) {
        padding: 40px 20px;
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #1a73e8;
        }
      }
    }

    .upload-icon {
      font-size: 64px;
      color: #4285f4;
      margin-bottom: 16px;
    }

    .upload-text {
      p {
        margin: 0;
        color: #333;
        font-size: 14px;

        em {
          color: #1a73e8;
          font-style: normal;
          cursor: pointer;
        }
      }

      .upload-hint {
        margin-top: 8px;
        color: #999;
        font-size: 12px;
      }
    }
  }

  .import-options {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;

      .file-icon {
        font-size: 24px;
        color: #4285f4;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .options-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .preview-area {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
      color: #666;
    }

    .preview-content {
      max-height: 300px;
      overflow-y: auto;
      padding: 16px;
      font-size: 14px;
      line-height: 1.6;

      :deep(h1) {
        font-size: 1.5em;
        margin: 0.5em 0;
      }
      :deep(h2) {
        font-size: 1.25em;
        margin: 0.5em 0;
      }
      :deep(h3) {
        font-size: 1.1em;
        margin: 0.5em 0;
      }
      :deep(p) {
        margin: 0.5em 0;
      }
      :deep(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      :deep(th),
      :deep(td) {
        border: 1px solid #ddd;
        padding: 8px;
      }
      :deep(img) {
        max-width: 100%;
        height: auto;
      }
    }
  }

  .loading-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #666;

    .loading-icon {
      font-size: 48px;
      color: #1a73e8;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
