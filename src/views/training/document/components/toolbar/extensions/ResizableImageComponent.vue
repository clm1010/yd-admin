<template>
  <node-view-wrapper
    class="resizable-image-wrapper"
    :class="{
      'is-selected': selected,
      'is-resizing': isResizing,
      'align-left': node.attrs.align === 'left',
      'align-center': node.attrs.align === 'center' || !node.attrs.align,
      'align-right': node.attrs.align === 'right'
    }"
  >
    <div
      class="image-container"
      :style="containerStyle"
      @click="handleClick"
      @dblclick="handleDoubleClick"
    >
      <img
        ref="imageRef"
        :src="node.attrs.src"
        :alt="node.attrs.alt"
        :title="node.attrs.title"
        :style="imageStyle"
        draggable="false"
        @load="handleImageLoad"
        @error="handleImageError"
      />

      <!-- 图片加载失败占位 -->
      <div v-if="imageError" class="image-error">
        <span class="error-icon">🖼️</span>
        <span class="error-text">图片加载失败</span>
      </div>

      <!-- 调整大小的控制点 -->
      <template v-if="selected && editor?.isEditable && !imageError">
        <div
          class="resize-handle resize-handle-nw"
          @mousedown.stop.prevent="startResize($event, 'nw')"
        ></div>
        <div
          class="resize-handle resize-handle-ne"
          @mousedown.stop.prevent="startResize($event, 'ne')"
        ></div>
        <div
          class="resize-handle resize-handle-sw"
          @mousedown.stop.prevent="startResize($event, 'sw')"
        ></div>
        <div
          class="resize-handle resize-handle-se"
          @mousedown.stop.prevent="startResize($event, 'se')"
        ></div>
        <div
          class="resize-handle resize-handle-n"
          @mousedown.stop.prevent="startResize($event, 'n')"
        ></div>
        <div
          class="resize-handle resize-handle-s"
          @mousedown.stop.prevent="startResize($event, 's')"
        ></div>
        <div
          class="resize-handle resize-handle-w"
          @mousedown.stop.prevent="startResize($event, 'w')"
        ></div>
        <div
          class="resize-handle resize-handle-e"
          @mousedown.stop.prevent="startResize($event, 'e')"
        ></div>
      </template>

      <!-- 尺寸提示 -->
      <div v-if="isResizing" class="size-tooltip">
        {{ Math.round(currentWidth) }} × {{ Math.round(currentHeight) }}
      </div>

      <!-- 图片工具栏 -->
      <div v-if="selected && editor?.isEditable && !imageError" class="image-toolbar">
        <button class="toolbar-btn" @click.stop="alignImage('left')" title="左对齐">
          <span>⬅</span>
        </button>
        <button class="toolbar-btn" @click.stop="alignImage('center')" title="居中">
          <span>↔</span>
        </button>
        <button class="toolbar-btn" @click.stop="alignImage('right')" title="右对齐">
          <span>➡</span>
        </button>
        <span class="toolbar-divider"></span>
        <button class="toolbar-btn" @click.stop="resetSize" title="重置大小">
          <span>↺</span>
        </button>
        <button class="toolbar-btn danger" @click.stop="deleteImage" title="删除">
          <span>🗑</span>
        </button>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const imageRef = ref<HTMLImageElement | null>(null)
const isResizing = ref(false)
const imageError = ref(false)
const currentWidth = ref(0)
const currentHeight = ref(0)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const aspectRatio = ref(1)

// 编辑器可用宽度（A4 页面宽度 794px - 左右边距 120*2 = 554px，留一些余量）
const MAX_IMAGE_WIDTH = 540

// 调整大小的状态
let startX = 0
let startY = 0
let startWidth = 0
let startHeight = 0
let resizeDirection = ''

const containerStyle = computed(() => {
  let width = props.node.attrs.width || currentWidth.value
  let height = props.node.attrs.height || currentHeight.value

  // 确保宽度不超过最大限制
  if (width && parseFloat(String(width)) > MAX_IMAGE_WIDTH) {
    const ratio = aspectRatio.value || 1
    width = MAX_IMAGE_WIDTH
    height = width / ratio
  }

  return {
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
    maxWidth: '100%'
  }
})

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'fill' as const, // 改为 fill 以填满容器
  display: imageError.value ? 'none' : 'block'
}))

const handleImageLoad = () => {
  imageError.value = false
  if (imageRef.value) {
    naturalWidth.value = imageRef.value.naturalWidth
    naturalHeight.value = imageRef.value.naturalHeight
    aspectRatio.value = naturalWidth.value / naturalHeight.value

    // 如果没有设置宽高，使用自然尺寸（限制最大宽度）
    if (!props.node.attrs.width) {
      currentWidth.value = Math.min(naturalWidth.value, MAX_IMAGE_WIDTH)
      currentHeight.value = currentWidth.value / aspectRatio.value
    } else {
      let parsedWidth = parseFloat(props.node.attrs.width) || naturalWidth.value
      // 限制宽度不超过编辑器可用宽度
      if (parsedWidth > MAX_IMAGE_WIDTH) {
        parsedWidth = MAX_IMAGE_WIDTH
      }
      currentWidth.value = parsedWidth
      currentHeight.value = props.node.attrs.height
        ? parseFloat(props.node.attrs.height)
        : currentWidth.value / aspectRatio.value

      // 如果宽度被限制了，更新节点属性
      if (parsedWidth !== parseFloat(props.node.attrs.width)) {
        props.updateAttributes({
          width: Math.round(currentWidth.value),
          height: Math.round(currentHeight.value)
        })
      }
    }
  }
}

const handleImageError = () => {
  imageError.value = true
}

const handleClick = () => {
  // 点击时选中图片
}

const handleDoubleClick = () => {
  // 双击查看原图
  if (props.node.attrs.src) {
    window.open(props.node.attrs.src, '_blank')
  }
}

// 对齐图片
const alignImage = (align: string) => {
  props.updateAttributes({ align })
}

// 重置大小
const resetSize = () => {
  if (naturalWidth.value && naturalHeight.value) {
    const newWidth = Math.min(naturalWidth.value, MAX_IMAGE_WIDTH)
    const newHeight = newWidth / aspectRatio.value
    currentWidth.value = newWidth
    currentHeight.value = newHeight
    props.updateAttributes({
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    })
  }
}

// 删除图片
const deleteImage = () => {
  props.deleteNode()
}

const startResize = (event: MouseEvent, direction: string) => {
  if (!props.editor?.isEditable) return

  isResizing.value = true
  resizeDirection = direction
  startX = event.clientX
  startY = event.clientY
  startWidth = currentWidth.value || (imageRef.value?.offsetWidth ?? 0)
  startHeight = currentHeight.value || (imageRef.value?.offsetHeight ?? 0)

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return

  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY

  let newWidth = startWidth
  let newHeight = startHeight

  // 根据方向计算新的尺寸
  switch (resizeDirection) {
    case 'e':
      newWidth = startWidth + deltaX
      newHeight = newWidth / aspectRatio.value
      break
    case 'w':
      newWidth = startWidth - deltaX
      newHeight = newWidth / aspectRatio.value
      break
    case 's':
      newHeight = startHeight + deltaY
      newWidth = newHeight * aspectRatio.value
      break
    case 'n':
      newHeight = startHeight - deltaY
      newWidth = newHeight * aspectRatio.value
      break
    case 'se':
      if (event.shiftKey) {
        // 按住 Shift 键保持比例
        newWidth = startWidth + deltaX
        newHeight = newWidth / aspectRatio.value
      } else {
        newWidth = startWidth + deltaX
        newHeight = startHeight + deltaY
      }
      break
    case 'sw':
      if (event.shiftKey) {
        newWidth = startWidth - deltaX
        newHeight = newWidth / aspectRatio.value
      } else {
        newWidth = startWidth - deltaX
        newHeight = startHeight + deltaY
      }
      break
    case 'ne':
      if (event.shiftKey) {
        newWidth = startWidth + deltaX
        newHeight = newWidth / aspectRatio.value
      } else {
        newWidth = startWidth + deltaX
        newHeight = startHeight - deltaY
      }
      break
    case 'nw':
      if (event.shiftKey) {
        newWidth = startWidth - deltaX
        newHeight = newWidth / aspectRatio.value
      } else {
        newWidth = startWidth - deltaX
        newHeight = startHeight - deltaY
      }
      break
  }

  // 限制最小尺寸
  newWidth = Math.max(50, newWidth)
  newHeight = Math.max(50, newHeight)

  // 限制最大尺寸（不超过编辑器可用宽度）
  newWidth = Math.min(newWidth, MAX_IMAGE_WIDTH)
  newHeight = Math.min(newHeight, 900)

  currentWidth.value = newWidth
  currentHeight.value = newHeight
}

const stopResize = () => {
  if (!isResizing.value) return

  isResizing.value = false

  // 更新节点属性
  props.updateAttributes({
    width: Math.round(currentWidth.value),
    height: Math.round(currentHeight.value)
  })

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  // 初始化尺寸
  if (props.node.attrs.width) {
    let parsedWidth = parseFloat(props.node.attrs.width)
    // 限制宽度不超过编辑器可用宽度
    if (parsedWidth > MAX_IMAGE_WIDTH) {
      parsedWidth = MAX_IMAGE_WIDTH
    }
    currentWidth.value = parsedWidth
  }
  if (props.node.attrs.height) {
    currentHeight.value = parseFloat(props.node.attrs.height)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style lang="scss" scoped>
.resizable-image-wrapper {
  display: flex;
  position: relative;
  line-height: 0;
  margin: 8px 0;
  justify-content: center; // 默认居中

  &.is-selected .image-container {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }

  &.is-resizing .image-container {
    outline: 2px dashed #1a73e8;
  }

  &.align-left {
    justify-content: flex-start;
  }

  &.align-center {
    justify-content: center;
  }

  &.align-right {
    justify-content: flex-end;
  }
}

.image-container {
  position: relative;
  display: block; // 改为 block
  border-radius: 4px;
  overflow: visible;
  transition: outline 0.15s ease;

  img {
    border-radius: 4px;
    cursor: default;
    user-select: none;
    display: block; // 确保图片是块级显示，消除底部间隙
  }
}

// 调整大小手柄
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #1a73e8;
  border-radius: 2px;
  z-index: 10;

  &:hover {
    background: #1a73e8;
  }

  // 四角
  &.resize-handle-nw {
    top: -5px;
    left: -5px;
    cursor: nw-resize;
  }

  &.resize-handle-ne {
    top: -5px;
    right: -5px;
    cursor: ne-resize;
  }

  &.resize-handle-sw {
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
  }

  &.resize-handle-se {
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
  }

  // 四边中点
  &.resize-handle-n {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: n-resize;
  }

  &.resize-handle-s {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: s-resize;
  }

  &.resize-handle-w {
    top: 50%;
    left: -5px;
    transform: translateY(-50%);
    cursor: w-resize;
  }

  &.resize-handle-e {
    top: 50%;
    right: -5px;
    transform: translateY(-50%);
    cursor: e-resize;
  }
}

// 尺寸提示
.size-tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 20;
}

// 图片加载失败
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 150px;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  color: #999;

  .error-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .error-text {
    font-size: 12px;
  }
}

// 图片工具栏
.image-toolbar {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 20;

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;

    &:hover {
      background: #f0f0f0;
    }

    &.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  }

  .toolbar-divider {
    width: 1px;
    height: 16px;
    background: #e0e0e0;
    margin: 0 4px;
  }
}

// 对齐样式
// .resizable-image-wrapper 已经处理了对齐，这里移除旧的样式
// .resizable-image-wrapper {
//   &.align-left {
//     text-align: left;
//   }
//
//   &.align-center {
//     text-align: center;
//   }
//
//   &.align-right {
//     text-align: right;
//   }
// }
</style>
