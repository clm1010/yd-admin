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
      <div class="heading-panel" :class="{ expanded: isHeadingExpanded }">
        <!-- 第一行 -->
        <div class="heading-row">
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('paragraph') && !editor?.isActive('heading') }"
            @click="editor?.chain().focus().setParagraph().run()"
          >
            <span class="heading-title">正文</span>
            <span class="heading-label">Text</span>
          </button>
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 1 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
          >
            <span class="heading-title h1">标题 1</span>
            <span class="heading-label">H1</span>
          </button>
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 2 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
          >
            <span class="heading-title h2">标题 2</span>
            <span class="heading-label">H2</span>
          </button>
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 3 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
          >
            <span class="heading-title h3">标题 3</span>
            <span class="heading-label">H3</span>
          </button>
          <div class="heading-scroll">
            <button
              class="scroll-btn"
              @click="toggleHeadingExpand"
              :title="isHeadingExpanded ? '收起' : '更多'"
            >
              <Icon :icon="isHeadingExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
            </button>
          </div>
        </div>
        <!-- 第二行 -->
        <div class="heading-row">
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 4 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 4 }).run()"
          >
            <span class="heading-title h4">标题 4</span>
            <span class="heading-label">H4</span>
          </button>
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 5 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 5 }).run()"
          >
            <span class="heading-title h5">标题 5</span>
            <span class="heading-label">H5</span>
          </button>
          <button
            class="heading-btn"
            :class="{ active: editor?.isActive('heading', { level: 6 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 6 }).run()"
          >
            <span class="heading-title h6">标题 6</span>
            <span class="heading-label">H6</span>
          </button>
        </div>
      </div>
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

    <!-- 文档预览对话框 -->
    <el-dialog
      v-model="documentPreviewVisible"
      :fullscreen="true"
      :show-close="false"
      class="document-preview-dialog"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="preview-header">
          <div class="header-left">
            <button class="menu-btn" @click="togglePreviewSidebar">
              <Icon icon="mdi:menu" />
            </button>
            <span class="doc-title">{{ documentTitle || '示例文档' }}</span>
          </div>
          <div class="header-right">
            <button class="close-btn" @click="closeDocumentPreview">
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>
      </template>
      <div class="preview-body">
        <div class="preview-content-wrapper">
          <div class="preview-page" :style="{ transform: `scale(${previewZoom / 100})` }">
            <div class="page-content" v-html="previewContent"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="preview-footer">
          <div class="footer-left">
            <button class="sidebar-btn" @click="togglePreviewSidebar">
              <Icon icon="mdi:dock-left" />
              <span>打开边栏</span>
            </button>
          </div>
          <div class="footer-right">
            <button class="zoom-btn" @click="togglePreviewFullscreen" title="全屏">
              <Icon icon="mdi:fullscreen" />
            </button>
            <div class="zoom-slider">
              <button class="zoom-btn" @click="zoomOut" title="缩小">
                <Icon icon="mdi:minus" />
              </button>
              <el-slider
                v-model="previewZoom"
                :min="50"
                :max="200"
                :step="10"
                :show-tooltip="false"
                class="zoom-slider-input"
              />
              <button class="zoom-btn" @click="zoomIn" title="放大">
                <Icon icon="mdi:plus" />
              </button>
            </div>
            <button class="zoom-btn fit-btn" @click="fitToWidth" title="适应宽度">
              <Icon icon="mdi:fit-to-page-outline" />
            </button>
            <span class="zoom-value">{{ previewZoom }}%</span>
          </div>
        </div>
      </template>
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

// 文档预览
const documentPreviewVisible = ref(false)
const documentTitle = ref('')
const previewContent = ref('')
const previewZoom = ref(100)
const previewSidebarVisible = ref(false)

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

    // 配置转换选项 - 增强样式映射以保持更好的排版
    const options: any = {
      styleMap: wordImportOptions.preserveStyles
        ? [
            // 标题映射
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            "p[style-name='标题 4'] => h4:fresh",
            "p[style-name='标题'] => h1:fresh",
            // 文本样式映射
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "r[style-name='加粗'] => strong",
            "r[style-name='斜体'] => em",
            "r[style-name='下划线'] => u",
            // 引用
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='Block Quote'] => blockquote:fresh",
            "p[style-name='引用'] => blockquote:fresh",
            // 列表
            "p[style-name='List Paragraph'] => p:fresh",
            "p[style-name='列表段落'] => p:fresh",
            // 正文
            "p[style-name='Normal'] => p:fresh",
            "p[style-name='正文'] => p:fresh",
            // 保持表格
            'table => table',
            // 代码
            "p[style-name='Code'] => pre:fresh",
            "r[style-name='Code'] => code"
          ]
        : [],
      // 保持行内样式
      includeDefaultStyleMap: true,
      // 保持嵌入式样式
      includeEmbeddedStyleMap: true
    }

    // 处理图片 - 使用 mammoth 的图片转换功能
    if (wordImportOptions.convertImages) {
      // mammoth.images.imgElement 返回一个图片转换器
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
          'image/png': (image: any) => {
            return image.read('base64').then((imageBuffer: string) => {
              return { src: `data:image/png;base64,${imageBuffer}` }
            })
          },
          'image/jpeg': (image: any) => {
            return image.read('base64').then((imageBuffer: string) => {
              return { src: `data:image/jpeg;base64,${imageBuffer}` }
            })
          },
          'image/gif': (image: any) => {
            return image.read('base64').then((imageBuffer: string) => {
              return { src: `data:image/gif;base64,${imageBuffer}` }
            })
          }
        }
      }
    }

    // 使用正确的 mammoth 引用
    const mammothLib = mammoth.default || mammoth
    const result = await mammothLib.convertToHtml({ arrayBuffer }, options)

    // 处理HTML内容
    let html = result.value

    // 清理和优化HTML
    html = cleanWordHtml(html)

    wordImportPreview.value = html

    // 显示警告信息（过滤掉不重要的警告）
    if (result.messages.length > 0) {
      // 过滤掉已知的、不影响功能的警告
      const ignoredPatterns = [
        'v:path',
        'v:fill',
        'v:stroke',
        'v:shape',
        'v:rect',
        'v:oval',
        'v:line',
        'v:imagedata',
        'v:textbox',
        'v:formulas',
        'office:office',
        'office-word',
        'urn:schemas-microsoft-com',
        'image/x-emf',
        'image/x-wmf',
        'OLEObject',
        'lock',
        'anchorlock'
      ]

      const importantWarnings = result.messages.filter((m: any) => {
        if (m.type !== 'warning') return false
        const msg = m.message || ''
        // 检查是否包含可忽略的模式
        return !ignoredPatterns.some((pattern) => msg.toLowerCase().includes(pattern.toLowerCase()))
      })

      if (importantWarnings.length > 0) {
        console.warn('Word导入警告:', importantWarnings)
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

// 清理 Word 导出的 HTML - 保持更好的排版
const cleanWordHtml = (html: string): string => {
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

  html = html.replace(/<img([^>]*)style="([^"]*)"/gi, (match, attrs, style) => {
    // 提取宽度和高度
    const widthMatch = style.match(/width:\s*([^;]+)/i)
    const heightMatch = style.match(/height:\s*([^;]+)/i)

    let width = 0
    let height = 0

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

    if (heightMatch) {
      const heightStr = heightMatch[1].trim()
      if (heightStr.endsWith('pt')) {
        height = parseFloat(heightStr) * 1.33
      } else if (heightStr.endsWith('in')) {
        height = parseFloat(heightStr) * 96
      } else if (heightStr.endsWith('cm')) {
        height = parseFloat(heightStr) * 37.8
      } else if (heightStr.endsWith('mm')) {
        height = parseFloat(heightStr) * 3.78
      } else if (heightStr.endsWith('%')) {
        height = 0
      } else {
        height = parseFloat(heightStr) || 0
      }
    }

    // 限制最大宽度
    if (width > MAX_IMAGE_WIDTH) {
      const ratio = height / width
      width = MAX_IMAGE_WIDTH
      height = width * ratio
    }

    let newStyle = 'max-width: 100%;'
    if (width > 0) newStyle = `width: ${Math.round(width)}px; max-width: 100%;`
    if (height > 0) newStyle += ` height: ${Math.round(height)}px;`

    return `<img${attrs}style="${newStyle}"`
  })

  // 处理没有 style 属性的图片
  html = html.replace(/<img(?![^>]*style=)([^>]*)>/gi, '<img$1 style="max-width: 100%;">')

  // 处理表格样式
  html = html.replace(
    /<table([^>]*)>/gi,
    '<table$1 style="border-collapse: collapse; width: 100%;">'
  )
  html = html.replace(/<td([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('style=')) {
      return match.replace(/style="([^"]*)"/i, 'style="$1; border: 1px solid #ddd; padding: 8px;"')
    }
    return `<td${attrs} style="border: 1px solid #ddd; padding: 8px;">`
  })
  html = html.replace(/<th([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('style=')) {
      return match.replace(
        /style="([^"]*)"/i,
        'style="$1; border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;"'
      )
    }
    return `<th${attrs} style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">`
  })

  // 保持文本对齐
  html = html.replace(/text-align:\s*(left|center|right|justify)/gi, 'text-align: $1')

  // 保持缩进（转换为 padding-left）
  html = html.replace(/text-indent:\s*([^;]+)/gi, 'text-indent: $1')

  // 保持行高
  html = html.replace(/line-height:\s*([^;]+)/gi, 'line-height: $1')

  // 处理列表缩进
  html = html.replace(
    /<p[^>]*style="[^"]*margin-left:\s*(\d+)([^;]*)[^"]*"[^>]*>\s*[-•●○]\s*/gi,
    '<li style="margin-left: $1$2">'
  )

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

  previewContent.value = editor.value.getHTML()
  documentTitle.value = '示例文档'
  previewZoom.value = 100
  documentPreviewVisible.value = true
}

// 关闭文档预览
const closeDocumentPreview = () => {
  documentPreviewVisible.value = false
  previewContent.value = ''
}

// 切换预览侧边栏
const togglePreviewSidebar = () => {
  previewSidebarVisible.value = !previewSidebarVisible.value
}

// 切换全屏
const togglePreviewFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

// 缩小
const zoomOut = () => {
  if (previewZoom.value > 50) {
    previewZoom.value -= 10
  }
}

// 放大
const zoomIn = () => {
  if (previewZoom.value < 200) {
    previewZoom.value += 10
  }
}

// 适应宽度
const fitToWidth = () => {
  previewZoom.value = 100
}

// 标题样式展开/收起
const isHeadingExpanded = ref(false)
const toggleHeadingExpand = () => {
  isHeadingExpanded.value = !isHeadingExpanded.value
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
  position: relative;
  width: 292px;
  height: 66px;
  z-index: 5; // 确保不被前面的元素遮挡

  .heading-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
    max-height: 66px;
    overflow: hidden;

    &.expanded {
      max-height: 140px; // 足够容纳两行
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 100;
    }
  }

  .heading-row {
    display: flex;
    gap: 4px;
    align-items: stretch;
  }

  .heading-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 48px;
    padding: 4px 8px;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: #1a73e8;
      background: #f0f7ff;
    }

    &.active {
      background: #d3e3fd;
      border-color: #1a73e8;
    }

    .heading-title {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      line-height: 1.2;

      &.h1 {
        font-size: 15px;
        font-weight: 700;
      }

      &.h2 {
        font-size: 14px;
        font-weight: 600;
      }

      &.h3 {
        font-size: 13px;
        font-weight: 600;
      }

      &.h4 {
        font-size: 12px;
        font-weight: 600;
      }

      &.h5 {
        font-size: 11px;
        font-weight: 600;
      }

      &.h6 {
        font-size: 10px;
        font-weight: 600;
      }
    }

    .heading-label {
      font-size: 10px;
      color: #999;
      margin-top: 2px;
    }
  }

  .heading-scroll {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 2px;

    .scroll-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #999;
      border-radius: 4px;

      &:hover {
        background: #f0f0f0;
        color: #333;
      }

      :deep(svg) {
        width: 16px;
        height: 16px;
      }
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

// 文档预览对话框样式
:global(.document-preview-dialog) {
  .el-dialog__header {
    padding: 0;
    margin: 0;
  }

  .el-dialog__body {
    padding: 0;
    height: calc(100vh - 100px);
    background: #f0f0f0;
  }

  .el-dialog__footer {
    padding: 0;
    border-top: 1px solid #e0e0e0;
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #333;

      &:hover {
        background: #f0f0f0;
      }

      :deep(svg) {
        width: 24px;
        height: 24px;
      }
    }

    .doc-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
  }

  .header-right {
    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #666;

      &:hover {
        background: #f0f0f0;
        color: #333;
      }

      :deep(svg) {
        width: 24px;
        height: 24px;
      }
    }
  }
}

.preview-body {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  overflow: auto;
  padding: 40px 20px;
  background: #e8eaed;
}

.preview-content-wrapper {
  transform-origin: top center;
}

.preview-page {
  width: 794px;
  min-height: 1123px;
  background: #fff;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.1),
    0 0 1px rgba(0, 0, 0, 0.1);
  padding: 96px 120px;
  transform-origin: top center;
  position: relative;

  // 页面边角装饰
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 20px;
    width: 30px;
    height: 30px;
    border-left: 2px solid #ccc;
    border-top: 2px solid #ccc;
  }

  &::after {
    content: '';
    position: absolute;
    top: 20px;
    right: 20px;
    width: 30px;
    height: 30px;
    border-right: 2px solid #ccc;
    border-top: 2px solid #ccc;
  }
}

.page-content {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333;

  :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
    color: #1a1a1a;
  }

  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    color: #2a2a2a;
  }

  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin-top: 1.2em;
    margin-bottom: 0.5em;
    color: #3a3a3a;
  }

  :deep(p) {
    margin: 1em 0;
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
    font-style: italic;
    background: #f8fafc;
    padding: 0.5em 1em;
  }

  :deep(code) {
    background: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
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
    font-weight: 600;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  :deep(a) {
    color: #2563eb;
    text-decoration: underline;
  }
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;

  .footer-left {
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
      font-size: 13px;

      &:hover {
        background: #f0f0f0;
        color: #333;
      }

      :deep(svg) {
        width: 18px;
        height: 18px;
      }
    }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .zoom-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #666;

      &:hover {
        background: #f0f0f0;
        color: #333;
      }

      :deep(svg) {
        width: 18px;
        height: 18px;
      }

      &.fit-btn {
        :deep(svg) {
          width: 20px;
          height: 20px;
        }
      }
    }

    .zoom-slider {
      display: flex;
      align-items: center;
      gap: 4px;

      .zoom-slider-input {
        width: 100px;

        :deep(.el-slider__runway) {
          height: 4px;
          background: #e0e0e0;
        }

        :deep(.el-slider__bar) {
          height: 4px;
          background: #1a73e8;
        }

        :deep(.el-slider__button) {
          width: 12px;
          height: 12px;
          border: 2px solid #1a73e8;
        }
      }
    }

    .zoom-value {
      min-width: 45px;
      font-size: 13px;
      color: #666;
      text-align: right;
    }
  }
}
</style>
