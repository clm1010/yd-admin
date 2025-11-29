# 从 Tiptap 迁移到 Umo Editor 指南

## 📋 概述

本指南将帮助您从原有的 Tiptap 实现迁移到基于 @umoteam/editor 的新实现。

## 🔄 主要变化

### 1. 依赖包变化

#### 移除的包

```json
// 这些包已被移除，因为 @umoteam/editor 内部已集成
"@tiptap/vue-3"
"@tiptap/starter-kit"
"@tiptap/extension-collaboration"
"@tiptap/extension-collaboration-cursor"
"@tiptap/extension-image"
"@tiptap/extension-link"
"@tiptap/extension-placeholder"
"@tiptap/extension-table"
"@tiptap/extension-table-cell"
"@tiptap/extension-table-header"
"@tiptap/extension-table-row"
"@tiptap/extension-text-align"
"@tiptap/extension-underline"
```

#### 新增的包

```json
"@umoteam/editor": "^8.1.0"
```

#### 保留的包

```json
// 这些包仍然需要用于协同编辑
"yjs": "^13.6.27"
"y-websocket": "^3.0.0"
```

### 2. 组件变化

#### 旧组件 (不再使用)

- `CollaborativeEditor.vue` - 基于 Tiptap 的实现

#### 新组件 (推荐使用)

- `UmoCollaborativeEditor.vue` - 基于 @umoteam/editor 的实现
- `CollaborativeEditorDemo.vue` - 完整的演示页面

## 📝 迁移步骤

### 步骤 1: 更新依赖

```bash
# 安装新依赖
npm install @umoteam/editor

# 移除旧依赖（可选，npm会自动处理）
npm uninstall @tiptap/vue-3 @tiptap/starter-kit # ... 等等
```

### 步骤 2: 更新导入语句

#### 旧代码

```vue
<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
// ... 更多扩展导入
</script>
```

#### 新代码

```vue
<script setup lang="ts">
import { UmoEditor } from '@umoteam/editor'
import '@umoteam/editor/dist/style.css'
// 不再需要导入单独的扩展
</script>
```

### 步骤 3: 更新组件使用

#### 旧代码

```vue
<template>
  <div>
    <EditorToolbar :editor="editor" />
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
const editor = ref<Editor | null>(null)

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({ provider, user })
      // ... 更多扩展配置
    ]
  })
})
</script>
```

#### 新代码

```vue
<template>
  <UmoEditor
    v-model:content="content"
    :options="editorOptions"
    @save="handleSave"
    @contentChange="handleUpdate"
  />
</template>

<script setup lang="ts">
import { UmoEditor } from '@umoteam/editor'

const content = ref('')
const editorOptions = computed(() => ({
  document: {
    id: 'doc-id',
    title: '文档标题',
    content: content.value
  },
  toolbar: {
    mode: 'ribbon'
  },
  page: {
    enabled: true
  }
}))

const handleSave = (html: string) => {
  console.log('保存:', html)
}

const handleUpdate = (html: string) => {
  console.log('更新:', html)
}
</script>
```

### 步骤 4: 更新样式

#### 旧代码

```vue
<style scoped>
/* 需要手动编写所有编辑器样式 */
.tiptap-editor :deep(.ProseMirror) {
  min-height: 200px;
  outline: none;
}
/* ... 大量自定义样式 */
</style>
```

#### 新代码

```vue
<style scoped>
/* 只需要导入样式文件，不需要自定义 */
@import '@umoteam/editor/dist/style.css';

/* 仅需少量自定义样式 */
.editor-wrapper {
  height: 100%;
}
</style>
```

### 步骤 5: 更新协同编辑配置

#### 旧代码

```typescript
// 需要手动配置 Yjs 和 WebSocket Provider
const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:3001', 'doc-id', ydoc)

const editor = new Editor({
  extensions: [
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({
      provider: provider,
      user: { name: 'User', color: '#ff0000' }
    })
  ]
})
```

#### 新代码

```typescript
// Umo Editor 简化了配置
const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:3001', 'doc-id', ydoc)

// 协同功能由 Yjs 自动处理
// Umo Editor 负责 UI 和编辑功能
```

## 🎨 功能对应表

| 旧实现 (Tiptap) | 新实现 (Umo Editor) | 说明           |
| --------------- | ------------------- | -------------- |
| `Editor`        | `UmoEditor`         | 主编辑器组件   |
| `EditorContent` | 内置                | 不需要单独组件 |
| 手动配置扩展    | 自动集成            | 开箱即用       |
| 自定义工具栏    | 内置工具栏          | 3种模式可选    |
| 手动实现分页    | `page.enabled`      | 一行配置       |
| 手动样式        | 自动样式            | 美观的默认样式 |

## 🚀 新功能

使用 Umo Editor 后，您可以获得这些额外功能：

1. **分页模式**: 类似 Microsoft Word 的分页视图
2. **完整工具栏**: 3种工具栏模式（default/classic/ribbon）
3. **暗色主题**: 内置暗色主题支持
4. **导出功能**: 支持导出为 PDF、Word、HTML
5. **模板系统**: 文档模板支持
6. **打印功能**: 完整的打印预览和打印
7. **目录**: 自动生成文档目录
8. **多语言**: 内置中文支持

## ⚠️ 注意事项

### 1. API 变化

#### 获取内容

```typescript
// 旧
const html = editor.value?.getHTML()
const json = editor.value?.getJSON()

// 新
const html = content.value // 直接使用 v-model
```

#### 设置内容

```typescript
// 旧
editor.value?.commands.setContent('<p>Hello</p>')

// 新
content.value = '<p>Hello</p>' // 直接赋值
```

#### 格式化命令

```typescript
// 旧
editor.value?.chain().focus().toggleBold().run()

// 新
// 使用工具栏按钮，或通过快捷键 Ctrl+B
```

### 2. 事件处理

#### 旧

```typescript
onUpdate: ({ editor }) => {
  console.log('更新了')
}
```

#### 新

```vue
@contentChange="handleUpdate"
```

### 3. 扩展

如果您使用了自定义 Tiptap 扩展，需要参考 Umo Editor 的扩展开发文档重新实现。

## 🔧 常见问题

### Q1: 如何保留原有的自定义功能？

A: Umo Editor 支持扩展开发。参考官方文档： https://dev.umodoc.com/cn/docs/editor/extensions

### Q2: 如何自定义工具栏？

A: 在 `editorOptions` 中配置：

```typescript
toolbar: {
  mode: 'ribbon',
  menus: {
    base: true,
    insert: true,
    table: true,
    tools: false, // 隐藏工具菜单
  },
}
```

### Q3: 如何禁用某些功能？

A: 通过配置选项：

```typescript
{
  assistant: { enabled: false }, // 禁用AI助手
  print: { enabled: false },      // 禁用打印
  // ...
}
```

### Q4: 协同编辑是否兼容？

A: 是的！Yjs 和 y-websocket 保持不变，协同编辑功能完全兼容。

### Q5: 原有数据是否需要迁移？

A: 不需要。Umo Editor 使用标准的 HTML 格式，与 Tiptap 完全兼容。

## 📚 参考资源

- [Umo Editor 官方文档](https://dev.umodoc.com/cn/docs/editor)
- [Umo Editor GitHub](https://github.com/umodoc/editor)
- [Tiptap 官方文档](https://tiptap.dev)
- [迁移示例代码](./USAGE_EXAMPLES.js)

## 💡 最佳实践

1. **逐步迁移**: 先在新页面使用 Umo Editor，验证无问题后再替换旧页面
2. **保留旧代码**: 暂时保留 `CollaborativeEditor.vue` 作为备份
3. **测试协同**: 确保多人协同编辑功能正常工作
4. **性能测试**: 测试大文档的加载和编辑性能
5. **用户培训**: 新界面可能需要用户适应

## ✅ 迁移检查清单

- [ ] 安装 @umoteam/editor
- [ ] 移除旧的 @tiptap 依赖
- [ ] 创建新的编辑器组件
- [ ] 更新路由配置
- [ ] 测试基本编辑功能
- [ ] 测试协同编辑功能
- [ ] 测试文件上传
- [ ] 测试导出功能
- [ ] 更新文档
- [ ] 用户测试

## 🎉 迁移完成

恭喜！您已成功从 Tiptap 迁移到 Umo Editor。

现在您拥有：

- ✅ 更强大的编辑功能
- ✅ 更美观的界面
- ✅ 更少的代码
- ✅ 更好的用户体验

如有问题，请参考：

- 快速启动指南: `COLLABORATIVE_EDITING_QUICKSTART.md`
- 实现总结: `IMPLEMENTATION_SUMMARY.md`
- 详细文档: `src/views/document/README.md`
