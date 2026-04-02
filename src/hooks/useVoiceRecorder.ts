// Web 版语音录制 Hook（使用 MediaRecorder API）
import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'recording' | 'processing'

export const useVoiceRecorder = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  // 获取支持的 MIME 类型
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    throw new Error('浏览器不支持录音')
  }, [])
  
  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      })
      streamRef.current = stream
      
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.start(100) // 每 100ms 收集一次数据
      setVoiceState('recording')
      
      console.log('[VoiceRecorder] 开始录音，格式:', mimeType)
    } catch (error) {
      console.error('[VoiceRecorder] 启动录音失败:', error)
      alert('无法访问麦克风，请检查浏览器权限')
      setVoiceState('idle')
    }
  }, [getSupportedMimeType])
  
  // 停止录音并返回音频 Blob
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder) {
        resolve(new Blob([], { type: 'audio/webm' }))
        return
      }
      
      mediaRecorder.onstop = () => {
        const mimeType = getSupportedMimeType()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        
        // 停止音频流
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        mediaRecorderRef.current = null
        setVoiceState('idle')
        
        console.log('[VoiceRecorder] 录音完成，大小:', blob.size, 'bytes')
        resolve(blob)
      }
      
      mediaRecorder.stop()
      setVoiceState('processing')
    })
  }, [getSupportedMimeType])
  
  // 取消录音
  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    mediaRecorderRef.current = null
    chunksRef.current = []
    setVoiceState('idle')
  }, [])
  
  return {
    voiceState,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}