'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { API_BASE } from '@/lib/api'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ username: '', password: '' })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || '登录失败')
      }

      const data = await response.json()

      // 保存 token 和用户 ID
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_id', data.user_id.toString())

      // 重定向到首页
      router.push('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - BrainEcho</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-almond to-white px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-warm-wood mb-2">BrainEcho</h1>
              <p className="text-warm-wood-light">登录您的账户</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-wood mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="输入用户名"
                  className="w-full px-4 py-2 border border-almond-light rounded-lg focus:outline-none focus:border-sage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-wood mb-2">
                  密码
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="输入密码"
                  className="w-full px-4 py-2 border border-almond-light rounded-lg focus:outline-none focus:border-sage"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-sage text-white font-medium rounded-lg hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-almond-light text-center">
              <p className="text-sm text-warm-wood-light mb-2">
                还没有账户？
              </p>
              <Link
                href="/register"
                className="inline-block text-sage font-medium hover:text-sage/80 transition-colors"
              >
                立即注册
              </Link>
            </div>
          </div>

          {/* Demo Login */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 演示账户</p>
            <p className="text-xs text-blue-700 mb-2">用户名: <code className="bg-white px-1 rounded">demo</code></p>
            <p className="text-xs text-blue-700">密码: <code className="bg-white px-1 rounded">demo123</code></p>
          </div>
        </motion.div>
      </div>
    </>
  )
}
