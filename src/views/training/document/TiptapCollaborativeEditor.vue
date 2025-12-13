<template>
  <div class="tiptap-collaborative-editor flex flex-col h-screen overflow-hidden bg-gray-100">
    <!-- 文件解析进度条遮罩 -->
    <div
      v-if="isParsingFile"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl">
        <el-progress
          type="circle"
          :percentage="parseProgress"
          :width="120"
          :stroke-width="8"
          :color="parseProgressColor"
        />
        <p class="mt-4 text-gray-600 text-sm">{{ parseProgressText }}</p>
      </div>
    </div>

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
        <el-button type="primary" plain size="default">提交审核</el-button>
        <!-- <el-button plain size="default">发布</el-button> -->
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
          <TiptapEditor
            v-if="provider && ydoc"
            ref="tiptapEditorRef"
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
        <CollaborationPanel
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
import CollaborationPanel from './components/CollaborationPanel.vue'
import TiptapEditor from './components/TiptapEditor.vue'
import { useCollaborationUserStore } from '@/store/modules/collaborationUser'
import { defaultCollaborationConfig } from './config/editorConfig'
import { getReferenceMaterials, saveDocumentFile, type DocumentInfo } from './api/documentApi'
import { parseFileContent } from './utils/wordParser'

// Props
interface Props {
  docId?: string
}

const props = withDefaults(defineProps<Props>(), {
  docId: 'demo-doc'
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
const documentInfo = ref<DocumentInfo | null>(null)
const documentTitle = computed(() => {
  return (route.query.title as string) || documentInfo.value?.title || '协同文档'
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
const tiptapEditorRef = ref<InstanceType<typeof TiptapEditor> | null>(null)
const editorInstance = ref<any>(null)
let isComponentDestroyed = false // 标记组件是否已销毁
let hasShownConnectedMessage = false // 是否已显示连接成功消息
let hasShownSyncedMessage = false // 是否已显示同步完成消息

// 预加载的文档内容（从权限校验接口获取的文件流）
const preloadedContent = ref<string>('')

// 文件解析进度状态
const isParsingFile = ref(false)
const parseProgress = ref(0)
const parseProgressText = ref('准备解析文件...')
const parseProgressColor = computed(() => {
  if (parseProgress.value < 30) return '#409eff'
  if (parseProgress.value < 70) return '#67c23a'
  return '#409eff'
})

// 参考素材
const referenceMaterials = ref<any[]>([])

// 文档属性 - 使用与 performance mockData 一致的格式
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
  // console.log('文档内容更新')
}

// 编辑器就绪回调
const handleEditorReady = async (editor: any) => {
  editorInstance.value = editor
  console.log('Tiptap 编辑器已就绪')

  // 如果有预加载的内容，设置到编辑器
  if (preloadedContent.value) {
    try {
      console.log('设置预加载内容到编辑器')
      // 使用 setContent 设置内容
      editor.commands.setContent(preloadedContent.value, false)
      ElMessage.success('文档内容已加载')
    } catch (error) {
      console.error('设置预加载内容失败:', error)
      ElMessage.warning('文档内容加载失败，请手动输入')
    }
  }
}

/**
 * 将 HTML 内容转换为 Word 文档的 Blob
 * @param htmlContent HTML 内容
 * @param title 文档标题
 * @returns Blob 文件流
 */
const htmlToDocxBlob = (htmlContent: string, title: string): Blob => {
  // 构建完整的 HTML 文档，包含 Word 兼容的样式
  const fullHtml = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <meta name="Originator" content="Microsoft Word">
  <title>${title}</title>
  <style>
    body { font-family: '宋体', SimSun, serif; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 22pt; font-weight: bold; }
    h2 { font-size: 16pt; font-weight: bold; }
    h3 { font-size: 14pt; font-weight: bold; }
    p { margin: 0.5em 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 5px; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
  `.trim()

  // 创建 Blob，使用 Word 兼容的 MIME 类型
  return new Blob([fullHtml], {
    type: 'application/vnd.ms-word;charset=utf-8'
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

    // 将 HTML 内容转换为 Word 文档的 Blob
    const blob = htmlToDocxBlob(content, documentTitle.value)

    console.log('保存文件，文档ID:', documentId.value, '文件大小:', blob.size, 'bytes')

    // 调用保存文档接口
    const result = await saveDocumentFile(documentId.value, blob, `${documentTitle.value}.doc`)

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

// 初始化协同编辑
const initCollaboration = () => {
  try {
    // 重置消息标志
    hasShownConnectedMessage = false
    hasShownSyncedMessage = false

    // 初始化 Y.Doc
    ydoc = new Y.Doc()

    // 构建 WebSocket URL
    const baseWsUrl = defaultCollaborationConfig.wsUrl

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

// 加载文档数据
const loadDocument = async () => {
  try {
    // 从 sessionStorage 获取文档信息（由 performance 页面传递）
    const cachedDocInfoKey = `doc_info_${documentId.value}`
    const cachedDocInfo = sessionStorage.getItem(cachedDocInfoKey)

    if (cachedDocInfo) {
      documentInfo.value = JSON.parse(cachedDocInfo) as DocumentInfo
      console.log('从缓存加载文档信息:', documentInfo.value)
    } else {
      // 如果没有缓存的文档信息，使用默认值
      const now = new Date().toISOString()
      documentInfo.value = {
        id: documentId.value,
        title: (route.query.title as string) || '新文档',
        content: '<p></p>',
        createTime: now,
        updateTime: now,
        version: 'V1.0',
        tags: [],
        creatorId: 0,
        creatorName: '未知'
      }
      console.log('使用默认文档信息:', documentInfo.value)
    }

    // 加载参考素材
    referenceMaterials.value = await getReferenceMaterials(documentId.value)
    // referenceMaterials.value = [
    //   {
    //     id: 1,
    //     title: '参考素材1',
    //     date: '2025-01-01',
    //     author: '张三',
    //     content: '参考素材1内容'
    //   },
    //   {
    //     id: 2,
    //     title: '参考素材2',
    //     date: '2025-01-02',
    //     author: '李四',
    //     content: '参考素材2内容'
    //   }
    // ]
  } catch (error) {
    console.error('加载文档失败:', error)
    // 确保即使出错也有默认值
    const now = new Date().toISOString()
    documentInfo.value = {
      id: documentId.value,
      title: (route.query.title as string) || '新文档',
      content: '<p></p>',
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

// 更新解析进度
const updateParseProgress = (progress: number, text: string) => {
  parseProgress.value = progress
  parseProgressText.value = text
}

// 组件挂载
onMounted(async () => {
  // 检查是否有预加载的文件内容（从权限校验流程中获取）
  const cachedContentKey = `doc_content_${documentId.value}`
  const cachedContent = sessionStorage.getItem(cachedContentKey)
  console.log(
    '文档ID:',
    documentId.value,
    '缓存键:',
    cachedContentKey,
    '是否有缓存:',
    !!cachedContent
  )

  // 只要有缓存内容就尝试解析，不再依赖 hasContent 参数
  if (cachedContent) {
    // 显示进度条
    isParsingFile.value = true
    parseProgress.value = 0
    parseProgressText.value = '准备解析文件...'

    try {
      console.log('发现预加载的文件内容，正在解析...', '内容长度:', cachedContent.length)

      // 更新进度：10%
      updateParseProgress(10, '正在读取文件内容...')

      // 解析 base64 文件流为文档内容，传递进度回调
      const parsedContent = await parseFileContent(cachedContent, updateParseProgress)

      if (parsedContent) {
        // 更新进度：90%
        updateParseProgress(90, '正在加载到编辑器...')

        preloadedContent.value = parsedContent
        console.log('预加载内容解析成功，HTML 长度:', parsedContent.length)

        // 更新进度：100%
        updateParseProgress(100, '解析完成！')
        await new Promise((resolve) => setTimeout(resolve, 300))
      } else {
        console.warn('解析结果为空')
        updateParseProgress(100, '文件内容为空')
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('解析预加载内容失败:', error)
      updateParseProgress(100, '解析失败')
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      // 清除 sessionStorage 中的缓存
      sessionStorage.removeItem(cachedContentKey)
      // 隐藏进度条
      isParsingFile.value = false
    }
  }

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
  tiptapEditorRef.value = null

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

  console.log('协同编辑组件已清理')
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
