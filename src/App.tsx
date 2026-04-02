// SketchPad Web 版入口（带认证）
import { useState, useEffect } from 'react'
import { SketchCanvas } from './components/SketchCanvas'
import { LoginPage } from './components/LoginPage'
import { verifyToken, logout } from './services/api'
import './App.css'

interface User {
  id: string
  username: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 检查本地存储的 Token 是否有效
    const checkAuth = async () => {
      const result = await verifyToken()
      if (result.valid && result.user) {
        setUser(result.user)
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }
  
  if (!user) {
    return <LoginPage onLogin={setUser} />
  }
  
  return (
    <div className="app">
      <div className="user-bar">
        <span>👤 {user.username}</span>
        <button onClick={() => logout()}>退出</button>
      </div>
      <SketchCanvas userId={user.id} username={user.username} />
    </div>
  )
}

export default App