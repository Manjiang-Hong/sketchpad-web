// IndexedDB 存储服务
import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Project } from '../types'

interface SketchPadDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { 'by-updated': number }
  }
}

let dbPromise: Promise<IDBPDatabase<SketchPadDB>> | null = null

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<SketchPadDB>('SketchPadDB', 1, {
      upgrade(db) {
        const store = db.createObjectStore('projects', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbPromise
}

// 保存项目
export const saveProject = async (project: Project): Promise<void> => {
  const db = await getDB()
  await db.put('projects', {
    ...project,
    updatedAt: Date.now(),
  })
}

// 加载项目
export const loadProject = async (id: string): Promise<Project | undefined> => {
  const db = await getDB()
  return await db.get('projects', id)
}

// 获取所有项目（按更新时间排序）
export const getAllProjects = async (): Promise<Project[]> => {
  const db = await getDB()
  const projects = await db.getAllFromIndex('projects', 'by-updated')
  return projects.reverse() // 最新在前
}

// 删除项目
export const deleteProject = async (id: string): Promise<void> => {
  const db = await getDB()
  await db.delete('projects', id)
}

// 创建新项目
export const createProject = (name?: string): Project => {
  const id = `project-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    id,
    name: name || `项目 ${new Date().toLocaleString('zh-CN')}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    strokes: [],
    clusters: [],
    notes: [],
    viewport: {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    },
  }
}

// 导出项目为 JSON
export const exportProjectAsJSON = (project: Project): string => {
  return JSON.stringify(project, null, 2)
}

// 导入项目
export const importProjectFromJSON = async (jsonStr: string): Promise<Project> => {
  const data = JSON.parse(jsonStr)
  const project: Project = {
    ...data,
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await saveProject(project)
  return project
}