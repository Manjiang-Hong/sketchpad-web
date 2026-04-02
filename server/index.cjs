// SketchPad Web 后端服务器（带用户认证）
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'sketchpad-dev-secret-key-2026'

// 中间件
// CORS 配置（生产环境需要配置允许的域名）
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  // Vercel 部署后的域名（需要替换为实际域名）
  'https://sketchpad-web.vercel.app',
]

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 Postman）
    if (!origin) return callback(null, true)
    
    // 检查是否在白名单中
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      // 生产环境允许所有 Vercel 域名
      if (origin && origin.includes('.vercel.app')) {
        callback(null, true)
      } else {
        callback(new Error('不允许的跨域请求'))
      }
    }
  },
  credentials: true,
}))
app.use(express.json())

// 数据目录
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const PROJECTS_DIR = path.join(DATA_DIR, 'projects')

// 确保目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true })

// 初始化用户数据
if (!fs.existsSync(USERS_FILE)) {
  const defaultUsers = [
    {
      id: 'user-001',
      username: 'test1',
      passwordHash: bcrypt.hashSync('test123', 10),
      createdAt: Date.now(),
    },
    {
      id: 'user-002',
      username: 'test2',
      passwordHash: bcrypt.hashSync('test123', 10),
      createdAt: Date.now(),
    },
    {
      id: 'user-003',
      username: 'test3',
      passwordHash: bcrypt.hashSync('test123', 10),
      createdAt: Date.now(),
    },
  ]
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2))
  console.log('✅ 初始化测试账号: test1, test2, test3 (密码: test123)')
}

// 读取用户数据
const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

// JWT 认证中间件
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

// ============ 认证 API ============

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' })
    }
    
    const users = getUsers()
    const user = users.find(u => u.username === username)
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('[Auth] 登录错误:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 注册（仅限测试阶段开放）
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' })
    }
    
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度应为 2-20 个字符' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少 6 个字符' })
    }
    
    const users = getUsers()
    
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: '用户名已存在' })
    }
    
    const newUser = {
      id: `user-${Date.now()}`,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: Date.now(),
    }
    
    users.push(newUser)
    saveUsers(users)
    
    // 创建用户项目目录
    const userProjectDir = path.join(PROJECTS_DIR, newUser.id)
    fs.mkdirSync(userProjectDir, { recursive: true })
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    })
  } catch (error) {
    console.error('[Auth] 注册错误:', error)
    res.status(500).json({ error: '注册失败' })
  }
})

// 验证 Token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.userId,
      username: req.username,
    },
  })
})

// ============ 项目 API（需要认证） ============

// 获取用户的所有项目
app.get('/api/projects', authMiddleware, (req, res) => {
  try {
    const userProjectDir = path.join(PROJECTS_DIR, req.userId)
    
    if (!fs.existsSync(userProjectDir)) {
      return res.json({ projects: [] })
    }
    
    const files = fs.readdirSync(userProjectDir).filter(f => f.endsWith('.json'))
    const projects = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(userProjectDir, file), 'utf-8'))
      return {
        id: data.id,
        name: data.name,
        updatedAt: data.updatedAt,
        strokeCount: data.strokes?.length || 0,
        noteCount: data.notes?.length || 0,
      }
    }).sort((a, b) => b.updatedAt - a.updatedAt)
    
    res.json({ projects })
  } catch (error) {
    console.error('[Projects] 获取列表错误:', error)
    res.status(500).json({ error: '获取项目列表失败' })
  }
})

// 获取单个项目
app.get('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, req.userId, `${req.params.id}.json`)
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: '项目不存在' })
    }
    
    const data = JSON.parse(fs.readFileSync(projectPath, 'utf-8'))
    res.json(data)
  } catch (error) {
    console.error('[Projects] 获取项目错误:', error)
    res.status(500).json({ error: '获取项目失败' })
  }
})

// 保存项目
app.post('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const userProjectDir = path.join(PROJECTS_DIR, req.userId)
    if (!fs.existsSync(userProjectDir)) {
      fs.mkdirSync(userProjectDir, { recursive: true })
    }
    
    const projectPath = path.join(userProjectDir, `${req.params.id}.json`)
    const projectData = {
      ...req.body,
      id: req.params.id,
      updatedAt: Date.now(),
    }
    
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2))
    
    res.json({ success: true, message: '项目已保存' })
  } catch (error) {
    console.error('[Projects] 保存错误:', error)
    res.status(500).json({ error: '保存失败' })
  }
})

// 删除项目
app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, req.userId, `${req.params.id}.json`)
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: '项目不存在' })
    }
    
    fs.unlinkSync(projectPath)
    res.json({ success: true, message: '项目已删除' })
  } catch (error) {
    console.error('[Projects] 删除错误:', error)
    res.status(500).json({ error: '删除失败' })
  }
})

// ============ 画稿上传 API（供 AI 读取） ============

// 上传画稿（截图 + 标注）
app.post('/api/sketchpad/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { annotations } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: '未收到图片文件' })
    }
    
    console.log(`[SketchPad] 用户 ${req.username} 上传画稿:`)
    console.log('  - 图片大小:', req.file.size, 'bytes')
    
    const annotationData = annotations ? JSON.parse(annotations) : null
    if (annotationData) {
      console.log('  - 笔迹:', annotationData.strokes?.length || 0, '条')
      console.log('  - 备注:', annotationData.notes?.length || 0, '条')
    }
    
    // 保存到用户目录
    const uploadDir = path.join(PROJECTS_DIR, req.userId, 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const timestamp = Date.now()
    const imagePath = path.join(uploadDir, `sketch-${timestamp}.png`)
    const jsonPath = path.join(uploadDir, `sketch-${timestamp}.json`)
    
    // 保存图片
    fs.writeFileSync(imagePath, req.file.buffer)
    
    // 保存标注
    if (annotations) {
      fs.writeFileSync(jsonPath, annotations)
    }
    
    // 更新 latest.json
    const latestPath = path.join(uploadDir, 'latest.json')
    fs.writeFileSync(latestPath, JSON.stringify({
      imageFile: `sketch-${timestamp}.png`,
      annotationFile: `sketch-${timestamp}.json`,
      receivedAt: new Date().toISOString(),
      userId: req.userId,
      username: req.username,
    }, null, 2))
    
    res.json({
      success: true,
      message: '画稿已上传',
      files: {
        image: `sketch-${timestamp}.png`,
        annotations: `sketch-${timestamp}.json`,
      },
    })
  } catch (error) {
    console.error('[SketchPad] 上传错误:', error)
    res.status(500).json({ error: error.message || '上传失败' })
  }
})

// 获取最新画稿（供 AI 读取）
app.get('/api/sketchpad/latest', authMiddleware, (req, res) => {
  try {
    const uploadDir = path.join(PROJECTS_DIR, req.userId, 'uploads')
    const latestPath = path.join(uploadDir, 'latest.json')
    
    if (!fs.existsSync(latestPath)) {
      return res.status(404).json({ error: '暂无画稿' })
    }
    
    const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'))
    const imagePath = path.join(uploadDir, latest.imageFile)
    const jsonPath = path.join(uploadDir, latest.annotationFile)
    
    const imageData = fs.readFileSync(imagePath)
    const annotations = fs.existsSync(jsonPath) 
      ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      : null
    
    res.json({
      image: `data:image/png;base64,${imageData.toString('base64')}`,
      annotations,
      receivedAt: latest.receivedAt,
    })
  } catch (error) {
    console.error('[SketchPad] 获取最新画稿错误:', error)
    res.status(500).json({ error: error.message || '获取失败' })
  }
})

// ============ 健康检查 ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 启动服务器
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ SketchPad Web 后端运行在 http://localhost:${PORT}`)
  console.log('')
  console.log('📝 API 端点:')
  console.log('   POST /api/auth/login     - 登录')
  console.log('   POST /api/auth/register   - 注册')
  console.log('   GET  /api/auth/verify     - 验证 Token')
  console.log('')
  console.log('   GET  /api/projects        - 获取项目列表')
  console.log('   GET  /api/projects/:id    - 获取单个项目')
  console.log('   POST /api/projects/:id    - 保存项目')
  console.log('   DELETE /api/projects/:id  - 删除项目')
  console.log('')
  console.log('   POST /api/sketchpad/upload - 上传画稿')
  console.log('   GET  /api/sketchpad/latest - 获取最新画稿')
})