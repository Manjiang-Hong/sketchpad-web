// SketchPad Web 版类型定义

export interface Point {
  x: number
  y: number
  pressure?: number
}

export interface Stroke {
  id: string
  points: Point[]
  color: string
  size: number
  timestamp: number
}

export interface Cluster {
  id: string
  transcription: string
  timestamp: number
  strokeIds: string[]
  position?: { x: number; y: number }
}

// 文字备注（Web版）
export interface TextNote {
  id: string
  text: string
  x: number // 区域左上角（背景图坐标系）
  y: number
  width: number // 框选区域大小
  height: number
  timestamp: number
}

export type ToolType = 'pen' | 'eraser' | 'note'

export interface Viewport {
  scale: number
  offsetX: number
  offsetY: number
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  strokes: Stroke[]
  clusters: Cluster[]
  notes: TextNote[] // 文字备注
  bgImage?: string // base64 或 URL
  viewport: Viewport
}

export interface CanvasData {
  strokes: Stroke[]
  clusters: Cluster[]
  bgImage?: string
  viewport: Viewport
}

// 预设值
export const COLOR_PRESETS = [
  '#000000', // 黑色
  '#ff0000', // 红色
  '#00ff00', // 绿色
  '#0000ff', // 蓝色
  '#ffff00', // 黄色
  '#ff00ff', // 品红
  '#00ffff', // 青色
  '#ff9800', // 橙色
] as const

export const BRUSH_SIZES = [2, 4, 8, 16, 32] as const

export const TOLERANCE_PRESETS = [10, 32, 64, 128] as const