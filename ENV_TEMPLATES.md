# 环境配置模板

请将以下内容复制到对应的环境配置文件中。

---

## .env.dev（开发环境 - 使用 Mock 数据）

```ini
# ========================================
# 开发环境配置 - Mock 模式
# ========================================

# Mock/Java 后端切换
# true: 使用 Mock 数据（前端独立开发）
# false: 使用 Java 后端接口（联调）
VITE_USE_MOCK=true

# Java 后端 API 地址
VITE_JAVA_API_URL=http://192.168.8.104:8080

# WebSocket 协同中间件地址
VITE_WS_URL=ws://localhost:3001
```

---

## .env.local（本地联调环境 - 使用 Java 后端）

```ini
# ========================================
# 本地联调环境配置 - Java 后端模式
# ========================================

# Mock/Java 后端切换
# false: 使用 Java 后端接口
VITE_USE_MOCK=false

# Java 后端 API 地址（根据实际情况修改）
VITE_JAVA_API_URL=http://192.168.8.104:8080

# WebSocket 协同中间件地址
VITE_WS_URL=ws://localhost:3001
```

---

## .env.prod（生产环境）

```ini
# ========================================
# 生产环境配置
# ========================================

# 生产环境始终使用真实后端
VITE_USE_MOCK=false

# Java 后端 API 地址（生产服务器）
VITE_JAVA_API_URL=http://your-production-server:8080

# WebSocket 协同中间件地址（生产服务器）
VITE_WS_URL=ws://your-production-server:3001
```

---

# collaborative-middleware 中间件配置

## .env.dev（开发环境）

```ini
# ========================================
# 中间件开发环境配置
# ========================================

# 服务端口
COLLABORATIVE_MIDDLEWARE_PORT=3001

# CORS 允许的来源（开发环境允许本地访问）
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# 环境
NODE_ENV=development
```

## .env.prod（生产环境）

```ini
# ========================================
# 中间件生产环境配置
# ========================================

# 服务端口
COLLABORATIVE_MIDDLEWARE_PORT=3001

# CORS 允许的来源（生产环境限制域名）
CORS_ORIGIN=http://your-production-domain.com,https://your-production-domain.com

# 环境
NODE_ENV=production
```

---

# 快速配置指南

## 场景一：前端独立开发（无需启动后端）

1. 前端 `.env.dev`:

   ```ini
   VITE_USE_MOCK=true
   ```

2. 启动前端:
   ```bash
   cd yd-admin
   pnpm dev
   ```

## 场景二：前后端联调

1. 前端 `.env.dev` 或 `.env.local`:

   ```ini
   VITE_USE_MOCK=false
   VITE_JAVA_API_URL=http://192.168.8.104:8080
   VITE_WS_URL=ws://localhost:3001
   ```

2. 启动中间件:

   ```bash
   cd collaborative-middleware
   pnpm start:dev
   ```

3. 启动前端:
   ```bash
   cd yd-admin
   pnpm dev
   ```

## 场景三：临时切换模式（不修改配置文件）

```bash
# 使用 Mock 模式启动
VITE_USE_MOCK=true pnpm dev

# 使用 Java 后端模式启动
VITE_USE_MOCK=false pnpm dev
```

---

# 配置变量说明

| 变量名                          | 说明           | 默认值                      |
| ------------------------------- | -------------- | --------------------------- |
| `VITE_USE_MOCK`                 | Mock/Java 切换 | `false`                     |
| `VITE_JAVA_API_URL`             | Java 后端地址  | `http://192.168.8.104:8080` |
| `VITE_WS_URL`                   | WebSocket 地址 | `ws://localhost:3001`       |
| `COLLABORATIVE_MIDDLEWARE_PORT` | 中间件端口     | `3001`                      |
| `CORS_ORIGIN`                   | CORS 允许来源  | `*`                         |
