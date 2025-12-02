# Tiptap 协同编辑器实现说明

## 功能概述

使用纯 Tiptap + Y.js 实现的协同编辑器，支持：

- ✅ **协同光标**：实时显示其他用户的光标位置和用户名标签
- ✅ **选区高亮**：显示其他用户选中的文本范围
- ✅ **实时同步**：多用户同时编辑，内容实时同步
- ✅ **用户感知**：显示在线协作者列表
- ✅ **真实用户数据**：集成系统用户信息（ID、昵称、头像）

## 技术架构

### 前端
- **编辑器**: Tiptap 2.x + Vue 3
- **协同引擎**: Y.js + y-websocket
- **光标扩展**: @tiptap/extension-collaboration-cursor

### 后端
- **WebSocket 服务**: Node.js + ws
- **协同服务**: yd-admin-server (端口 3001)

## 文件结构

```
src/views/document/
├── TiptapCollaborativeEditor.vue   # 主页面组件
├── components/
│   ├── TiptapEditor.vue            # Tiptap 编辑器组件
│   └── CollaborationPanel.vue      # 协作者面板
├── api/
│   └── documentApi.ts              # 文档 API 服务
└── config/
    └── editorConfig.ts             # 编辑器配置
```

## 访问路由

```
/document/tiptap/:id
```

示例：`/document/tiptap/demo-doc?title=测试文档`

## 运行说明

### 1. 启动后端协同服务

```bash
cd yd-admin-server
npm start
# 服务运行在 http://localhost:3001
```

### 2. 启动前端开发服务

```bash
cd yd-admin
pnpm dev
# 服务运行在 http://localhost:5173
```

### 3. 测试协同功能

1. 打开两个浏览器窗口（或不同浏览器）
2. 都访问同一个文档：`http://localhost:5173/document/tiptap/demo-doc`
3. 在一个窗口中输入文字，另一个窗口会实时看到更新
4. 两个用户的光标会显示不同颜色和用户名标签

## 配置说明

### WebSocket 地址配置

在 `.env.local` 或 `editorConfig.ts` 中配置：

```typescript
// editorConfig.ts
export const defaultCollaborationConfig = {
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  // ...
}
```

### 用户信息来源

编辑器会自动从 `useUserStore` 获取当前登录用户信息：
- 用户 ID
- 用户昵称
- 用户头像

如果用户未登录，会生成随机用户名和颜色。

## 协同光标样式

协同光标样式在 `TiptapEditor.vue` 中定义：

```scss
// 协同光标
:deep(.collaboration-cursor__caret) {
  position: relative;
  margin-left: -1px;
  border-left: 1px solid var(--cursor-color);
  border-right: 1px solid var(--cursor-color);
}

// 用户名标签
:deep(.collaboration-cursor__label) {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 2px 8px;
  border-radius: 6px 6px 6px 0;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

// 选区高亮
:deep(.ProseMirror-yjs-selection) {
  background-color: var(--selection-color, rgba(37, 99, 235, 0.2));
}
```

## 与原 Umo Editor 版本的对比

| 功能 | Umo Editor (原版) | Tiptap (新版) |
|-----|------------------|--------------|
| 协同光标 | ❌ 不支持 | ✅ 支持 |
| 用户名标签 | ❌ 不支持 | ✅ 支持 |
| 选区高亮 | ❌ 不支持 | ✅ 支持 |
| 工具栏 | ✅ 丰富的 UI | ✅ 基础工具栏 |
| 页面排版 | ✅ 支持 | ❌ 需自行实现 |

## 扩展开发

### 添加更多 Tiptap 扩展

在 `TiptapEditor.vue` 中的 `extensions` 数组添加：

```typescript
import CustomExtension from './extensions/CustomExtension'

const editor = useEditor({
  extensions: [
    // ... 现有扩展
    CustomExtension.configure({
      // 配置项
    })
  ]
})
```

### 自定义协同光标样式

可以通过 CSS 变量自定义光标颜色：

```css
.collaboration-cursor__caret {
  --cursor-color: #ff0000; /* 红色光标 */
}
```

## 已知限制

1. 需要后端 WebSocket 服务支持
2. 工具栏功能相比 Umo Editor 较简化
3. 不支持页面排版、水印等高级功能

## 相关链接

- [Tiptap 文档](https://tiptap.dev/)
- [Y.js 文档](https://docs.yjs.dev/)
- [Tiptap Collaboration](https://tiptap.dev/docs/editor/api/extensions/collaboration)
- [Tiptap CollaborationCursor](https://tiptap.dev/docs/editor/api/extensions/collaboration-cursor)

