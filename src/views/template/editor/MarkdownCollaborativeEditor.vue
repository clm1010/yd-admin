<template>
  <div class="markdown-collaborative-editor flex flex-col h-screen overflow-hidden bg-gray-100">
    <!-- 顶部状态栏 -->
    <div
      class="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0"
    >
      <div class="flex items-center gap-4">
        <el-button link @click="goBack">
          <Icon icon="ep:arrow-left" class="mr-1" /> 返回
        </el-button>
        <!-- 文档标题 -->
        <div class="text-lg font-bold text-gray-800">{{ documentTitle }}</div>
        <el-tag type="success" size="small" v-if="isCollaborationReady">
          <Icon icon="mdi:cursor-default-click" class="mr-1" />
          协同光标已启用
        </el-tag>
      </div>
      <div class="flex items-center gap-3">
        <!-- 连接状态 -->
        <div class="mr-4 flex items-center text-xs text-gray-500">
          <span
            class="w-2 h-2 rounded-full mr-2 transition-colors duration-300"
            :class="{
              'bg-green-500': connectionStatus === '已连接',
              'bg-red-500': connectionStatus === '连接断开',
              'bg-yellow-500': connectionStatus === '连接中...' || connectionStatus === '未连接'
            }"
          ></span>
          {{ connectionStatus }}
        </div>
        <el-button type="primary" plain size="default" @click="handleSubmitAudit"
          >提交审核</el-button
        >
        <el-button type="primary" size="default" @click="handleSave" :loading="isSaving">
          保存
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 编辑器容器 -->
      <div class="flex-1 flex flex-col overflow-hidden bg-gray-100 p-4">
        <div class="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <MarkdownEditor
            v-if="provider && ydoc"
            ref="markdownEditorRef"
            :ydoc="ydoc!"
            :provider="provider!"
            :user="currentUser"
            :title="documentTitle"
            :placeholder="'开始编写 ' + documentTitle + '...'"
            :loading="!isCollaborationReady"
            @update="handleContentUpdate"
            @ready="handleEditorReady"
          />
        </div>
      </div>

      <!-- 右侧协同面板 (固定) -->
      <div class="w-[300px] flex-shrink-0 border-l border-gray-200 bg-white h-full z-10 shadow-sm">
        <MarkdownCollaborationPanel
          :collaborators="collaborators"
          :materials="referenceMaterials"
          :properties="docProperties"
          @click-material="handleMaterialClick"
        />
      </div>

      <!-- 参考素材抽屉 (无遮罩，从协同面板左侧滑出) -->
      <el-drawer
        v-model="drawerVisible"
        :title="currentMaterial?.title || '参考素材'"
        :modal="false"
        :lock-scroll="false"
        :append-to-body="true"
        modal-class="material-drawer-overlay"
        :close-on-click-modal="false"
        direction="rtl"
        class="material-drawer"
        :show-close="true"
        :style="{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '500px',
          height: '100%'
        }"
      >
        <div v-if="currentMaterial" class="h-full flex flex-col">
          <div class="text-xs text-gray-400 mb-4 flex justify-between">
            <span>发布时间: {{ currentMaterial.date }}</span>
            <span>作者: {{ currentMaterial.author }}</span>
          </div>
          <div
            class="prose prose-sm flex-1 overflow-y-auto border p-3 rounded bg-gray-50 mb-4"
            v-html="currentMaterial.content"
          ></div>
          <div class="flex justify-end gap-2">
            <el-button type="primary" @click="copyContent(currentMaterial.content)">
              复制内容
            </el-button>
            <el-button @click="drawerVisible = false">关闭</el-button>
          </div>
        </div>
      </el-drawer>
    </div>

    <!-- 提交审核弹窗 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="提交审核"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="auditFormRef" :model="auditFormData" label-width="100px">
        <el-form-item label="审核人">
          <el-select v-model="auditFormData.auditor" placeholder="请选择审核人" class="w-full">
            <el-option
              v-for="item in auditorOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核说明">
          <el-input
            v-model="auditFormData.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Icon } from '@/components/Icon'
import MarkdownCollaborationPanel from './components/MarkdownCollaborationPanel.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import { useCollaborationUserStore } from '@/store/modules/collaborationUser'
import { defaultMarkdownConfig } from './config/markdownConfig'
import {
  getReferenceMaterials,
  saveMarkdownFile,
  submitAudit,
  type MarkdownDocumentInfo
} from './api/markdownApi'

// Props
interface Props {
  docId?: string
}

const props = withDefaults(defineProps<Props>(), {
  docId: 'demo-template'
})

const router = useRouter()
const route = useRoute()
const collaborationUserStore = useCollaborationUserStore()

// 获取文档 ID - 优先使用路由参数 id，其次使用 props.docId
const documentId = computed(() => {
  return (route.params.id as string) || props.docId
})

// 获取协作用户信息（从 sessionStorage 中获取，确保刷新时用户一致）
const collaborationUser = collaborationUserStore.getOrCreateUser()
const currentUser = reactive({
  id: collaborationUser.id,
  name: collaborationUser.name,
  avatar: '',
  color: collaborationUser.color,
  role: '编辑者',
  joinTime: Date.now()
})

// 文档信息
const documentInfo = ref<MarkdownDocumentInfo | null>(null)
const documentTitle = computed(() => {
  return (route.query.title as string) || documentInfo.value?.title || '模板文档'
})

// Emits
const emit = defineEmits<{
  connectionChange: [status: string]
  collaboratorsChange: [users: any[]]
}>()

// 状态
const connectionStatus = ref('未连接')
const collaborators = ref<any[]>([])
const isCollaborationReady = ref(false)
const isSaving = ref(false)
const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null)
const editorInstance = ref<any>(null)
let isComponentDestroyed = false // 标记组件是否已销毁
let hasShownConnectedMessage = false // 是否已显示连接成功消息
let hasShownSyncedMessage = false // 是否已显示同步完成消息

// 参考素材
const referenceMaterials = ref<any[]>([])

// 文档属性 - 使用与 document 一致的格式
const docProperties = computed(() => ({
  createTime: documentInfo.value?.createTime
    ? dayjs(documentInfo.value.createTime).format('YYYY-MM-DD HH:mm:ss')
    : dayjs().format('YYYY-MM-DD HH:mm:ss'),
  updateTime: documentInfo.value?.updateTime
    ? dayjs(documentInfo.value.updateTime).format('YYYY-MM-DD HH:mm:ss')
    : dayjs().format('YYYY-MM-DD HH:mm:ss'),
  version: documentInfo.value?.version || 'V1.0',
  tags: documentInfo.value?.tags || []
}))

// 抽屉状态
const drawerVisible = ref(false)
const currentMaterial = ref<any>(null)

// 审核弹窗
const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const auditFormData = reactive({
  auditor: '',
  comment: ''
})

// 审核人选项
const auditorOptions = [
  { label: '审核员A', value: 'auditor_a' },
  { label: '审核员B', value: 'auditor_b' },
  { label: '审核员C', value: 'auditor_c' }
]

// Yjs 和 WebSocket Provider
let ydoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null
let syncTimeoutId: ReturnType<typeof setTimeout> | null = null // 用于清理 setTimeout

// 处理素材点击
const handleMaterialClick = (item: any) => {
  currentMaterial.value = item
  drawerVisible.value = true
}

// 复制内容
const copyContent = (html: string) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const text = tempDiv.innerText || tempDiv.textContent || ''

  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success('内容已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

// 返回
const goBack = () => {
  router.back()
}

// 内容更新回调
const handleContentUpdate = (_content: string) => {
  // 可以在这里做自动保存等操作
}

// 编辑器就绪回调
const handleEditorReady = async (editor: any) => {
  editorInstance.value = editor
  console.log('Markdown 编辑器已就绪')

  // 如果有初始内容，设置到编辑器中
  if (initialMarkdownContent.value) {
    console.log('设置初始 Markdown 内容到编辑器')
    // 使用 setTimeout 确保协同编辑已完全初始化
    setTimeout(() => {
      if (editor && initialMarkdownContent.value) {
        editor.commands.setContent(initialMarkdownContent.value)
        console.log('初始内容已设置')
        // 清空初始内容，避免重复设置
        initialMarkdownContent.value = ''
      }
    }, 500)
  }
}

/**
 * 将 HTML 内容转换为 Markdown 格式
 * @param htmlContent HTML 内容
 * @returns Markdown 文本
 */
const htmlToMarkdown = (htmlContent: string): string => {
  if (!htmlContent) return ''

  let markdown = htmlContent
    // 处理标题
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // 处理粗体和斜体
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // 处理删除线
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
    .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
    // 处理行内代码
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // 处理链接
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // 处理图片
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
    // 处理水平线
    .replace(/<hr[^>]*\/?>/gi, '\n---\n\n')
    // 处理引用
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return (
        content
          .split('\n')
          .map((line: string) => `> ${line.trim()}`)
          .join('\n') + '\n\n'
      )
    })
    // 处理无序列表项
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // 移除 ul/ol 标签
    .replace(/<\/?ul[^>]*>/gi, '\n')
    .replace(/<\/?ol[^>]*>/gi, '\n')
    // 处理段落
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // 处理换行
    .replace(/<br[^>]*\/?>/gi, '\n')
    // 移除其他 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 解码 HTML 实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // 清理多余的空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return markdown
}

/**
 * 将 HTML 内容转换为 Markdown 文件的 Blob
 * @param htmlContent HTML 内容
 * @returns Blob 文件流（Markdown 格式）
 */
const htmlToMarkdownBlob = (htmlContent: string): Blob => {
  // 将 HTML 转换为 Markdown
  const markdownContent = htmlToMarkdown(htmlContent)

  return new Blob([markdownContent], {
    type: 'text/markdown;charset=utf-8'
  })
}

// 保存文档
const handleSave = async () => {
  if (!editorInstance.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }

  isSaving.value = true
  try {
    // 获取编辑器的 HTML 内容
    const content = editorInstance.value.getHTML()

    // 将 HTML 内容转换为 Markdown 文件 Blob
    const blob = htmlToMarkdownBlob(content)

    console.log('保存文件，文档ID:', documentId.value, '文件大小:', blob.size, 'bytes')

    // 调用保存文档接口，使用 .md 后缀
    const result = await saveMarkdownFile(documentId.value, blob, `${documentTitle.value}.md`)

    if (result.code === 200 || result.status === 200) {
      ElMessage.success('文档已保存')

      // 更新文档信息
      if (documentInfo.value) {
        documentInfo.value.updateTime = new Date().toISOString()
      }
    } else {
      throw new Error(result.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存文档失败:', error)
    ElMessage.error('保存失败: ' + (error as Error).message)
  } finally {
    isSaving.value = false
  }
}

// 提交审核
const handleSubmitAudit = () => {
  auditFormData.auditor = ''
  auditFormData.comment = ''
  auditDialogVisible.value = true
}

// 审核提交
const handleAuditSubmit = async () => {
  if (!auditFormData.auditor) {
    ElMessage.warning('请选择审核人')
    return
  }

  auditLoading.value = true
  try {
    await submitAudit({
      id: documentId.value,
      auditor: auditFormData.auditor,
      comment: auditFormData.comment
    })
    ElMessage.success('提交审核成功')
    auditDialogVisible.value = false
  } catch (error: any) {
    console.error('提交审核失败:', error)
    ElMessage.error(error.message || '提交审核失败')
  } finally {
    auditLoading.value = false
  }
}

// 初始化协同编辑
const initCollaboration = () => {
  try {
    // 重置消息标志
    hasShownConnectedMessage = false
    hasShownSyncedMessage = false

    // 初始化 Y.Doc
    ydoc = new Y.Doc()

    // 构建 WebSocket URL - 使用独立的 /markdown 路径
    const baseWsUrl = defaultMarkdownConfig.wsUrl

    // 初始化 WebSocket Provider
    provider = new WebsocketProvider(baseWsUrl, documentId.value, ydoc, {
      connect: true,
      params: {
        documentId: documentId.value,
        userId: String(currentUser.id),
        userName: currentUser.name,
        userColor: currentUser.color
      }
    })

    // 监听连接状态
    provider.on('status', (event: any) => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      const status = event.status

      if (status === 'disconnected') {
        connectionStatus.value = '连接断开'
        // 断开后重置消息标志，以便重连时能再次显示
        hasShownConnectedMessage = false
        hasShownSyncedMessage = false
      } else if (status === 'connected') {
        connectionStatus.value = '已连接'
        // 只显示一次连接成功消息
        if (!hasShownConnectedMessage) {
          hasShownConnectedMessage = true
          ElMessage.success('已连接到协同服务')
        }
        // 连接成功后更新协作者列表
        updateCollaborators()
      } else if (status === 'connecting') {
        connectionStatus.value = '连接中...'
      }

      emit('connectionChange', connectionStatus.value)
    })

    // 监听同步状态
    provider.on('sync', (synced: boolean) => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      if (synced && !hasShownSyncedMessage) {
        hasShownSyncedMessage = true
        // 同步完成后标记协同编辑就绪
        isCollaborationReady.value = true
        // 同步完成后更新协作者列表
        updateCollaborators()
      }
    })

    // 监听感知信息（在线用户）
    provider.awareness.on('change', () => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return
      updateCollaborators()
    })

    // 设置当前用户状态到 awareness
    const userState = {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      avatar: currentUser.avatar,
      role: currentUser.role,
      joinTime: currentUser.joinTime
    }
    provider.awareness.setLocalStateField('user', userState)

    // 立即更新一次协作者列表
    updateCollaborators()

    // 如果连接已建立但还没有收到 sync 事件，设置超时
    syncTimeoutId = setTimeout(() => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      if (!isCollaborationReady.value && provider?.wsconnected) {
        isCollaborationReady.value = true
      }
    }, 2000)
  } catch (error) {
    console.error('协同编辑初始化失败:', error)
    ElMessage.error('协同编辑初始化失败: ' + (error as Error).message)
  }
}

// 更新协作者列表（带防抖）
let updateCollaboratorsTimer: ReturnType<typeof setTimeout> | null = null
const updateCollaborators = () => {
  // 如果组件已销毁或 provider 不存在，不执行任何操作
  if (isComponentDestroyed || !provider) return

  // 防抖：避免频繁更新
  if (updateCollaboratorsTimer) {
    clearTimeout(updateCollaboratorsTimer)
  }

  updateCollaboratorsTimer = setTimeout(() => {
    if (isComponentDestroyed || !provider) return

    const states = provider.awareness.getStates()
    // 使用 Map 按用户 ID 去重，保留最新的连接
    const userMap = new Map<string, any>()

    states.forEach((state: any, clientId: number) => {
      if (state.user) {
        // 使用用户ID去重，如果没有ID则使用clientId
        const userId = state.user.id || `client_${clientId}`
        const isSelf = clientId === provider!.awareness.clientID

        // 如果是自己，优先使用；否则只在没有记录时添加
        if (isSelf || !userMap.has(userId)) {
          userMap.set(userId, {
            clientId,
            ...state.user,
            isSelf,
            isOwner: state.user.id === documentInfo.value?.creatorId
          })
        }
      }
    })

    // 转换为数组
    const users = Array.from(userMap.values())

    // 将当前用户排在第一位
    users.sort((a, b) => {
      if (a.isSelf) return -1
      if (b.isSelf) return 1
      return 0
    })

    collaborators.value = users
    emit('collaboratorsChange', users)
  }, 100) // 100ms 防抖
}

/**
 * Base64 转文本工具函数
 * @param base64 Base64 字符串 (data URL 格式)
 * @returns 解码后的文本内容
 */
const base64ToText = async (base64: string): Promise<string> => {
  try {
    // 从 data URL 提取 base64 数据
    const base64Data = base64.split(',')[1]
    if (!base64Data) {
      console.warn('无效的 base64 数据格式')
      return ''
    }

    // 解码 base64 为二进制
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 使用 TextDecoder 解码为 UTF-8 文本
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(bytes)
  } catch (error) {
    console.error('Base64 解码失败:', error)
    return ''
  }
}

/**
 * Markdown 转 HTML
 * 简单转换，支持基本的 Markdown 语法
 * @param markdown Markdown 文本
 * @returns HTML 内容
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return ''

  let html = markdown
    // 转义 HTML 特殊字符（但保留 Markdown 需要的字符）
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 删除线
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // 水平线
    .replace(/^---$/gm, '<hr>')
    .replace(/^\*\*\*$/gm, '<hr>')
    // 引用
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // 段落（连续的非空行）
    .replace(/\n\n/g, '</p><p>')

  // 包裹在段落中
  html = '<p>' + html + '</p>'

  // 清理多余的空段落
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1')
  html = html.replace(/<p>(<blockquote>)/g, '$1')
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<li>)/g, '<ul>$1')
  html = html.replace(/(<\/li>)<\/p>/g, '$1</ul>')

  // 合并连续的列表项
  html = html.replace(/<\/ul><ul>/g, '')

  return html
}

// 初始 Markdown 内容（用于编辑器初始化后设置）
const initialMarkdownContent = ref<string>('')

// 加载文档数据
const loadDocument = async () => {
  try {
    // 从 sessionStorage 获取文档信息（由 template 页面传递）
    const cachedDocInfoKey = `markdown_info_${documentId.value}`
    const cachedDocInfo = sessionStorage.getItem(cachedDocInfoKey)

    if (cachedDocInfo) {
      documentInfo.value = JSON.parse(cachedDocInfo) as MarkdownDocumentInfo
      console.log('从缓存加载文档信息:', documentInfo.value)
    } else {
      // 如果没有缓存的文档信息，使用默认值
      const now = new Date().toISOString()
      documentInfo.value = {
        id: documentId.value,
        title: (route.query.title as string) || '新模板',
        content: '',
        createTime: now,
        updateTime: now,
        version: 'V1.0',
        tags: [],
        creatorId: 0,
        creatorName: '未知'
      }
      console.log('使用默认文档信息:', documentInfo.value)
    }

    // 从 sessionStorage 获取 Markdown 内容（由 management 页面传递）
    const hasContent = route.query.hasContent === 'true'
    if (hasContent) {
      const cachedContentKey = `markdown_content_${documentId.value}`
      const cachedContent = sessionStorage.getItem(cachedContentKey)

      if (cachedContent) {
        console.log('从缓存加载 Markdown 内容')
        // 将 base64 解码为文本
        const markdownText = await base64ToText(cachedContent)
        console.log('解码后的 Markdown 内容长度:', markdownText.length)
        console.log('Markdown 内容前200字符:', markdownText.substring(0, 200))

        if (markdownText) {
          // 将 Markdown 转换为 HTML
          const htmlContent = markdownToHtml(markdownText)
          console.log('转换后的 HTML 内容长度:', htmlContent.length)

          // 存储初始内容，等编辑器就绪后设置
          initialMarkdownContent.value = htmlContent
        }

        // 清除缓存（一次性使用）
        sessionStorage.removeItem(cachedContentKey)
      }
    }

    // 加载参考素材
    referenceMaterials.value = await getReferenceMaterials(documentId.value)
  } catch (error) {
    console.error('加载文档失败:', error)
    // 确保即使出错也有默认值
    const now = new Date().toISOString()
    documentInfo.value = {
      id: documentId.value,
      title: (route.query.title as string) || '新模板',
      content: '',
      createTime: now,
      updateTime: now,
      version: 'V1.0',
      tags: [],
      creatorId: 0,
      creatorName: '未知'
    }
  }
}

// 监听文档ID变化
watch(
  () => documentId.value,
  () => {
    // 重新初始化
    if (provider) {
      provider.destroy()
    }
    if (ydoc) {
      ydoc.destroy()
    }
    isCollaborationReady.value = false
    loadDocument()
    initCollaboration()
  }
)

// 组件挂载
onMounted(async () => {
  loadDocument()
  initCollaboration()
})

// 组件卸载 - 完善的内存泄漏防护
onBeforeUnmount(() => {
  // 标记组件已销毁，防止异步回调继续执行
  isComponentDestroyed = true

  // 清理 setTimeout
  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId)
    syncTimeoutId = null
  }

  // 清理编辑器实例引用
  editorInstance.value = null
  markdownEditorRef.value = null

  // 销毁 WebSocket Provider
  if (provider) {
    try {
      // 移除所有事件监听器
      provider.awareness.off('change', updateCollaborators)
      // 移除用户状态
      provider.awareness.setLocalStateField('user', null)
    } catch (e) {
      // 忽略销毁时的错误
      console.warn('清理 provider 时出错:', e)
    }
    provider.destroy()
    provider = null
  }

  // 销毁 Y.Doc
  if (ydoc) {
    try {
      ydoc.destroy()
    } catch (e) {
      console.warn('清理 ydoc 时出错:', e)
    }
    ydoc = null
  }

  // 清理其他响应式引用
  collaborators.value = []
  referenceMaterials.value = []
  documentInfo.value = null
  currentMaterial.value = null

  console.log('Markdown 协同编辑组件已清理')
})
</script>

<style lang="scss" scoped>
// 抽屉动画
:deep(.material-drawer) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
</style>

<style lang="scss">
// 全局样式：让无遮罩的 drawer 不阻挡编辑器操作
// 由于 append-to-body，需要用全局样式
.material-drawer-overlay {
  // overlay/wrapper 不要拦截鼠标事件，确保编辑器可点
  pointer-events: none;
  background-color: transparent !important;

  .el-drawer__wrapper {
    pointer-events: none;
  }

  .el-drawer {
    pointer-events: auto;
  }
}
</style>
