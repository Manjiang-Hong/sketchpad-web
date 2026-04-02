# SketchPad Web 版

基于 React + Canvas 的在线画板，支持 AI 生图和语音标注。

## ✨ 功能

- 🎨 **画笔绘制**：支持压感、多颜色、多尺寸
- 🧽 **橡皮擦**：精准擦除
- 🔍 **缩放平移**：滚轮缩放、中键拖拽
- 🎤 **语音标注**：浏览器录音 + 云端语音识别
- ✨ **AI 生图**：腾讯混元文生图 API
- 💾 **本地存储**：IndexedDB 自动保存

## 🚀 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

创建 `.env` 文件：

\`\`\`env
TENCENT_SECRET_ID=你的腾讯云SecretId
TENCENT_SECRET_KEY=你的腾讯云SecretKey
\`\`\`

获取方式：[腾讯云控制台](https://console.cloud.tencent.com/cam/capi)

### 3. 启动开发服务器

\`\`\`bash
npm run dev:all
\`\`\`

这会同时启动：
- 前端开发服务器（Vite）：http://localhost:5173
- 后端 API 服务器（Express）：http://localhost:3001

### 4. 访问应用

打开浏览器访问：http://localhost:5173

## 📖 使用说明

### 基本操作

- **左键拖拽**：绘制笔迹
- **中键拖拽**：平移画布
- **滚轮**：缩放画布

### 工具栏

- 🖊️ **画笔**：切换到画笔模式
- 🧽 **橡皮擦**：切换到橡皮擦模式
- 🔄 **重置视图**：恢复默认缩放和平移
- 🎤 **语音标注**：开始/停止录音
- ✨ **AI 生图**：输入描述生成图片

### 快捷键

（暂未实现，计划支持）
- \`F1\`：开始/停止录音
- \`Ctrl+S\`：保存项目

## 🛠️ 技术栈

### 前端
- React 19
- TypeScript
- Vite
- Canvas API
- MediaRecorder API
- IndexedDB (idb)

### 后端
- Express
- 腾讯云 SDK
  - 语音识别（ASR）
  - 混元文生图（Hunyuan）

## 🌐 浏览器支持

| 浏览器 | 版本要求 | 备注 |
|--------|----------|------|
| Chrome | ✅ 最新版 | 推荐 |
| Firefox | ✅ 最新版 | - |
| Edge | ✅ 最新版 | - |
| Safari | ⚠️ 14+ | 录音格式降级为 WAV |

**注意**：
- 语音录制需要 HTTPS（本地开发 localhost 除外）
- 首次使用需要授权麦克风权限

## 📦 打包部署

### 前端打包

\`\`\`bash
npm run build
\`\`\`

生成文件在 \`dist/\` 目录。

### 后端部署

推荐使用云函数（腾讯云 SCF / 阿里云 FC）或 Node.js 服务器。

**环境变量配置**：
- \`TENCENT_SECRET_ID\`
- \`TENCENT_SECRET_KEY\`
- \`PORT\`（默认 3001）

## 🔧 开发计划

### 已完成 ✅
- [x] 画笔绘制
- [x] 橡皮擦
- [x] 缩放平移
- [x] 本地存储
- [x] AI 生图（基础版）
- [x] 语音录制（Web 版）

### 进行中 🚧
- [ ] 语音识别云端化
- [ ] 项目管理（打开/保存）

### 计划中 📋
- [ ] 智能选色块
- [ ] 导出功能（PNG/PDF）
- [ ] 快捷键支持
- [ ] PWA 离线支持
- [ ] 多人协作

## 📄 许可证

MIT

## 🙏 致谢

- [Lucide React](https://lucide.dev/) - 图标库
- [idb](https://github.com/jakearchibald/idb) - IndexedDB 封装
- [腾讯云](https://cloud.tencent.com/) - AI 和语音服务