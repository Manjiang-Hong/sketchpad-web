// 登录/注册页面
import React, { useState } from 'react'
import { login, register } from '../services/api'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (user: { id: string; username: string }) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    
    if (!password) {
      setError('请输入密码')
      return
    }
    
    if (mode === 'register' && password.length < 6) {
      setError('密码长度至少 6 个字符')
      return
    }
    
    setLoading(true)
    
    try {
      const result = mode === 'login'
        ? await login(username, password)
        : await register(username, password)
      
      if (result.success) {
        onLogin(result.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>🎨 SketchPad</h1>
          <p>UI/UX 设计标注平台</p>
        </div>
        
        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError('') }}
          >
            登录
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError('') }}
          >
            注册
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入密码"
            />
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="login-footer">
          <p>测试账号：test1 / test2 / test3</p>
          <p>密码：test123</p>
        </div>
      </div>
    </div>
  )
}