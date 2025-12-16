# 环境变量配置说明

## 新增环境变量

在 `.env` 或 `.env.dev` / `.env.prod` 文件中添加以下配置：

```ini
# Mock/Java 后端切换开关
# true: 使用 Mock 数据（开发调试）
# false: 使用 Java 后端接口（联调/生产）
VITE_USE_MOCK=true

# Java 后端 API 地址
# 用于直接调用 Java 后端接口（演训方案、模板管理等）
VITE_JAVA_API_URL=http://192.168.8.104:8080

# WebSocket 协同中间件地址（保持不变）
# 仅用于 WebSocket 协同编辑通讯
VITE_WS_URL=ws://localhost:3001

# 协同中间件 HTTP 地址（可选，已废弃）
# 重构后已不再使用，可保留用于兼容或删除
# VITE_COLLABORATION_API_URL=http://localhost:3001
```

## 配置说明

### VITE_USE_MOCK

- **用途**: 控制 API 使用 Mock 数据还是真实 Java 后端
- **可选值**:
  - `true`: 使用 Mock 数据，适用于前端独立开发调试
  - `false`: 使用 Java 后端接口，适用于联调和生产环境
- **默认值**: 未设置时默认为 `false`（使用 Java 后端）
- **涉及模块**:
  - 演训方案 API (`@/api/training/performance`)
  - 模板管理 API (`@/api/template/management`)

### VITE_JAVA_API_URL

- **用途**: 直接调用 Java 后端 API
- **默认值**: `http://192.168.8.104:8080`
- **涉及模块**:
  - 演训方案 API (`/api/getPlan/*`)
  - 模板管理 API (`/api/tbTemplate/*`)
  - 文档素材 API (`/api/users/*`)

### VITE_WS_URL

- **用途**: WebSocket 协同编辑通讯
- **默认值**: `ws://localhost:3001`
- **涉及模块**:
  - 文档协同编辑 (`/collaboration`)
  - Markdown 协同编辑 (`/markdown`)

## 开发环境示例（使用 Mock）

```ini
# .env.dev - 使用 Mock 数据
VITE_USE_MOCK=true
VITE_JAVA_API_URL=http://192.168.8.104:8080
VITE_WS_URL=ws://localhost:3001
```

## 开发环境示例（联调 Java）

```ini
# .env.dev - 联调 Java 后端
VITE_USE_MOCK=false
VITE_JAVA_API_URL=http://192.168.8.104:8080
VITE_WS_URL=ws://localhost:3001
```

## 生产环境示例

```ini
# .env.prod - 生产环境始终使用真实后端
VITE_USE_MOCK=false
VITE_JAVA_API_URL=http://production-java-server:8080
VITE_WS_URL=ws://production-ws-server:3001
```

## 快速切换方式

### 方式一：修改环境变量文件

编辑 `.env.dev` 文件，修改 `VITE_USE_MOCK` 的值：

```ini
# 切换到 Mock 模式
VITE_USE_MOCK=true

# 切换到 Java 后端模式
VITE_USE_MOCK=false
```

### 方式二：启动命令设置

```bash
# 使用 Mock 数据启动
VITE_USE_MOCK=true pnpm dev

# 使用 Java 后端启动
VITE_USE_MOCK=false pnpm dev
```

## 架构变更说明

### 重构前

```
前端 -> collaborative-middleware (HTTP) -> Java 后端
前端 -> collaborative-middleware (WebSocket) -> 协同编辑
```

### 重构后

```
前端 -> Java 后端 (HTTP 直连)
前端 -> collaborative-middleware (WebSocket 仅协同编辑)
```

## API 路径映射

| 功能         | 前端调用                      | Java 后端路径                     |
| ------------ | ----------------------------- | --------------------------------- |
| 演训方案列表 | `getPageList()`               | `/api/getPlan/getPageList`        |
| 新建演训方案 | `createNewData()`             | `/api/getPlan/newData`            |
| 删除演训方案 | `deleteTrainingPerformance()` | `/api/getPlan/delData`            |
| 提交审核     | `submitAudit()`               | `/api/getPlan/submitReview`       |
| 发布文档     | `publishDocument()`           | `/api/getPlan/publishData`        |
| 权限校验     | `checkWritePermission()`      | `/api/getPlan/getPermissionCheck` |
| 文件流获取   | `getFileStream()`             | `/api/getPlan/getfileStream`      |
| 模板列表     | `getPageList()`               | `/api/tbTemplate/getPageList`     |
| 创建模板     | `savaTemplate()`              | `/api/tbTemplate/savaTemplate`    |
| 更新模板     | `updateTemplate()`            | `/api/tbTemplate/editData`        |
| 删除模板     | `deleteTemplate()`            | `/api/tbTemplate/delList`         |
| 保存模板文件 | `saveDocument()`              | `/api/tbTemplate/saveFile`        |
