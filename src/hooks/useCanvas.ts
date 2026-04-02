// Canvas 绘图 Hook
import { useRef, useCallback, useEffect } from 'react'
import type { Stroke, Point, Viewport, TextNote } from '../types'

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null) // 缓存背景图
  
  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctxRef.current = ctx
    
    // 设置初始大小
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    
    resize()
    window.addEventListener('resize', resize)
    
    return () => window.removeEventListener('resize', resize)
  }, [])
  
  // 清空画布
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
  }, [])
  
  // 绘制背景图（使用缓存，返回 Promise）
  const drawBackground = useCallback((imageData: string, viewport: Viewport): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) {
        resolve()
        return
      }
      
      // 检查是否需要加载新图片
      if (!bgImageRef.current || bgImageRef.current.src !== imageData) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          bgImageRef.current = img
          ctx.save()
          ctx.translate(viewport.offsetX, viewport.offsetY)
          ctx.scale(viewport.scale, viewport.scale)
          ctx.drawImage(img, 0, 0)
          ctx.restore()
          resolve()
        }
        img.onerror = () => {
          console.error('背景图加载失败')
          resolve()
        }
        img.src = imageData
      } else {
        // 使用缓存的图片直接绘制
        const img = bgImageRef.current
        ctx.save()
        ctx.translate(viewport.offsetX, viewport.offsetY)
        ctx.scale(viewport.scale, viewport.scale)
        ctx.drawImage(img, 0, 0)
        ctx.restore()
        resolve()
      }
    })
  }, [])
  
  // 绘制单条笔迹
  const drawStroke = useCallback((stroke: Stroke, _viewport: Viewport) => {
    const ctx = ctxRef.current
    if (!ctx || stroke.points.length < 2) return
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = _viewport
    
    // iframe 模式：容器已应用变换，Canvas 绘制不需要再变换
    // 非iframe 模式：Canvas 需要应用变换
    
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1]
      const p1 = stroke.points[i]
      
      // 使用贝塞尔曲线平滑
      const midX = (p0.x + p1.x) / 2
      const midY = (p0.y + p1.y) / 2
      
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    }
    
    ctx.stroke()
  }, [])
  
  // 重绘所有笔迹
  const redrawCanvas = useCallback(async (
    strokes: Stroke[],
    bgImage: string | undefined,
    viewport: Viewport
  ) => {
    clearCanvas()
    
    // iframe 模式不绘制背景（bgImage 以 'iframe:' 开头）
    if (bgImage && !bgImage.startsWith('iframe:')) {
      await drawBackground(bgImage, viewport)
    }
    
    // 绘制所有笔迹
    strokes.forEach(stroke => drawStroke(stroke, viewport))
  }, [clearCanvas, drawBackground, drawStroke])
  
  // 只重绘笔迹（用于橡皮擦模式，背景已缓存）
  const redrawStrokesOnly = useCallback((
    strokes: Stroke[],
    bgImage: string | undefined,
    viewport: Viewport
  ) => {
    clearCanvas()
    
    // iframe 模式不绘制背景
    if (bgImage && !bgImage.startsWith('iframe:') && bgImageRef.current) {
      const ctx = ctxRef.current
      if (ctx) {
        ctx.save()
        ctx.translate(viewport.offsetX, viewport.offsetY)
        ctx.scale(viewport.scale, viewport.scale)
        ctx.drawImage(bgImageRef.current, 0, 0)
        ctx.restore()
      }
    }
    
    // 绘制笔迹
    strokes.forEach(stroke => drawStroke(stroke, viewport))
  }, [clearCanvas, drawStroke])
  
  // 实时绘制（用于鼠标拖拽时）
  const drawRealtime = useCallback((
    points: Point[],
    color: string,
    size: number,
    _viewport: Viewport
  ) => {
    const ctx = ctxRef.current
    if (!ctx || points.length < 2) return
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = _viewport
    
    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1]
      const p1 = points[i]
      const midX = (p0.x + p1.x) / 2
      const midY = (p0.y + p1.y) / 2
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    }
    
    ctx.stroke()
  }, [])
  
  // 绘制备注文本和框（带删除按钮）
  const drawNotes = useCallback((notes: TextNote[], _viewport: Viewport) => {
    const ctx = ctxRef.current
    if (!ctx) return
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = _viewport
    
    notes.forEach(note => {
      // 绘制框
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.strokeRect(note.x, note.y, note.width, note.height)
      
      // 绘制半透明背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(note.x, note.y, note.width, 24)
      
      // 绘制文本
      ctx.fillStyle = '#333'
      ctx.font = '14px sans-serif'
      const maxTextWidth = note.width - 28 // 留出删除按钮空间
      let displayText = note.text
      if (ctx.measureText(displayText).width > maxTextWidth) {
        // 截断文本
        while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1)
        }
        displayText += '...'
      }
      ctx.fillText(displayText, note.x + 4, note.y + 16)
      
      // 绘制删除按钮（右上角）
      const btnSize = 18
      const btnX = note.x + note.width - btnSize - 2
      const btnY = note.y + 3
      
      ctx.fillStyle = '#ff4444'
      ctx.beginPath()
      ctx.arc(btnX + btnSize/2, btnY + btnSize/2, btnSize/2, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制 X 符号
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      const offset = btnSize * 0.3
      ctx.moveTo(btnX + offset, btnY + offset)
      ctx.lineTo(btnX + btnSize - offset, btnY + btnSize - offset)
      ctx.moveTo(btnX + btnSize - offset, btnY + offset)
      ctx.lineTo(btnX + offset, btnY + btnSize - offset)
      ctx.stroke()
    })
  }, [])
  
  // 检测并切断笔迹（部分擦除）
  const eraseStrokesAtPoint = useCallback((
    x: number,
    y: number,
    size: number,
    strokes: Stroke[]
  ): Stroke[] => {
    const threshold = size / 2
    const result: Stroke[] = []
    
    for (const stroke of strokes) {
      if (stroke.points.length < 2) {
        result.push(stroke)
        continue
      }
      
      // 将笔迹按橡皮擦区域切断
      const segments: Point[][] = []
      let currentSegment: Point[] = []
      
      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i]
        const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
        
        if (distance > threshold) {
          // 点在橡皮擦范围外，保留
          currentSegment.push(point)
        } else {
          // 点在橡皮擦范围内，切断当前段
          if (currentSegment.length >= 2) {
            segments.push(currentSegment)
          }
          currentSegment = []
        }
      }
      
      // 处理最后一段
      if (currentSegment.length >= 2) {
        segments.push(currentSegment)
      }
      
      // 将切断后的片段转为新笔迹
      segments.forEach((segment, index) => {
        result.push({
          ...stroke,
          id: `${stroke.id}-seg${index}`,
          points: segment,
        })
      })
    }
    
    return result
  }, [])
  
  return {
    canvasRef,
    clearCanvas,
    drawBackground,
  drawStroke,
    redrawCanvas,
    redrawStrokesOnly,
    drawRealtime,
    drawNotes,
    eraseStrokesAtPoint,
  }
}