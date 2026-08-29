'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CONSENT_VERSION, storeCurrentConsent } from '@/lib/consent'
import { API_BASE } from '@/lib/api'

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    researchConsent: false,
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证表单
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 8) {
      setError('密码长度至少为8个字符')
      return
    }
    if (!formData.researchConsent) {
      setError('创建账户前需要阅读并同意研究数据说明')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          research_consent: formData.researchConsent,
          consent_version: CONSENT_VERSION,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || '注册失败')
      }

      const data = await response.json()

      // 保存 token 和用户 ID
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_id', data.user_id.toString())
      storeCurrentConsent()

      // 重定向到首页
      router.push('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Register - BrainEcho</title>
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
              <p className="text-warm-wood-light">创建您的账户</p>
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
                  placeholder="选择用户名 (3-50字符)"
                  className="w-full px-4 py-2 border border-almond-light rounded-lg focus:outline-none focus:border-sage"
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>

              <label className="flex items-start gap-3 border border-almond-light bg-white p-4 text-sm leading-5 text-warm-wood">
                <input
                  type="checkbox"
                  name="researchConsent"
                  checked={formData.researchConsent}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-sage"
                />
                <span>
                  我已阅读并同意 BrainEcho 处理问卷、健康史、认知和功能信息，
                  用于本课程研究原型的模型计算与评估记录。该结果不是临床诊断。
                  <Link href="/privacy" className="ml-1 font-semibold text-sage-dark underline">
                    查看完整数据说明
                  </Link>
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-warm-wood mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="输入邮箱地址"
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
                  placeholder="至少8个字符"
                  className="w-full px-4 py-2 border border-almond-light rounded-lg focus:outline-none focus:border-sage"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-wood mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="再次输入密码"
                  className="w-full px-4 py-2 border border-almond-light rounded-lg focus:outline-none focus:border-sage"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-sage text-white font-medium rounded-lg hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? '注册中...' : '创建账户'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-almond-light text-center">
              <p className="text-sm text-warm-wood-light mb-2">
                已有账户？
              </p>
              <Link
                href="/login"
                className="inline-block text-sage font-medium hover:text-sage/80 transition-colors"
              >
                立即登录
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
