<template>
  <div class="umo-collaborative-editor">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-info">
        <el-tag :type="statusTagType" size="small">
          {{ connectionStatus }}
        </el-tag>
        <el-tag v-if="collaborators.length > 0" type="info" size="small" class="ml-2">
          {{ collaborators.length }} 人在线
        </el-tag>
      </div>
    </div>

    <!-- 编辑器容器 -->
    <div class="editor-wrapper">
      <UmoEditor
        v-bind="editorOptions"
        :height="'calc(100vh - 100px)'"
        @changed="handleChanged"
        @saved="handleSaved"
      />
    </div>

    <!-- 右侧协同面板 -->
    <el-drawer v-model="showPanel" title="协作信息" direction="rtl" size="300px">
      <CollaborationPanel
        :collaborators="collaborators"
        :operations="operations"
        @locate="handleLocateOperation"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { UmoEditor } from '@umoteam/editor'
import '@umoteam/editor/style'
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

// Emits
const emit = defineEmits<{
  connectionChange: [status: string]
  collaboratorsChange: [users: any[]]
}>()

// 状态
const content = ref('<p>欢迎使用协同文档编辑器！</p>')
const connectionStatus = ref('未连接')
const collaborators = ref<any[]>([])
const operations = ref<any[]>([])
const showPanel = ref(false)

// Yjs 和 WebSocket Provider
let ydoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null

// 内容变化回调（官方 @changed 事件）
const handleChanged = ({ editor }: any) => {
  console.log('文档内容已更新')

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

  // 添加操作记录
  operations.value.unshift({
    user: currentUser.name,
    action: '保存了文档',
    time: dayjs().format('HH:mm')
  })
}

// 当前用户信息
const currentUser = {
  name: generateRandomUsername(),
  color: getRandomUserColor(),
  role: '编辑者',
  joinTime: Date.now()
}

// 连接状态标签类型
const statusTagType = computed(() => {
  if (connectionStatus.value === '已连接') return 'success'
  if (connectionStatus.value === '连接断开') return 'danger'
  return 'info'
})

// Umo Editor 配置
const editorOptions = computed(() => ({
  ...defaultEditorOptions
}))

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
        ElMessage.warning('连接断开，正在尝试重连...')
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

// 定位操作记录
const handleLocateOperation = (record: any) => {
  ElMessage.info(`定位到: ${record.action}`)
}

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
.umo-collaborative-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f7fa;

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: white;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .status-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .editor-wrapper {
    flex: 1;
    overflow: hidden;
    padding: 16px;

    :deep(.umo-editor) {
      height: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
