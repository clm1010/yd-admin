# 协同编辑光标功能测试指南

## 前置条件

1. **后端服务运行中**

   - 确保 WebSocket 服务器已启动（端口 3001）
   - 可以通过以下命令启动：
     ```bash
     cd yd-admin-server
     node app.js
     ```

2. **前端服务运行中**
   - 确保前端开发服务器已启动
     ```bash
     cd yd-admin
     pnpm dev
     ```

## 测试步骤

### 1. 单用户测试

1. 访问协同编辑页面：`http://localhost:xxxx/document/collaborative`
2. 检查页面顶部连接状态是否显示"已连接"（绿色圆点）
3. 在编辑器中输入文字，确保正常工作
4. 检查浏览器控制台是否有错误信息

### 2. 多用户协同测试

#### 方法一：使用多个浏览器标签页

1. **打开第一个标签页**

   - 访问 `http://localhost:xxxx/document/collaborative?docId=test-doc-1`
   - 等待连接状态显示"已连接"
   - 记住右侧协同面板中显示的用户名（例如：快乐的小熊42）

2. **打开第二个标签页**

   - 在同一浏览器中新开一个标签页
   - 访问相同 URL：`http://localhost:xxxx/document/collaborative?docId=test-doc-1`
   - 等待连接状态显示"已连接"
   - 检查右侧协同面板是否显示两个用户

3. **测试光标同步**

   - 在第一个标签页中，将光标放置在文档某处
   - 切换到第二个标签页
   - **预期结果**：应该能看到第一个用户的光标（带有用户名标签）
   - 在第二个标签页中移动光标
   - 切换回第一个标签页
   - **预期结果**：应该能看到第二个用户的光标

4. **测试内容同步**
   - 在任一标签页中输入文字
   - 切换到另一个标签页
   - **预期结果**：文字应该实时出现

#### 方法二：使用不同浏览器

1. 在 Chrome 中打开：`http://localhost:xxxx/document/collaborative?docId=test-doc-2`
2. 在 Firefox 中打开：`http://localhost:xxxx/document/collaborative?docId=test-doc-2`
3. 进行与方法一相同的测试

#### 方法三：使用隐私/无痕模式

1. 正常模式：`http://localhost:xxxx/document/collaborative?docId=test-doc-3`
2. 隐私模式：`http://localhost:xxxx/document/collaborative?docId=test-doc-3`
3. 进行测试

## 预期结果检查清单

### 视觉检查

- [ ] 每个用户的光标显示为不同颜色的竖线
- [ ] 光标上方显示用户名标签
- [ ] 用户名标签背景色与光标颜色一致
- [ ] 光标随用户操作实时移动
- [ ] 右侧协同面板显示所有在线用户
- [ ] 当前用户在用户列表中标记为"我"

### 功能检查

- [ ] 多个用户可以同时编辑文档
- [ ] 文本输入实时同步到所有用户
- [ ] 光标位置实时同步到所有用户
- [ ] 用户加入时，其他用户能看到新用户的光标
- [ ] 用户离开时，其光标从其他用户视图中消失
- [ ] 连接断开时显示重连提示
- [ ] 重连成功后协同功能恢复正常

### 性能检查

- [ ] 光标移动无明显延迟（< 100ms）
- [ ] 文字输入无明显卡顿
- [ ] 多用户同时编辑时性能稳定
- [ ] 长文档（1000+ 字）时性能正常

## 常见问题排查

### 问题：看不到其他用户的光标

**可能原因：**

1. 两个窗口使用了不同的 docId
2. WebSocket 连接未建立成功
3. 协同光标扩展未正确加载

**排查步骤：**

1. 检查两个窗口的 URL 中 docId 是否相同
2. 检查连接状态是否为"已连接"
3. 打开浏览器控制台，查看是否有错误信息
4. 检查后端 WebSocket 服务是否正常运行

### 问题：连接状态显示"连接断开"

**可能原因：**

1. 后端 WebSocket 服务未启动
2. WebSocket 端口被占用或防火墙拦截
3. 配置的 WebSocket URL 不正确

**排查步骤：**

1. 检查 `yd-admin-server` 是否正在运行
2. 检查 `.env` 文件中 `VITE_WS_URL` 配置
3. 尝试重启后端服务

### 问题：光标显示但位置不准确

**可能原因：**

1. CSS 样式冲突
2. 编辑器版本不兼容

**排查步骤：**

1. 检查浏览器开发者工具中的样式
2. 确认 `@umoteam/editor` 版本为 8.1.0
3. 清除浏览器缓存后重试

### 问题：用户名重复

这是正常现象，因为用户名是随机生成的。可以通过以下方式区分：

- 每个用户的颜色不同
- 可以在代码中添加用户 ID 显示

## 浏览器兼容性

### 支持的浏览器

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 不支持的浏览器

- ❌ IE 11 及以下版本
- ❌ 过旧版本的移动浏览器

## 调试技巧

### 查看协同状态

在浏览器控制台中输入：

```javascript
// 查看当前文档的协同用户
console.log(provider.awareness.getStates())

// 查看当前用户信息
console.log(provider.awareness.getLocalState())

// 查看连接状态
console.log(provider.wsconnected)
```

### 监听协同事件

在代码中添加以下调试代码：

```javascript
// 在 initCollaboration 函数中添加
provider.awareness.on('change', () => {
  console.log('用户状态变化:', provider.awareness.getStates())
})

provider.on('sync', (synced) => {
  console.log('同步状态:', synced)
})
```

## 性能优化建议

1. **限制协同用户数量**：建议单个文档同时在线用户不超过 10 人
2. **大文档分片**：超过 5000 字的文档建议分章节编辑
3. **网络优化**：使用 CDN 加速 WebSocket 连接
4. **定期保存**：建议每 5 分钟自动保存一次

## 下一步

测试通过后，可以考虑：

1. 添加用户头像显示
2. 实现光标跟随功能
3. 添加选中文本高亮
4. 实现用户@提及功能
5. 添加评论和批注功能
