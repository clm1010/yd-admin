<template>
  <div class="tiptap-collaborative-editor flex flex-col h-screen overflow-hidden bg-gray-100">
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
        <el-button plain size="default">发布</el-button>
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
            v-if="isCollaborationReady"
            ref="tiptapEditorRef"
            :ydoc="ydoc!"
            :provider="provider!"
            :user="currentUser"
            :title="documentTitle"
            :placeholder="'开始编写 ' + documentTitle + '...'"
            @update="handleContentUpdate"
            @ready="handleEditorReady"
          />
          <div v-else class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <Icon icon="eos-icons:loading" class="text-4xl text-blue-500 animate-spin mb-4" />
              <p class="text-gray-500">正在初始化协同编辑...</p>
            </div>
          </div>
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

      <!-- 参考素材抽屉 (无遮罩) -->
      <el-drawer
        v-model="drawerVisible"
        :title="currentMaterial?.title || '参考素材'"
        :modal="false"
        :lock-scroll="false"
        :append-to-body="false"
        size="400px"
        direction="rtl"
        class="material-drawer"
        :style="{ top: '0', height: '100%', position: 'absolute' }"
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
          <div class="flex justify-end">
            <el-button type="primary" size="small" @click="copyContent(currentMaterial.content)"
              >复制内容</el-button
            >
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
import { useUserStore } from '@/store/modules/user'
import { getRandomUserColor, defaultCollaborationConfig } from './config/editorConfig'
import {
  getDocument,
  saveDocument,
  getReferenceMaterials,
  type DocumentInfo
} from './api/documentApi'

// Props
interface Props {
  docId?: string
}

const props = withDefaults(defineProps<Props>(), {
  docId: 'demo-doc'
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 获取当前登录用户信息
const currentUser = reactive({
  id: userStore.getUser.id || Date.now(),
  name: userStore.getUser.nickname || '匿名用户',
  avatar: userStore.getUser.avatar || '',
  color: getRandomUserColor(),
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

// 参考素材
const referenceMaterials = ref<any[]>([])

// 文档属性
const docProperties = computed(() => ({
  createTime: documentInfo.value?.createTime
    ? dayjs(documentInfo.value.createTime).format('YYYY-MM-DD HH:mm')
    : '-',
  updateTime: documentInfo.value?.updateTime
    ? dayjs(documentInfo.value.updateTime).format('YYYY-MM-DD HH:mm')
    : dayjs().format('YYYY-MM-DD HH:mm'),
  version: documentInfo.value?.version || 'V1.0',
  tags: documentInfo.value?.tags || []
}))

// 抽屉状态
const drawerVisible = ref(false)
const currentMaterial = ref<any>(null)

// Yjs 和 WebSocket Provider
let ydoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null

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
const handleEditorReady = (editor: any) => {
  editorInstance.value = editor
  console.log('Tiptap 编辑器已就绪')
}

// 保存文档
const handleSave = async () => {
  if (!editorInstance.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }

  isSaving.value = true
  try {
    const content = editorInstance.value.getHTML()
    await saveDocument({
      id: props.docId,
      title: documentTitle.value,
      content
    })
    ElMessage.success('文档已保存')

    // 更新文档信息
    if (documentInfo.value) {
      documentInfo.value.updateTime = new Date().toISOString()
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + (error as Error).message)
  } finally {
    isSaving.value = false
  }
}

// 初始化协同编辑
const initCollaboration = () => {
  try {
    console.log('初始化 Tiptap 协同编辑...')

    // 初始化 Y.Doc
    ydoc = new Y.Doc()

    // 构建 WebSocket URL
    const baseWsUrl = defaultCollaborationConfig.wsUrl

    // 初始化 WebSocket Provider
    provider = new WebsocketProvider(baseWsUrl, props.docId, ydoc, {
      connect: true,
      params: {
        userId: String(currentUser.id),
        userName: currentUser.name,
        userColor: currentUser.color
      }
    })

    // 监听连接状态
    provider.on('status', (event: any) => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      console.log('WebSocket 状态:', event.status)
      const status = event.status

      if (status === 'disconnected') {
        connectionStatus.value = '连接断开'
      } else if (status === 'connected') {
        connectionStatus.value = '已连接'
        ElMessage.success('已连接到协同服务')
      } else if (status === 'connecting') {
        connectionStatus.value = '连接中...'
      }

      emit('connectionChange', connectionStatus.value)
    })

    // 监听同步状态
    provider.on('sync', (synced: boolean) => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      console.log('同步状态:', synced)
      if (synced) {
        console.log('文档已同步')
        // 同步完成后标记协同编辑就绪
        isCollaborationReady.value = true
      }
    })

    // 监听感知信息（在线用户）
    provider.awareness.on('change', () => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return
      updateCollaborators()
    })

    // 设置当前用户状态到 awareness
    provider.awareness.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      avatar: currentUser.avatar,
      role: currentUser.role,
      joinTime: currentUser.joinTime
    })

    // 如果连接已建立但还没有收到 sync 事件，设置超时
    setTimeout(() => {
      // 如果组件已销毁，不执行任何操作
      if (isComponentDestroyed) return

      if (!isCollaborationReady.value && provider?.wsconnected) {
        isCollaborationReady.value = true
      }
    }, 2000)

    console.log('协同编辑初始化成功')
  } catch (error) {
    console.error('协同编辑初始化失败:', error)
    ElMessage.error('协同编辑初始化失败: ' + (error as Error).message)
  }
}

// 更新协作者列表
const updateCollaborators = () => {
  // 如果组件已销毁或 provider 不存在，不执行任何操作
  if (isComponentDestroyed || !provider) return

  const states = provider.awareness.getStates()
  const users: any[] = []

  states.forEach((state: any, clientId: number) => {
    if (state.user) {
      users.push({
        clientId,
        ...state.user,
        isSelf: clientId === provider!.awareness.clientID,
        isOwner: state.user.id === documentInfo.value?.creatorId
      })
    }
  })

  // 将当前用户排在第一位
  users.sort((a, b) => {
    if (a.isSelf) return -1
    if (b.isSelf) return 1
    return 0
  })

  collaborators.value = users
  emit('collaboratorsChange', users)
}

// 加载文档数据
const loadDocument = async () => {
  try {
    documentInfo.value = await getDocument(props.docId)
    referenceMaterials.value = await getReferenceMaterials(props.docId)
  } catch (error) {
    console.error('加载文档失败:', error)
    ElMessage.error('加载文档失败')
  }
}

// 监听文档ID变化
watch(
  () => props.docId,
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
onMounted(() => {
  loadDocument()
  initCollaboration()
})

// 组件卸载 - 完善的内存泄漏防护
onBeforeUnmount(() => {
  // 标记组件已销毁，防止异步回调继续执行
  isComponentDestroyed = true

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

<style scoped lang="scss">
// 抽屉动画
:deep(.material-drawer) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
</style>
