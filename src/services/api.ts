// API 服务（调用后端）
import type { Cluster, Stroke, Project } from '../types'

// 动态 API 地址
// 开发环境：通过 Vite 代理到 localhost:3001
// 生产环境：通过环境变量 VITE_API_HOST 指向后端域名
const API_BASE = import.meta.env.VITE_API_HOST 
  ? `https://${import.meta.env.VITE_API_HOST}/api`
  : '/api'

// 获取存储的 Token
const getToken = () => localStorage.getItem('sketchpad_token')
const setToken = (token: string) => localStorage.setItem('sketchpad_token', token)
const clearToken = () => localStorage.removeItem('sketchpad_token')

// 带认证的 fetch
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken()
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  
  const response = await fetch(url, { ...options, headers })
  
  // Token 过期或无效
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('登录已过期')
  }
  
  return response
}

// ============ 认证 API ============

export interface AuthResult {
  success: boolean
  token: string
  user: { id: string; username: string }
}

export const login = async (username: string, password: string): Promise<AuthResult> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '登录失败')
  }
  
  const data = await response.json()
  setToken(data.token)
  return data
}

export const register = async (username: string, password: string): Promise<AuthResult> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '注册失败')
  }
  
  const data = await response.json()
  setToken(data.token)
  return data
}

export const verifyToken = async (): Promise<{ valid: boolean; user?: { id: string; username: string } }> => {
  const token = getToken()
  if (!token) return { valid: false }
  
  try {
    const response = await authFetch(`${API_BASE}/auth/verify`)
    if (!response.ok) return { valid: false }
    
    const data = await response.json()
    return data
  } catch {
    return { valid: false }
  }
}

export const logout = () => {
  clearToken()
  window.location.href = '/login'
}

// ============ 项目 API ============

export const getProjects = async (): Promise<{ id: string; name: string; updatedAt: number; strokeCount: number; noteCount: number }[]> => {
  const response = await authFetch(`${API_BASE}/projects`)
  
  if (!response.ok) {
    throw new Error('获取项目列表失败')
  }
  
  const data = await response.json()
  return data.projects
}

export const getProject = async (id: string): Promise<Project> => {
  const response = await authFetch(`${API_BASE}/projects/${id}`)
  
  if (!response.ok) {
    throw new Error('获取项目失败')
  }
  
  return await response.json()
}

export const saveProjectToCloud = async (project: Project): Promise<void> => {
  const response = await authFetch(`${API_BASE}/projects/${project.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  })
  
  if (!response.ok) {
    throw new Error('保存项目失败')
  }
}

export const deleteProjectFromCloud = async (id: string): Promise<void> => {
  const response = await authFetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('删除项目失败')
  }
}

// ============ 画稿上传 ============

export const uploadSketch = async (
  imageBlob: Blob,
  annotations: object
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData()
  formData.append('image', imageBlob, 'sketch.png')
  formData.append('annotations', JSON.stringify(annotations))
  
  const response = await authFetch(`${API_BASE}/sketchpad/upload`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('上传失败')
  }
  
  const data = await response.json()
  return data
}

export const getLatestSketch = async (): Promise<{
  image: string
  annotations: object | null
  receivedAt: string
}> => {
  const response = await authFetch(`${API_BASE}/sketchpad/latest`)
  
  if (!response.ok) {
    throw new Error('获取画稿失败')
  }
  
  return await response.json()
}

// ============ 辅助函数 ============

export const createCluster = (
  transcription: string,
  strokeIds: string[],
  position?: { x: number; y: number }
): Cluster => {
  return {
    id: `cluster-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    transcription,
    timestamp: Date.now(),
    strokeIds,
    position,
  }
}

export const exportForAI = (
  strokes: Stroke[],
  clusters: Cluster[],
  viewport: { scale: number; offsetX: number; offsetY: number }
) => {
  return {
    strokes: strokes.map(s => ({
      id: s.id,
      points: s.points,
      color: s.color,
      size: s.size,
    })),
    clusters: clusters.map(c => ({
      id: c.id,
      transcription: c.transcription,
      strokeIds: c.strokeIds,
    })),
    viewport,
    exportedAt: new Date().toISOString(),
  }
}