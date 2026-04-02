# SketchPad Web - 部署配置完成

## 已完成配置

### 1. Git 仓库初始化 ✅
- 已初始化 Git 仓库
- 已提交所有代码（44 个文件）
- 提交信息：`Initial commit: SketchPad Web with auth system`

### 2. 部署配置文件 ✅
- `vercel.json` - Vercel 前端部署配置
- `railway.toml` - Railway 后端部署配置
- `.gitignore` - 忽略敏感文件和构建产物
- `DEPLOYMENT.md` - 详细部署指南

### 3. 代码修改 ✅
- `src/services/api.ts` - 支持动态 API 地址（开发/生产环境）
- `vite.config.ts` - 支持环境变量
- `server/index.cjs` - CORS 配置支持跨域
- `package.json` - 修复后端启动脚本

---

## 下一步：推送到 GitHub

### 方法一：创建新仓库（推荐）

1. **访问 GitHub**
   - 登录 https://github.com
   - 点击右上角 `+` → `New repository`

2. **创建仓库**
   - Repository name: `sketchpad-web`
   - Description: `SketchPad Web - AI-powered design annotation platform`
   - Public 或 Private（都可以）
   - **不要**勾选 "Initialize with README"（已有代码）

3. **推送代码**
   GitHub 会显示推送命令，类似：
   ```powershell
   git remote add origin https://github.com/<你的用户名>/sketchpad-web.git
   git branch -M main
   git push -u origin main
   ```

### 方法二：使用 GitHub CLI（如果已安装）

```powershell
cd c:\Users\Hong\WorkBuddy\20260330235933\sketchpad-web
gh repo create sketchpad-web --public --source=. --remote=origin --push
```

---

## 部署流程

### 第一步：部署后端到 Railway

1. **注册 Railway**
   - 访问 https://railway.app/
   - 使用 GitHub 账号登录

2. **创建项目**
   - 点击 `New Project`
   - 选择 `Deploy from GitHub repo`
   - 选择 `sketchpad-web` 仓库

3. **配置环境变量**
   ```
   JWT_SECRET=your-super-secret-key-change-this-2026
   PORT=3001
   ```

4. **添加持久化存储**
   - 在项目中点击 `Volumes`
   - 点击 `Add Volume`
   - 挂载路径：`/app/server/data`
   - **重要**：不添加 Volume 每次部署会丢失用户数据

5. **获取后端 URL**
   部署成功后，复制域名：
   ```
   https://sketchpad-backend-xxx.up.railway.app
   ```

### 第二步：部署前端到 Vercel

1. **注册 Vercel**
   - 访问 https://vercel.com/
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 `Add New Project`
   - 选择 `sketchpad-web` 仓库
   - Framework Preset: `Vite`

3. **配置环境变量**
   ```
   VITE_API_HOST=sketchpad-backend-xxx.up.railway.app
   ```
   ⚠️ **只填域名，不带 https://**

4. **部署**
   - 点击 `Deploy`
   - 等待构建完成

5. **访问应用**
   部署成功后访问：
   ```
   https://sketchpad-web.vercel.app
   ```

---

## 测试账号

部署成功后，可以使用以下测试账号：

| 用户名 | 密码 |
|--------|------|
| test1  | test123 |
| test2  | test123 |
| test3  | test123 |

---

## 常见问题

### Q: 用户数据丢失？
**A**: 检查 Railway Volume 是否正确挂载到 `/app/server/data`

### Q: 前端无法连接后端？
**A**: 检查 Vercel 环境变量 `VITE_API_HOST` 是否正确设置

### Q: 登录失败？
**A**: 检查后端日志，确认 JWT_SECRET 环境变量已设置

---

## 相关文档

- 详细部署指南：`DEPLOYMENT.md`
- 项目状态：`PROJECT_STATUS.md`
- 开发文档：`README.md`

---

_生成时间：2026-04-02_