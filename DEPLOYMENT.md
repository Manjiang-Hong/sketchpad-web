# SketchPad Web 部署指南

## 🚀 部署架构

- **前端**: Vercel（自动 HTTPS、全球 CDN）
- **后端**: Railway（Node.js 运行时、持久化存储）
- **数据库**: JSON 文件存储（Railway 持久卷）

---

## 📋 部署步骤

### 第一步：部署后端到 Railway

#### 1.1 注册 Railway
访问 https://railway.app/
- 使用 GitHub 账号登录
- 免费额度：$5/月（足够测试使用）

#### 1.2 创建新项目
1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 授权 GitHub 访问
4. 选择 `sketchpad-web` 仓库

#### 1.3 配置环境变量
在 Railway 项目设置中添加环境变量：

```
JWT_SECRET=your-super-secret-key-change-this-2026
PORT=3001
```

可选（用于 AI 生图）：
```
TENCENT_SECRET_ID=your_id
TENCENT_SECRET_KEY=your_key
```

#### 1.4 配置持久化存储
Railway 默认每次部署会重置文件系统，需要添加 Volume：

1. 在项目中点击 **"Volumes"**
2. 点击 **"Add Volume"**
3. 挂载路径设置为：`/app/server/data`
4. 保存

#### 1.5 获取后端 URL
部署成功后，Railway 会提供一个域名，例如：
```
https://sketchpad-backend-production.up.railway.app
```

记下这个 URL，前端配置需要用到。

---

### 第二步：部署前端到 Vercel

#### 2.1 注册 Vercel
访问 https://vercel.com/
- 使用 GitHub 账号登录
- 免费版完全够用

#### 2.2 导入项目
1. 点击 **"Add New Project"**
2. 选择 `sketchpad-web` 仓库
3. Framework Preset: **Vite**

#### 2.3 配置环境变量
在 Vercel 项目设置中添加：

```
VITE_API_HOST=sketchpad-backend-production.up.railway.app
```

⚠️ **注意**：只填写域名，不要带 `https://`

#### 2.4 部署
点击 **"Deploy"**，等待构建完成。

部署成功后，Vercel 会提供一个域名，例如：
```
https://sketchpad-web.vercel.app
```

---

## 🔧 本地开发配置

### 前端开发
```powershell
cd sketchpad-web
npm run dev
# 访问 http://localhost:5173
```

### 后端开发
```powershell
cd sketchpad-web
npm run dev:server
# 访问 http://localhost:3001
```

### 同时启动前后端
```powershell
npm run dev:all
```

---

## 🧪 测试账号

部署成功后，后端会自动创建测试账号：

| 用户名 | 密码 |
|--------|------|
| test1  | test123 |
| test2  | test123 |
| test3  | test123 |

---

## 📦 项目结构

```
sketchpad-web/
├── src/                    # 前端代码
│   ├── components/         # React 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 服务
│   └── App.tsx             # 入口组件
├── server/                 # 后端代码
│   ├── index.cjs           # Express 服务器
│   └── data/               # 数据存储目录
│       ├── users.json      # 用户数据
│       └── projects/       # 用户项目
├── vercel.json             # Vercel 配置
├── railway.toml            # Railway 配置
└── package.json
```

---

## ⚠️ 注意事项

### 1. 数据持久化
Railway 默认每次部署会重置文件系统，必须配置 Volume 才能保留用户数据。

### 2. HTTPS 要求
- 语音录制功能需要 HTTPS
- Vercel/Railway 都默认提供 HTTPS
- 本地开发 localhost 除外

### 3. 跨域问题
- Vercel 和 Railway 域名不同，已配置 CORS
- 生产环境需要更新 CORS 白名单

### 4. 成本估算
- Railway: 免费 $5/月额度
- Vercel: 免费版无限额度
- 腾讯云 API: 按使用量付费

---

## 🔍 故障排查

### 前端无法连接后端
1. 检查 Vercel 环境变量 `VITE_API_HOST` 是否正确
2. 检查后端是否正常运行（访问 `https://<backend-url>/api/health`）
3. 检查浏览器控制台 CORS 错误

### 用户数据丢失
1. 检查 Railway Volume 是否正确挂载
2. 检查 Volume 路径是否为 `/app/server/data`

### 登录失败
1. 检查 JWT_SECRET 环境变量是否设置
2. 检查后端日志（Railway 控制台）
3. 尝试重新注册测试账号

---

## 📞 获取帮助

遇到问题请检查：
1. Vercel 部署日志
2. Railway 部署日志
3. 浏览器控制台错误

---

_最后更新：2026-04-02_