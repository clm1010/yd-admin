# Umo Editor 协同编辑功能 - 快速启动指南

## 📖 概述

本项目已成功集成 @umoteam/editor，并实现了多人在线协同文档编辑功能。

## 🚀 快速开始

### 1. 启动 WebSocket 服务器

协同编辑需要 WebSocket 服务器支持。服务器已集成在 yd-admin-server 项目中。

```bash
# 进入服务器项目目录
cd e:/job-project/yd-admin-server

# 安装依赖（首次运行）
npm install

# 启动服务器（包含 WebSocket 协同编辑服务）
npm start
```

服务器将在 `ws://localhost:3001` 上运行。

### 2. 启动前端应用

```bash
# 在另一个终端窗口
cd e:/job-project/yd-admin

# 启动开发服务器
npm run dev
```

### 3. 访问编辑器

打开浏览器访问：

```
http://localhost:你的端口/document/demo
```

## 📁 项目结构

```
src/views/document/
├── UmoCollaborativeEditor.vue      # 主协同编辑组件
├── CollaborativeEditorDemo.vue     # 演示页面
├── config/
│   └── editorConfig.ts             # 编辑器配置
├── components/
│   └── CollaborationPanel.vue      # 协同面板
└── README.md                        # 详细文档

服务端 (yd-admin-server):
├── server.js                        # Express + WebSocket 服务器
├── package.json                     # 服务器依赖
└── README.md                        # 服务器文档
```

## 🔧 环境配置

在项目根目录创建 `.env.local` 文件（如果不存在）：

```env
# WebSocket 服务器地址
VITE_WS_URL=ws://localhost:3001

# 编辑器密钥（可选）
VITE_EDITOR_KEY=your-editor-key-here
```

## ✨ 主要功能

### 已实现功能

- ✅ 实时多人协同编辑
- ✅ 在线用户列表显示
- ✅ 用户光标和选区同步
- ✅ 分页模式（类似 Word）
- ✅ 富文本编辑（标题、列表、表格等）
- ✅ 图片、链接插入
- ✅ 文档保存
- ✅ 连接状态监控
- ✅ 操作历史记录

### 核心组件

#### 1. UmoCollaborativeEditor

主要的协同编辑组件，提供完整的编辑和协同功能。

**Props:**

- `docId`: 文档ID（可选，默认 'demo-doc'）

**Events:**

- `connectionChange`: 连接状态变化
- `collaboratorsChange`: 协作者列表变化

**使用示例:**

```vue
<template>
  <UmoCollaborativeEditor
    :doc-id="currentDocId"
    @connection-change="handleConnectionChange"
    @collaborators-change="handleCollaboratorsChange"
  />
</template>

<script setup>
import UmoCollaborativeEditor from '@/views/document/UmoCollaborativeEditor.vue'

const handleConnectionChange = (status) => {
  console.log('连接状态:', status)
}

const handleCollaboratorsChange = (users) => {
  console.log('在线用户:', users)
}
</script>
```

#### 2. CollaborativeEditorDemo

完整的演示页面，包含文档列表、创建、打开、分享等功能。

访问路径：`/document/demo`

## 📝 路由配置

在 `src/router/index.ts` 中添加路由：

```typescript
{
  path: '/document/demo',
  name: 'CollaborativeEditorDemo',
  component: () => import('@/views/document/CollaborativeEditorDemo.vue'),
  meta: {
    title: '协同编辑演示',
  },
},
{
  path: '/document/:id',
  name: 'DocumentEditor',
  component: () => import('@/views/document/UmoCollaborativeEditor.vue'),
  meta: {
    title: '文档编辑',
  },
}
```

## 🎨 自定义配置

### 编辑器选项

在 `src/views/document/config/editorConfig.ts` 中可以自定义：

- WebSocket 服务器地址
- 重连策略
- 用户默认配置
- 编辑器工具栏
- 页面样式
- 快捷键

### 示例配置

```typescript
export const customEditorOptions = {
  toolbar: {
    mode: 'ribbon', // 'default' | 'classic' | 'ribbon'
    menus: {
      base: true,
      insert: true,
      table: true,
      tools: true
    }
  },
  page: {
    enabled: true, // 启用分页模式
    defaultOrientation: 'portrait',
    defaultBackground: '#ffffff'
  },
  shortcuts: {
    enabled: true
  }
}
```

## 🔐 权限控制

如需实现权限控制，可以在 WebSocket 服务器端添加认证逻辑：

```javascript
// websocket-server.js
setupWSConnection(ws, req, {
  authenticate: async (docName, request) => {
    // 从请求中获取token
    const token = request.headers.authorization

    // 验证token
    const isValid = await validateToken(token)

    // 返回 true 允许连接，false 拒绝
    return isValid
  }
})
```

## 💾 数据持久化

### 选项 1: 使用 Level DB (推荐)

```bash
npm install y-leveldb
```

```javascript
// 在 websocket-server.js 中
const { LeveldbPersistence } = require('y-leveldb')

const persistence = new LeveldbPersistence('./db')

setupWSConnection(ws, req, {
  persistence
})
```

### 选项 2: 使用 Redis

```bash
npm install y-redis
```

### 选项 3: 自定义存储

实现自己的持久化逻辑，保存到数据库。

## 🐛 常见问题

### Q1: 无法连接到 WebSocket 服务器？

**A:** 检查：

1. WebSocket 服务器是否正在运行
2. `.env` 中的 `VITE_WS_URL` 配置是否正确
3. 防火墙是否阻止了连接
4. 浏览器控制台是否有错误信息

### Q2: 编辑器无法显示？

**A:** 检查：

1. `@umoteam/editor` 是否正确安装
2. 样式文件是否正确导入
3. 浏览器控制台是否有错误

### Q3: 多用户编辑出现冲突？

**A:** Yjs 使用 CRDT 算法自动解决冲突。如果仍有问题：

1. 确保所有客户端连接到同一个 WebSocket 服务器
2. 确保文档 ID 一致
3. 检查网络连接是否稳定

### Q4: 如何实现文档导出？

**A:** Umo Editor 内置了导出功能：

```typescript
// 在编辑器实例中
editor.export('pdf') // 导出为 PDF
editor.export('word') // 导出为 Word
editor.export('html') // 导出为 HTML
```

## 📚 更多资源

- **Umo Editor 官网**: https://www.umodoc.com
- **Umo Editor 文档**: https://dev.umodoc.com/cn/docs/editor
- **Umo Editor GitHub**: https://github.com/umodoc/editor
- **Yjs 文档**: https://docs.yjs.dev
- **y-websocket**: https://github.com/yjs/y-websocket

## 🎯 下一步

1. **实现文档持久化**: 将文档保存到数据库
2. **添加权限控制**: 实现用户认证和访问控制
3. **版本历史**: 记录和恢复文档版本
4. **评论功能**: 添加文档评论和批注
5. **导出功能**: 完善文档导出（PDF、Word等）
6. **模板功能**: 提供文档模板

## 📞 获取帮助

如有问题，请：

1. 查看详细文档：`src/views/document/README.md`
2. 查看示例代码：`CollaborativeEditorDemo.vue`
3. 参考 Umo Editor 官方文档

## 📄 许可证

本项目基于 MIT 许可证开源。
