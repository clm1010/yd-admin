# 多人协同文档编辑功能

基于 @umoteam/editor 和 Yjs 实现的多人在线协同文档编辑系统。

## 🎯 项目特点

- ✅ **开箱即用**: 零配置，快速集成
- ✅ **实时协同**: 基于 CRDT 的无冲突协同编辑
- ✅ **功能丰富**: 完整的文档编辑能力
- ✅ **界面美观**: 类似 Microsoft Word 的用户体验
- ✅ **高度可定制**: 支持自定义扩展和主题
- ✅ **中文友好**: 完整的中文支持

## 📦 技术栈

- **前端框架**: Vue 3 + TypeScript
- **编辑器**: @umoteam/editor (基于 Tiptap)
- **协同引擎**: Yjs + y-websocket
- **UI 库**: Element Plus
- **服务端**: Node.js + Express + WebSocket

## 🚀 快速开始

### 1. 安装依赖

前端项目已包含所有必要的依赖，直接安装即可：

```bash
# 前端项目
cd e:/job-project/yd-admin
npm install

# 服务端项目
cd e:/job-project/yd-admin-server
npm install
```

### 2. 启动服务端（包含 WebSocket 服务）

```bash
cd e:/job-project/yd-admin-server
npm start
```

服务器将在 `http://localhost:3001` 和 `ws://localhost:3001` 上运行。

### 3. 启动前端应用

```bash
cd e:/job-project/yd-admin
npm run dev
```

### 4. 访问应用

打开浏览器访问：

```
http://localhost:你的端口/document/demo
```

## 📖 文档

- **快速启动**: [COLLABORATIVE_EDITING_QUICKSTART.md](./COLLABORATIVE_EDITING_QUICKSTART.md)
- **实现总结**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **迁移指南**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **使用示例**: [src/views/document/USAGE_EXAMPLES.js](./src/views/document/USAGE_EXAMPLES.js)
- **详细文档**: [src/views/document/README.md](./src/views/document/README.md)

## 📁 项目结构

```
yd-admin/                                        # 前端项目
├── src/
│   └── views/
│       └── document/
│           ├── UmoCollaborativeEditor.vue      # 主编辑器组件
│           ├── CollaborativeEditorDemo.vue     # 演示页面
│           ├── config/
│           │   └── editorConfig.ts             # 配置文件
│           ├── components/
│           │   └── CollaborationPanel.vue      # 协同面板
│           ├── README.md                        # 详细文档
│           └── USAGE_EXAMPLES.js               # 使用示例
├── COLLABORATIVE_EDITING_QUICKSTART.md         # 快速启动
├── IMPLEMENTATION_SUMMARY.md                   # 实现总结
└── MIGRATION_GUIDE.md                          # 迁移指南

yd-admin-server/                                 # 服务端项目
├── server.js                                    # Express + WebSocket 服务器
├── package.json                                 # 服务器依赖
└── README.md                                    # 服务器文档
```

## ✨ 核心功能

### 实时协同编辑

- 多人同时编辑同一文档
- 实时显示其他用户的光标和选区
- CRDT 算法自动处理冲突

### 富文本编辑

- 标题、段落、列表
- 粗体、斜体、下划线、删除线
- 文本对齐（左、中、右、两端）
- 图片、表格、链接
- 代码块、引用块
- Markdown 支持

### 分页模式

- 类似 Microsoft Word 的分页视图
- A4 纸张大小
- 页眉页脚支持
- 打印预览

### 协作功能

- 在线用户列表
- 用户状态感知
- 操作历史记录
- 实时同步

## 🔧 配置

### 环境变量

在项目根目录创建 `.env.local`：

```env
# WebSocket 服务器地址
VITE_WS_URL=ws://localhost:3001

# 编辑器密钥（可选）
VITE_EDITOR_KEY=your-editor-key
```

### 编辑器配置

在 `src/views/document/config/editorConfig.ts` 中自定义：

```typescript
export const defaultEditorOptions = {
  toolbar: {
    mode: 'ribbon' // 'default' | 'classic' | 'ribbon'
  },
  page: {
    enabled: true // 启用分页模式
  },
  shortcuts: {
    enabled: true
  }
}
```

## 📝 使用方法

### 基础使用

```vue
<template>
  <UmoCollaborativeEditor :doc-id="documentId" />
</template>

<script setup lang="ts">
import UmoCollaborativeEditor from '@/views/document/UmoCollaborativeEditor.vue'

const documentId = ref('my-document')
</script>
```

### 监听事件

```vue
<template>
  <UmoCollaborativeEditor
    :doc-id="documentId"
    @connection-change="handleConnectionChange"
    @collaborators-change="handleCollaboratorsChange"
  />
</template>

<script setup lang="ts">
const handleConnectionChange = (status: string) => {
  console.log('连接状态:', status)
}

const handleCollaboratorsChange = (users: any[]) => {
  console.log('在线用户:', users)
}
</script>
```

更多示例请查看 [USAGE_EXAMPLES.js](./src/views/document/USAGE_EXAMPLES.js)

## 🎨 界面预览

```
┌─────────────────────────────────────────────────────┐
│  [新建] [打开] [分享] [历史]     ●已连接  👥 3人在线  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔═══════════════════════════════════════════╗     │
│  ║ 📄 协同文档编辑                            ║     │
│  ║                                           ║     │
│  ║ 这是一个支持多人实时协同的文档编辑器...     ║     │
│  ║                                           ║     │
│  ║ • 支持富文本编辑                           ║     │
│  ║ • 支持实时协同                             ║     │
│  ║ • 支持版本历史                             ║     │
│  ╚═══════════════════════════════════════════╝     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔐 安全性

### 建议的安全措施

1. **身份认证**: 在 WebSocket 服务器添加 JWT 认证
2. **权限控制**: 实现文档级别的访问控制
3. **HTTPS**: 生产环境使用 WSS (WebSocket over TLS)
4. **输入验证**: 验证和清理用户输入
5. **XSS 防护**: 使用 DOMPurify 清理 HTML

## 🚢 生产部署

### 前端部署

```bash
# 构建生产版本
npm run build:prod

# 部署到服务器
# 将 dist 目录复制到 Web 服务器
```

### WebSocket 服务器部署

WebSocket 服务已集成在 yd-admin-server 项目中。

```bash
# 进入服务端项目
cd e:/job-project/yd-admin-server

# 使用 PM2 管理进程
pm2 start server.js --name "yd-admin-server"
pm2 save
pm2 startup
```

### Nginx 配置

```nginx
# WebSocket 反向代理
location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🐛 故障排查

### 无法连接到 WebSocket 服务器

1. 检查 WebSocket 服务器是否运行：`ps aux | grep websocket-server`
2. 检查端口是否被占用：`netstat -an | grep 3001`
3. 检查防火墙设置
4. 查看浏览器控制台错误信息

### 编辑器无法显示

1. 检查 @umoteam/editor 是否正确安装
2. 检查样式文件是否正确导入
3. 查看浏览器控制台错误

### 协同不同步

1. 确保所有客户端连接到同一个 WebSocket 服务器
2. 确保文档 ID 一致
3. 检查网络连接稳定性

## 📈 性能优化

1. **启用持久化**: 使用 Level DB 或 Redis
2. **负载均衡**: 部署多个 WebSocket 服务器实例
3. **CDN 加速**: 静态资源使用 CDN
4. **懒加载**: 大型文档分块加载
5. **压缩**: 启用 WebSocket 压缩

## 🛣️ 路线图

### 短期 (1-2 周)

- [ ] 用户认证
- [ ] 文档持久化
- [ ] 权限管理
- [ ] 移动端优化

### 中期 (1-2 月)

- [ ] 版本历史
- [ ] 评论批注
- [ ] 文档模板
- [ ] 离线编辑

### 长期 (3-6 月)

- [ ] AI 辅助写作
- [ ] 音视频会议
- [ ] 文档加密
- [ ] 高级协作

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- [Umo Editor](https://github.com/umodoc/editor) - 强大的文档编辑器
- [Yjs](https://github.com/yjs/yjs) - CRDT 协同引擎
- [Tiptap](https://github.com/ueberdosis/tiptap) - 富文本编辑器框架
- [Element Plus](https://github.com/element-plus/element-plus) - Vue 3 UI 库

## 📞 联系方式

如有问题或建议，请：

- 查看文档
- 提交 Issue
- 发送邮件

---

**Happy Coding! 🎉**
