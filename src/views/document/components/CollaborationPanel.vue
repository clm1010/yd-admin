<template>
  <div
    class="collaboration-panel w-300px bg-white border-y border-r border-gray-200 rounded-r flex flex-col"
  >
    <el-tabs v-model="activeTab" class="w-full px-2">
      <el-tab-pane label="在线协作者" name="collaborators">
        <div class="p-4">
          <div
            v-for="user in collaborators"
            :key="user.clientId"
            class="flex items-center mb-3 group hover:bg-gray-50 p-2 rounded cursor-pointer"
          >
            <div class="relative">
              <el-avatar
                :size="32"
                :style="{ backgroundColor: user.color }"
                class="text-white text-xs"
              >
                {{ user.name.substring(0, 2) }}
              </el-avatar>
              <div
                v-if="user.isOwner"
                class="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1 rounded-full scale-75"
              >
                创建人
              </div>
            </div>
            <div class="ml-3 flex-1">
              <div class="text-sm font-medium text-gray-700 flex items-center">
                {{ user.name }}
                <el-tag
                  v-if="user.isSelf"
                  size="small"
                  type="info"
                  class="ml-1 scale-75 origin-left"
                  >我</el-tag
                >
              </div>
              <div class="text-xs text-gray-400">
                {{ user.role || '查看者' }} · {{ formatTime(user.joinTime) }}
              </div>
            </div>
          </div>
          <div v-if="collaborators.length === 0" class="text-center text-gray-400 py-8 text-sm">
            <Icon icon="ep:user" class="text-3xl mb-2" />
            <div>暂无其他协作者</div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="操作记录" name="history">
        <div class="h-[calc(100vh-200px)] overflow-y-auto p-4">
          <div
            v-for="(record, index) in operations"
            :key="index"
            class="mb-4 relative pl-4 border-l-2 border-gray-100 hover:border-primary transition-colors cursor-pointer"
            @click="$emit('locate', record)"
          >
            <div class="text-xs text-gray-400 mb-1">{{ record.time }}</div>
            <div class="text-sm text-gray-700">
              <span class="font-bold">{{ record.user }}</span> {{ record.action }}
            </div>
          </div>
          <div class="text-center text-gray-300 text-xs mt-4">仅展示最近 30 天记录</div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'

defineProps<{
  collaborators: any[]
  operations: any[]
}>()

defineEmits<{
  (e: 'locate', record: any): void
}>()

const activeTab = ref('collaborators')

const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('HH:mm')
}
</script>
