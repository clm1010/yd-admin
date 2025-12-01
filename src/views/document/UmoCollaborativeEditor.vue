<template>
  <div class="umo-collaborative-editor flex flex-col h-screen overflow-hidden bg-gray-100">
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
        <el-button type="primary" size="default" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 编辑器容器 -->
      <div class="flex-1 flex flex-col overflow-hidden bg-gray-100 p-4">
        <div class="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <UmoEditor v-bind="editorOptions" @changed="handleChanged" @saved="handleSaved" />
        </div>
      </div>
      <!-- <UmoViewer
        v-bind="viewerOptions"
        :visible="viewerVisible"
        :file="viewerFile"
        @close="viewerVisible = false"
      /> -->

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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { UmoEditor } from '@umoteam/editor'
// import { UmoViewer } from '@umoteam/viewer'
// import '@umoteam/editor/style'
import CollaborationPanel from './components/CollaborationPanel.vue'
import {
  getRandomUserColor,
  generateRandomUsername,
  defaultEditorOptions,
  defaultCollaborationConfig
} from './config/editorConfig'

// Props
interface Props {
  docId?: string
}

const props = withDefaults(defineProps<Props>(), {
  docId: 'demo-doc'
})

const router = useRouter()
// 获取路由参数
const route = useRoute()
// 优先从路由参数获取标题，如果没有则使用默认值
const documentTitle = computed(() => {
  return (route.query.title as string) || '产品需求文档 V1'
})

// Emits
const emit = defineEmits<{
  connectionChange: [status: string]
  collaboratorsChange: [users: any[]]
}>()

// 状态
const content = ref('<p>欢迎使用协同文档编辑器！</p>')
const connectionStatus = ref('未连接')
const collaborators = ref<any[]>([])
const operations = ref<any[]>([]) // 保留但不显示在面板中
// const showPanel = ref(true) // 不再需要，面板固定

// const viewerOptions = ref({
//   lang: 'zh-CN',
//   mode: ['html', 'pdf'],
//   showHeader: true
// })

// const viewerVisible = ref(false)
// const viewerFile = ref({
//   content: '',
//   title: '',
//   fileType: 'html'
// })

// const onPreview = () => {
//   viewerVisible.value = true
//   viewerFile.value = {
//     content: content.value,
//     title: documentTitle.value,
//     fileType: 'html'
//   }
// }

// 模拟数据
const referenceMaterials = ref([
  {
    id: 1,
    title: '文档名称1.doc',
    date: '2025-11-12 12:00',
    author: '张三/李四/王五',
    content:
      '<p>这是文档名称1的参考内容。您可以复制这段文字并粘贴到编辑器中。</p><p><strong>要点：</strong></p><ul><li>用户注册登录功能</li><li>文档创建和编辑功能</li></ul>'
  },
  {
    id: 2,
    title: '需求分析报告.pdf',
    date: '2025-11-10 09:30',
    author: '李四',
    content:
      '<p>这里是需求分析报告的摘要内容。</p><ol><li>性能需求：响应时间 < 1s</li><li>安全需求：数据加密存储</li></ol>'
  },
  {
    id: 3,
    title: '竞品分析.pptx',
    date: '2025-11-08 15:45',
    author: '王五',
    content: '<p>竞品分析结论：</p><p>我们的优势在于<strong>协同编辑</strong>的实时性和流畅度。</p>'
  },
  {
    id: 4,
    title: '技术架构图.png',
    date: '2025-11-05 11:20',
    author: '张三',
    content: '<p>技术架构说明：前端使用 Vue3 + Tiptap，后端使用 Node.js + Yjs。</p>'
  }
])

const docProperties = ref({
  createTime: '2024-01-15 10:00',
  updateTime: dayjs().format('YYYY-MM-DD HH:mm'),
  version: 'V2',
  tags: ['产品', '需求']
})

// 抽屉状态
const drawerVisible = ref(false)
const currentMaterial = ref<any>(null)

const handleMaterialClick = (item: any) => {
  currentMaterial.value = item
  drawerVisible.value = true
}

const copyContent = (html: string) => {
  // 简单复制文本内容
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

const goBack = () => {
  router.back()
}

// Yjs 和 WebSocket Provider
let ydoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null

// 内容变化回调（官方 @changed 事件）
const handleChanged = ({ editor }: any) => {
  // console.log('文档内容已更新')

  // 获取最新的 HTML 内容
  const html = editor.getHTML()

  // 同步到 Yjs
  if (ydoc && provider && provider.wsconnected) {
    const yText = ydoc.getText('content')
    const currentText = yText.toString()
    if (currentText !== html) {
      yText.delete(0, yText.length)
      yText.insert(0, html)
    }
  }
}

// 保存回调（官方 @saved 事件）
const handleSaved = () => {
  console.log('文档已保存')

  ElMessage.success('文档已保存')

  // 更新最后更新时间
  docProperties.value.updateTime = dayjs().format('YYYY-MM-DD HH:mm')

  // 添加操作记录
  operations.value.unshift({
    user: currentUser.name,
    action: '保存了文档',
    time: dayjs().format('HH:mm')
  })
}

const handleSave = () => {
  handleSaved()
}

// 当前用户信息
const currentUser = {
  name: generateRandomUsername(),
  color: getRandomUserColor(),
  role: '编辑者',
  joinTime: Date.now()
}

// Umo Editor 配置
const editorOptions = computed(() => {
  return {
    ...defaultEditorOptions
  }
})

// 初始化协同编辑
const initCollaboration = () => {
  try {
    console.log('初始化协同编辑...')

    // 初始化 Y.Doc
    ydoc = new Y.Doc()

    // 初始化 WebSocket Provider
    const wsUrl = defaultCollaborationConfig.wsUrl
    provider = new WebsocketProvider(wsUrl, props.docId, ydoc, {
      connect: true
    })

    // 监听连接状态
    provider.on('status', (event: any) => {
      console.log('WebSocket 状态:', event.status)
      const status = event.status

      if (status === 'disconnected') {
        connectionStatus.value = '连接断开'
        // ElMessage.warning('连接断开，正在尝试重连...')
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
      console.log('同步状态:', synced)
      if (synced) {
        console.log('文档已同步')
      }
    })

    // 监听感知信息（在线用户）
    provider.awareness.on('change', () => {
      updateCollaborators()
    })

    // 设置当前用户状态
    provider.awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: currentUser.color,
      role: currentUser.role,
      joinTime: currentUser.joinTime
    })

    // 监听文档更新
    const yText = ydoc.getText('content')
    yText.observe(() => {
      const text = yText.toString()
      if (text && text !== content.value) {
        content.value = text
      }
    })

    console.log('协同编辑初始化成功')
  } catch (error) {
    console.error('协同编辑初始化失败:', error)
    ElMessage.error('协同编辑初始化失败: ' + (error as Error).message)
  }
}

// 更新协作者列表
const updateCollaborators = () => {
  if (!provider) return

  const states = provider.awareness.getStates()
  const users: any[] = []

  states.forEach((state: any, clientId: number) => {
    if (state.user) {
      users.push({
        clientId,
        ...state.user,
        isSelf: clientId === provider!.awareness.clientID
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

  // 添加操作记录
  if (users.length > collaborators.value.length) {
    const newUser = users[users.length - 1]
    operations.value.unshift({
      user: newUser.name,
      action: '加入了文档',
      time: dayjs().format('HH:mm')
    })
  }
}

// 定位操作记录 (保留方法但暂不使用)
// const handleLocateOperation = (record: any) => {
//   ElMessage.info(`定位到: ${record.action}`)
// }

// 初始化操作记录
const initOperations = () => {
  operations.value = [
    {
      user: currentUser.name,
      action: '打开了文档',
      time: dayjs().format('HH:mm')
    }
  ]
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
    initCollaboration()
  }
)

// 组件挂载
onMounted(() => {
  initCollaboration()
  initOperations()
})

// 组件卸载
onBeforeUnmount(() => {
  if (provider) {
    // 移除用户状态
    provider.awareness.setLocalStateField('user', null)
    provider.destroy()
  }
  if (ydoc) {
    ydoc.destroy()
  }
})
</script>

<style scoped lang="scss">
// 协同光标样式
:deep(.collaboration-cursor__caret) {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid #0d0d0d;
  border-right: 1px solid #0d0d0d;
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
  padding: 2px 6px;
  border-radius: 3px;
  border-bottom-left-radius: 0;
  white-space: nowrap;
  z-index: 10;
}

// 为不同用户的光标设置颜色（使用动态颜色）
:deep(.collaboration-cursor__caret) {
  border-color: var(--cursor-color, #0d0d0d);
}

:deep(.collaboration-cursor__label) {
  background-color: var(--cursor-color, #0d0d0d);
}

// 抽屉动画
:deep(.material-drawer) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}
</style>
