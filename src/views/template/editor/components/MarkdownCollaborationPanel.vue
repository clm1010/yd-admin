<template>
  <div class="collaboration-panel w-full h-full bg-white flex flex-col text-sm">
    <!-- 在线协作者 -->
    <div class="section p-4 border-b border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-gray-800">在线协作者</h3>
        <el-tag type="info" size="small" round>{{ collaborators.length }}</el-tag>
      </div>

      <div class="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
        <div
          v-for="user in collaborators"
          :key="user.clientId"
          class="flex items-center group hover:bg-gray-50 p-1.5 -mx-1.5 rounded transition-colors"
        >
          <div class="relative flex-shrink-0">
            <el-avatar
              :size="28"
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
          <div class="ml-2 flex-1 min-w-0">
            <div class="flex items-center">
              <span class="font-medium text-gray-700 truncate block max-w-[100px]">{{
                user.name
              }}</span>
              <el-tag
                v-if="user.isSelf"
                size="small"
                type="info"
                class="ml-1 scale-75 origin-left flex-shrink-0"
                >我</el-tag
              >
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ user.role || '编辑者' }}
            </div>
          </div>
          <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="在线"></div>
        </div>

        <div v-if="collaborators.length === 0" class="text-center text-gray-400 py-4">
          暂无其他协作者
        </div>
      </div>
    </div>

    <!-- 参考素材 -->
    <div class="section p-4 border-b border-gray-100 flex-1 overflow-hidden flex flex-col">
      <h3 class="font-bold text-gray-800 mb-3">参考素材</h3>
      <div class="overflow-y-auto flex-1 custom-scrollbar -mx-2 px-2">
        <div v-if="materials && materials.length > 0" class="space-y-2">
          <div
            v-for="(item, index) in materials"
            :key="index"
            class="p-3 bg-gray-50 rounded hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all border border-transparent hover:border-blue-100"
            @click="$emit('click-material', item)"
          >
            <div class="font-medium mb-1 truncate" :title="item.title">{{ item.title }}</div>
            <div class="text-xs text-gray-400 flex justify-between items-center">
              <span>{{ item.date }}</span>
              <span>{{ item.author }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8"> 暂无参考素材 </div>
      </div>
    </div>

    <!-- 文档属性 -->
    <div class="section p-4 bg-gray-50">
      <h3 class="font-bold text-gray-800 mb-3">文档属性</h3>
      <div class="space-y-2 text-xs text-gray-600">
        <div class="flex justify-between">
          <span class="text-gray-400">创建时间:</span>
          <span>{{ properties?.createTime || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">最后更新:</span>
          <span>{{ properties?.updateTime || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">版本:</span>
          <span>{{ properties?.version || 'V1.0' }}</span>
        </div>
        <div class="flex justify-between" v-if="properties?.tags?.length">
          <span class="text-gray-400 block mb-1">标签:</span>
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="tag in properties?.tags || []"
              :key="tag"
              size="small"
              type="primary"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collaborators: any[]
  materials?: any[]
  properties?: any
}>()

defineEmits<{
  (e: 'click-material', item: any): void
}>()
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>

