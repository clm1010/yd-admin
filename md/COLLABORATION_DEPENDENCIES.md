# 实时协同文档编辑功能 - 依赖包说明

## 项目概述
本项目基于 **Tiptap + Y.js + WebSocket** 实现了完全开源的多人实时协同文档编辑功能。

---

## 一、前端依赖包 (`yd-admin`)

### 1. 核心编辑器

| 包名 | 版本 | 功能说明 |
|------|------|----------|
| `@tiptap/vue-3` | 2.1.13 | Tiptap 编辑器的 Vue 3 集成包，提供 `<EditorContent>` 组件和编辑器实例管理 |
| `@tiptap/starter-kit` | 2.1.13 | Tiptap 基础扩展套件，包含段落、标题、粗体、斜体、列表等常用功能 |

### 2. 协同编辑扩展

| 包名 | 版本 | 功能说明 |
|------|------|----------|
| `@tiptap/extension-collaboration` | 2.1.13 | **核心协同扩展**，将 Tiptap 与 Y.js CRDT 文档绑定，实现无冲突的实时同步 |
| `@tiptap/extension-collaboration-cursor` | 2.1.13 | **协同光标扩展**，显示其他用户的光标位置、选中区域和用户名标签 |
| `yjs` | ^13.6.27 | **CRDT 算法库**，处理分布式数据结构的无冲突合并，是协同编辑的核心数据层 |
| `y-websocket` | ^3.0.0 | **Y.js WebSocket 提供者**，负责前端与后端 WebSocket 服务的连接和数据同步 |
| `marked` | Latest | **Markdown 解析器**，用于 Markdown 与 HTML 的双向转换 |

### 3. 富文本功能扩展

| 包名 | 版本 | 功能说明 |
|------|------|----------|
| `@tiptap/extension-placeholder` | 2.1.13 | 占位符扩展，编辑器为空时显示提示文字 |
| `@tiptap/extension-text-align` | 2.1.13 | 文本对齐扩展，支持左对齐、居中、右对齐 |
| `@tiptap/extension-underline` | 2.1.13 | 下划线扩展（StarterKit 不包含） |
| `@tiptap/extension-image` | 2.1.13 | 图片插入扩展，支持通过 URL 插入图片 |
| `@tiptap/extension-link` | 2.1.13 | 超链接扩展，支持插入和编辑链接 |
| `@tiptap/extension-table` | 2.1.13 | 表格扩展（主扩展） |
| `@tiptap/extension-table-row` | 2.1.13 | 表格行扩展（表格功能依赖） |
| `@tiptap/extension-table-cell` | 2.1.13 | 表格单元格扩展（表格功能依赖） |
| `@tiptap/extension-table-header` | 2.1.13 | 表格表头扩展（表格功能依赖） |

---

## 二、后端依赖包 (`yd-admin-server`)

| 包名 | 版本 | 功能说明 |
|------|------|----------|
| `ws` | ^8.16.0 | **Node.js WebSocket 库**，用于在 Express 服务中升级 HTTP 连接为 WebSocket 长连接 |
| `y-websocket` | ^1.5.0 | **Y.js WebSocket 服务端工具**，包含 `setupWSConnection` 方法，处理文档状态持久化和客户端消息广播 |

### 已有依赖（无需新增）

| 包名 | 版本 | 功能说明 |
|------|------|----------|
| `express` | ^4.18.2 | Web 服务框架，提供 HTTP API 和 WebSocket 升级基础 |
| `cors` | ^2.8.5 | 跨域资源共享中间件 |
| `body-parser` | ^1.20.2 | 请求体解析中间件 |

---

## 三、安装命令

### 前端安装
```bash
cd yd-admin
npm install @tiptap/vue-3@2.1.13 \
  @tiptap/starter-kit@2.1.13 \
  @tiptap/extension-collaboration@2.1.13 \
  @tiptap/extension-collaboration-cursor@2.1.13 \
  @tiptap/extension-placeholder@2.1.13 \
  @tiptap/extension-text-align@2.1.13 \
  @tiptap/extension-underline@2.1.13 \
  @tiptap/extension-image@2.1.13 \
  @tiptap/extension-link@2.1.13 \
  @tiptap/extension-table@2.1.13 \
  @tiptap/extension-table-row@2.1.13 \
  @tiptap/extension-table-cell@2.1.13 \
  @tiptap/extension-table-header@2.1.13 \
  yjs@^13.6.27 \
  y-websocket@^3.0.0
```

### 后端安装
```bash
cd yd-admin-server
npm install ws@^8.16.0 y-websocket@^1.5.0
```

---

## 四、技术架构说明

### 1. 协同编辑原理

```
┌─────────────┐         WebSocket          ┌─────────────┐
│  前端 A     │◄──────────────────────────►│             │
│  Tiptap +   │                             │  Node.js    │
│  Y.js Doc   │         实时同步            │  WebSocket  │
└─────────────┘                             │  Server     │
                                            │  (Y.js)     │
┌─────────────┐         WebSocket          │             │
│  前端 B     │◄──────────────────────────►│             │
│  Tiptap +   │                             └─────────────┘
│  Y.js Doc   │
└─────────────┘
```

- **Y.js CRDT**：确保多人同时编辑时，操作顺序不同也能收敛到一致的最终状态
- **WebSocket**：提供低延迟的双向通信通道
- **Awareness**：共享用户状态（光标位置、在线状态、用户信息）

### 2. 文件结构

```
yd-admin/
├── src/
│   ├── views/
│   │   └── document/
│   │       └── CollaborativeEditor.vue  # 协同编辑器主组件
│   └── router/
│       └── modules/
│           └── remaining.ts             # 路由配置（新增 /document/edit/:id）

yd-admin-server/
└── server.js                            # WebSocket 服务端（已改造）
```

---

## 五、核心功能实现

### 1. 实时协同能力
- ✅ 多用户同时编辑，延迟 ≤ 1 秒
- ✅ 光标位置实时同步，带用户名标签
- ✅ 在线用户列表（右侧面板）
- ✅ 连接状态提示（工具栏右上角）

### 2. 富文本编辑
- ✅ 基础格式：粗体、斜体、下划线
- ✅ 标题：H1、H2、H3
- ✅ 列表：无序列表、有序列表
- ✅ 对齐：左对齐、居中、右对齐
- ✅ 插入图片（URL）
- ✅ 插入表格（3x3 默认）

### 3. UI 还原
- ✅ 左侧编辑器 + 右侧协同面板布局
- ✅ 工具栏（参考设计稿）
- ✅ 在线协作者 Tab（头像、角色、加入时间）
- ✅ 操作记录 Tab（Mock 数据演示）

---

## 六、启动说明

### 1. 启动后端服务
```bash
cd yd-admin-server
npm start
```
访问：`http://localhost:3001`  
WebSocket 端点：`ws://localhost:3001`

### 2. 启动前端服务
```bash
cd yd-admin
npm run dev
```
访问：`http://localhost:xxxx/training/performance`  
点击任意文档的「写作」按钮进入协同编辑页

### 3. 测试协同
- 打开两个浏览器窗口
- 同时访问同一文档（如 `/document/edit/1`）
- 在任一窗口输入内容，另一窗口会实时同步

---

## 七、生产环境注意事项

### 1. 持久化
当前 Y.js 文档存储在内存中，服务重启后数据丢失。生产环境需要：
- 使用 `y-leveldb` 或 `y-redis` 持久化到数据库
- 参考：https://github.com/yjs/y-leveldb

### 2. 鉴权
当前 WebSocket 连接无鉴权。生产环境需要：
- 在 `server.js` 的 `server.on('upgrade')` 中验证 Token
- 拒绝未授权的连接

### 3. 扩展性
- 使用 Redis Pub/Sub 支持多服务器节点
- 使用 Nginx 进行 WebSocket 负载均衡

---

## 八、常见问题

### Q1: 为什么不使用 Umo Editor？
**A**: Umo Editor 开源版不支持实时协同，需要购买商业版 Umo Editor Next。

### Q2: Tiptap 版本为什么是 2.1.13？
**A**: 使用经过验证的稳定版本 v2.1.13，该版本：
- 避免了 v2.8+ 的 `canInsertNode` 导出问题
- 避免了 v2.11+ 的 jsx-runtime 依赖问题
- 与 Y.js 协同功能完美兼容

### Q3: 如何添加更多编辑功能？
**A**: 访问 [Tiptap 扩展市场](https://tiptap.dev/docs/editor/extensions/overview)，安装对应扩展包并在 `CollaborativeEditor.vue` 的 `extensions` 数组中注册。

---

## 九、参考文档

- [Tiptap 官方文档](https://tiptap.dev/)
- [Y.js 官方文档](https://docs.yjs.dev/)
- [Tiptap 协同编辑指南](https://tiptap.dev/docs/editor/guide/collaborative-editing)
- [y-websocket GitHub](https://github.com/yjs/y-websocket)

---

**文档生成时间**: 2025-11-27  
**项目版本**: v1.0.0

