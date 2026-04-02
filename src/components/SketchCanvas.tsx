// SketchPad Web 版主组件
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { 
  PenTool, 
  Eraser, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Save,
  Send,
  MessageSquare,
} from 'lucide-react'
import type { 
  Stroke, 
  Point, 
  ToolType, 
  Project,
  Viewport,
  TextNote,
} from '../types'
import { 
  COLOR_PRESETS, 
  BRUSH_SIZES,
} from '../types'
import { useCanvas } from '../hooks/useCanvas'
import { 
  saveProject, 
  loadProject, 
  createProject, 
  getAllProjects 
} from '../services/storage'
import { uploadSketch, saveProjectToCloud } from '../services/api'
import './SketchCanvas.css'

// 简单的 UUID 生成函数
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

interface SketchCanvasProps {
  userId: string
  username: string
}

export const SketchCanvas: React.FC<SketchCanvasProps> = ({ userId, username }) => {
  // 状态
  const [project, setProject] = useState<Project>(() => createProject())
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [showSendDialog, setShowSendDialog] = useState(false)
  // 备注工具状态
  const [isSelectingNote, setIsSelectingNote] = useState(false)
  const [noteStart, setNoteStart] = useState<Point | null>(null)
  const [noteEnd, setNoteEnd] = useState<Point | null>(null)
  // 备注框选使用 ref 避免状态更新延迟
  const isSelectingNoteRef = useRef(false)
  const noteStartRef = useRef<Point | null>(null)
  const noteEndRef = useRef<Point | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [pendingNoteArea, setPendingNoteArea] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  // 编辑备注状态
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')
  const lastClickTimeRef = useRef<number>(0)
  const lastClickPosRef = useRef<{x: number, y: number} | null>(null)
  
  // Hooks
  const { canvasRef, redrawCanvas, redrawStrokesOnly, drawRealtime, drawNotes, eraseStrokesAtPoint } = useCanvas()
  
  // 笔迹索引（用于橡皮擦检测）
  const strokeIndexRef = useRef<Map<string, Stroke>>(new Map())
  // 橡皮擦模式的临时笔迹状态
  const eraserStrokesRef = useRef<Stroke[]>([])
  
  // 视口状态
  const viewportRef = useRef<Viewport>(project.viewport)
  const isPanningRef = useRef(false)
  const lastPanPointRef = useRef<Point | null>(null)
  
  // 初始化
  useEffect(() => {
    redrawCanvas(project.strokes, project.bgImage, project.viewport)
    strokeIndexRef.current = new Map(project.strokes.map(s => [s.id, s]))
    
    // 检查 URL 参数是否需要加载背景图
    const params = new URLSearchParams(window.location.search)
    const bgParam = params.get('bg')
    if (bgParam) {
      // 预设背景图映射
      const bgMap: Record<string, string> = {
        'travel-ui': `iframe:/travel-ui-prototype.html?v=${Date.now()}`, // 旅游APP原型（iframe模式）
        'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024',
        'city': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1024',
        'nature': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1024',
      }
      const bgUrl = bgMap[bgParam]
      if (bgUrl && !project.bgImage) {
        setProject(prev => ({
          ...prev,
          bgImage: bgUrl,
        }))
      }
    }
  }, [])
  
  // 监听项目变化，自动重绘
  useEffect(() => {
    redrawCanvas(project.strokes, project.bgImage, project.viewport)
    drawNotes(project.notes, project.viewport)
  }, [project, redrawCanvas, drawNotes])
  
  // 获取指针位置（相对于背景图坐标系）
  const getPointerPos = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    // 鼠标在屏幕上的位置（相对于 canvas）
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    
    // 逆变换：从屏幕坐标 -> 背景图坐标
    const x = (screenX - project.viewport.offsetX) / project.viewport.scale
    const y = (screenY - project.viewport.offsetY) / project.viewport.scale
    
    return { x, y, pressure: e.pressure }
  }, [canvasRef, project.viewport])
  
  // 开始绘制
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) { // 中键平移
      isPanningRef.current = true
      lastPanPointRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    
    if (e.button !== 0) return // 只处理左键
    
    const pos = getPointerPos(e)
    
    // 检测是否点击了备注的删除按钮或双击备注
    for (const note of project.notes) {
      const btnSize = 18
      const btnX = note.x + note.width - btnSize - 2
      const btnY = note.y + 3
      
      // 检测是否点击删除按钮
      const dx = pos.x - (btnX + btnSize/2)
      const dy = pos.y - (btnY + btnSize/2)
      if (Math.sqrt(dx*dx + dy*dy) <= btnSize/2) {
        // 点击了删除按钮
        setProject(prev => {
          const updated = {
            ...prev,
            notes: prev.notes.filter(n => n.id !== note.id),
          }
          saveProject(updated)
          return updated
        })
        return
      }
      
      // 检测是否双击备注区域
      if (pos.x >= note.x && pos.x <= note.x + note.width &&
          pos.y >= note.y && pos.y <= note.y + note.height) {
        const now = Date.now()
        const lastClickPos = lastClickPosRef.current
        
        // 双击判断：300ms内，且位置相近
        if (now - lastClickTimeRef.current < 300 &&
            lastClickPos &&
            Math.abs(lastClickPos.x - pos.x) < 10 &&
            Math.abs(lastClickPos.y - pos.y) < 10) {
          // 双击，进入编辑模式
          setEditingNoteId(note.id)
          setEditNoteText(note.text)
          return
        }
        
        lastClickTimeRef.current = now
        lastClickPosRef.current = { x: pos.x, y: pos.y }
      }
    }
    
    if (tool === 'pen') {
      setIsDrawing(true)
      setCurrentPoints([pos])
    } else if (tool === 'eraser') {
      setIsDrawing(true)
      // 初始化橡皮擦模式的笔迹副本
      eraserStrokesRef.current = [...project.strokes]
      // 立即擦除第一个点
      eraserStrokesRef.current = eraseStrokesAtPoint(pos.x, pos.y, brushSize, eraserStrokesRef.current)
      redrawStrokesOnly(eraserStrokesRef.current, project.bgImage, viewportRef.current)
    } else if (tool === 'note') {
      // 开始框选备注区域
      setIsDrawing(true) // 需要设置 isDrawing，否则 handlePointerMove 会提前 return
      setIsSelectingNote(true)
      isSelectingNoteRef.current = true
      setNoteStart(pos)
      noteStartRef.current = pos
      setNoteEnd(pos)
      noteEndRef.current = pos
    }
  }, [tool, brushSize, getPointerPos, eraseStrokesAtPoint, redrawStrokesOnly, project.strokes, project.bgImage, project.notes])
  
  // 移动绘制
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current && lastPanPointRef.current) {
      const dx = e.clientX - lastPanPointRef.current.x
      const dy = e.clientY - lastPanPointRef.current.y
      viewportRef.current = {
        ...viewportRef.current,
        offsetX: viewportRef.current.offsetX + dx,
        offsetY: viewportRef.current.offsetY + dy,
      }
      lastPanPointRef.current = { x: e.clientX, y: e.clientY }
      redrawCanvas(project.strokes, project.bgImage, viewportRef.current)
      return
    }
    
    if (!isDrawing) return
    
    const pos = getPointerPos(e)
    
    if (tool === 'pen') {
      const newPoints = [...currentPoints, pos]
      setCurrentPoints(newPoints)
      drawRealtime(newPoints, color, brushSize, viewportRef.current)
    } else if (tool === 'eraser') {
      // 拖动时持续擦除（使用 ref 累积，快速重绘）
      eraserStrokesRef.current = eraseStrokesAtPoint(pos.x, pos.y, brushSize, eraserStrokesRef.current)
      redrawStrokesOnly(eraserStrokesRef.current, project.bgImage, viewportRef.current)
    } else if (tool === 'note' && isSelectingNoteRef.current) {
      // 更新框选区域（保存背景图坐标）
      noteEndRef.current = pos
      setNoteEnd(pos)
      // 手动触发重绘框选区域
      const canvas = canvasRef.current
      if (canvas && noteStartRef.current) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          redrawCanvas(project.strokes, project.bgImage, viewportRef.current)
          drawNotes(project.notes, viewportRef.current)
          // 绘制框选矩形 - 使用背景图坐标，不需要变换（容器已变换）
          const x = Math.min(noteStartRef.current.x, pos.x)
          const y = Math.min(noteStartRef.current.y, pos.y)
          const width = Math.abs(pos.x - noteStartRef.current.x)
          const height = Math.abs(pos.y - noteStartRef.current.y)
          ctx.save()
          ctx.strokeStyle = '#ff6b6b'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.strokeRect(x, y, width, height)
          ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'
          ctx.fillRect(x, y, width, height)
          ctx.restore()
  }
      }
    }
  }, [isDrawing, tool, currentPoints, color, brushSize, getPointerPos, drawRealtime, eraseStrokesAtPoint, redrawStrokesOnly, project.bgImage, isSelectingNote])
  
  // 结束绘制
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false
      lastPanPointRef.current = null
      setProject(prev => ({
        ...prev,
        viewport: { ...viewportRef.current },
      }))
      return
    }
    
    // 备注工具结束框选
    if (tool === 'note' && isSelectingNoteRef.current && noteStartRef.current && noteEndRef.current) {
      setIsSelectingNote(false)
      isSelectingNoteRef.current = false
      const x = Math.min(noteStartRef.current.x, noteEndRef.current.x)
      const y = Math.min(noteStartRef.current.y, noteEndRef.current.y)
      const width = Math.abs(noteEndRef.current.x - noteStartRef.current.x)
      const height = Math.abs(noteEndRef.current.y - noteStartRef.current.y)
      
      if (width > 10 && height > 10) {
        // 框选区域足够大，弹出文本输入框
        setPendingNoteArea({ x, y, width, height })
        setShowNoteDialog(true)
        setNoteText('')
      }
      setNoteStart(null)
      noteStartRef.current = null
      setNoteEnd(null)
      noteEndRef.current = null
      // 重绘画布清除框选框
      redrawCanvas(project.strokes, project.bgImage, viewportRef.current)
      return
    }
    
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (tool === 'pen' && currentPoints.length >= 2) {
      const newStroke: Stroke = {
        id: generateId(),
        points: currentPoints,
        color,
        size: brushSize,
        timestamp: Date.now(),
      }
      
      setProject(prev => {
        const updated = {
          ...prev,
          strokes: [...prev.strokes, newStroke],
        }
        saveProject(updated)
        return updated
      })
      
      strokeIndexRef.current.set(newStroke.id, newStroke)
    } else if (tool === 'eraser') {
      // 橡皮擦松开时，保存最终状态
      setProject(prev => {
        const updated = {
          ...prev,
          strokes: eraserStrokesRef.current,
        }
        saveProject(updated)
        return updated
      })
    }
    
    setCurrentPoints([])
  }, [isDrawing, tool, currentPoints, color, brushSize])
  
  // 保存文字备注
  const handleSaveNote = useCallback(() => {
    if (!pendingNoteArea || !noteText.trim()) return
    
    const newNote: TextNote = {
      id: generateId(),
      text: noteText.trim(),
      x: pendingNoteArea.x,
      y: pendingNoteArea.y,
      width: pendingNoteArea.width,
      height: pendingNoteArea.height,
      timestamp: Date.now(),
    }
    
    setProject(prev => {
      const updated = {
        ...prev,
        notes: [...prev.notes, newNote],
      }
      saveProject(updated)
      return updated
    })
    
    setShowNoteDialog(false)
    setNoteText('')
    setPendingNoteArea(null)
  }, [pendingNoteArea, noteText])
  
  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(10, viewportRef.current.scale * zoomFactor))
    
    // 以鼠标为中心缩放
    const scaleRatio = newScale / viewportRef.current.scale
    const newOffsetX = mouseX - (mouseX - viewportRef.current.offsetX) * scaleRatio
    const newOffsetY = mouseY - (mouseY - viewportRef.current.offsetY) * scaleRatio
    
    viewportRef.current = {
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    }
    
    redrawCanvas(project.strokes, project.bgImage, viewportRef.current)
  }, [canvasRef, redrawCanvas, project])
  
  // 重置视口
  const handleResetViewport = useCallback(() => {
    viewportRef.current = { scale: 1, offsetX: 0, offsetY: 0 }
    setProject(prev => ({
      ...prev,
      viewport: viewportRef.current,
    }))
  }, [])
  
  // 发送到 AI（上传截图 + 标注到服务器）
  const handleSendToAI = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      // 生成截图 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('生成截图失败'))
        }, 'image/png')
      })
      
      // 导出标注数据
      const annotations = {
        strokes: project.strokes.map(s => ({
          id: s.id,
          points: s.points,
          color: s.color,
          size: s.size,
        })),
        notes: project.notes.map(n => ({
          id: n.id,
          text: n.text,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
        })),
        clusters: project.clusters.map(c => ({
          id: c.id,
          transcription: c.transcription,
          strokeIds: c.strokeIds,
          position: c.position,
        })),
        viewport: project.viewport,
        exportedAt: new Date().toISOString(),
      }
      
      // 上传到服务器
      const result = await uploadSketch(blob, annotations)
      
      setShowSendDialog(false)
      alert(result.message)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请检查后端服务是否启动')
    }
  }, [canvasRef, project])
  
  return (
    <div className="sketch-container">
      {/* 工具栏 */}
      <div className="toolbar">
        <button 
          className={tool === 'pen' ? 'active' : ''} 
          onClick={() => setTool('pen')}
          title="画笔"
        >
          <PenTool size={20} />
        </button>
        <button 
          className={tool === 'eraser' ? 'active' : ''} 
          onClick={() => setTool('eraser')}
          title="橡皮擦"
        >
          <Eraser size={20} />
        </button>
        <button 
          className={tool === 'note' ? 'active' : ''} 
          onClick={() => setTool('note')}
          title="文字备注"
        >
          <MessageSquare size={20} />
        </button>
        <div className="separator" />
        <button onClick={handleResetViewport} title="重置视图">
          <RotateCcw size={20} />
        </button>
        <button onClick={() => {
          const newScale = Math.max(0.1, project.viewport.scale - 0.1)
          setProject(prev => ({
            ...prev,
            viewport: { ...prev.viewport, scale: newScale }
          }))
        }} title="缩小">
          <ZoomOut size={20} />
        </button>
        <span className="zoom-level">
          {Math.round(project.viewport.scale * 100)}%
        </span>
        <button onClick={() => {
          const newScale = Math.min(5, project.viewport.scale + 0.1)
          setProject(prev => ({
            ...prev,
            viewport: { ...prev.viewport, scale: newScale }
          }))
        }} title="放大">
          <ZoomIn size={20} />
        </button>
        <div className="separator" />
        <button onClick={() => setShowSendDialog(true)} title="发送到 AI">
          <Send size={20} />
        </button>
        <div className="separator" />
        <button onClick={() => saveProject(project)} title="保存">
          <Save size={20} />
        </button>
      </div>
      
      {/* 颜色选择 */}
      <div className="color-palette">
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            className={`color-btn ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      
      {/* 笔刷大小 */}
      <div className="brush-sizes">
        {BRUSH_SIZES.map(s => (
          <button
            key={s}
            className={`size-btn ${brushSize === s ? 'active' : ''}`}
            onClick={() => setBrushSize(s)}
          >
            {s}
          </button>
        ))}
      </div>
      
      {/* Canvas 容器（iframe 背景 + Canvas 笔迹） */}
      <div className="canvas-wrapper">
        <div 
          className="canvas-content"
          style={{
            transform: `translate(${project.viewport.offsetX}px, ${project.viewport.offsetY}px) scale(${project.viewport.scale})`,
          }}
        >
          {/* iframe 背景（用于显示 HTML 原型） */}
          {project.bgImage?.startsWith('iframe:') && (
            <iframe
              src={`${project.bgImage.replace('iframe:', '')}?t=${Date.now()}`}
              className="bg-iframe"
              title="背景原型"
            />
          )}
          
          {/* Canvas（笔迹层） */}
          <canvas
            ref={canvasRef}
            className="sketch-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{
              cursor: tool === 'pen' ? 'crosshair' : tool === 'eraser' ? 'cell' : tool === 'note' ? 'crosshair' : 'default',
            }}
          />
        </div>
      </div>
      
      {/* 发送到 AI 弹窗 */}
      {showSendDialog && (
        <div className="prompt-dialog-overlay">
          <div className="prompt-dialog">
            <h3>📤 发送到 AI</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '16px 0' }}>
              将导出当前画稿的截图和标注数据，供 AI 分析使用。
            </p>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <div>📷 截图: {project.strokes.length} 条笔迹</div>
              <div>📝 文字备注: {project.notes.length} 条</div>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowSendDialog(false)}>取消</button>
              <button onClick={handleSendToAI}>
                导出
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 备注输入弹窗 */}
      {showNoteDialog && (
        <div className="prompt-dialog-overlay">
          <div className="prompt-dialog">
            <h3>📝 添加备注</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="输入备注内容..."
              rows={3}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={() => {
                setShowNoteDialog(false)
                setPendingNoteArea(null)
              }}>取消</button>
              <button 
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑备注弹窗 */}
      {editingNoteId && (
        <div className="prompt-dialog-overlay">
          <div className="prompt-dialog">
            <h3>✏️ 编辑备注</h3>
            <textarea
              value={editNoteText}
              onChange={e => setEditNoteText(e.target.value)}
              placeholder="输入备注内容..."
              rows={3}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={() => {
                setEditingNoteId(null)
                setEditNoteText('')
              }}>取消</button>
              <button 
                onClick={() => {
                  if (!editNoteText.trim()) return
                  setProject(prev => {
                    const updated = {
                      ...prev,
                      notes: prev.notes.map(n => 
                        n.id === editingNoteId 
                          ? { ...n, text: editNoteText.trim() }
                          : n
                      ),
                    }
                    saveProject(updated)
                    return updated
                  })
                  setEditingNoteId(null)
                  setEditNoteText('')
                }}
                disabled={!editNoteText.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 状态栏 */}
      <div className="status-bar">
        <span>{project.name}</span>
        <span>笔迹: {project.strokes.length}</span>
        <span>备注: {project.notes.length}</span>
      </div>
    </div>
  )
}