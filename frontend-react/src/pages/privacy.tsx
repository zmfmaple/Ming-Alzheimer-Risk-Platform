'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/lib/consent'
import { API_BASE } from '@/lib/api'

export default function Privacy() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('token')))
  }, [])

  const exportData = async () => {
    setIsWorking(true)
    setError('')
    setStatusMessage('')
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('请先登录账户。')
      const response = await fetch(`${API_BASE}/data/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || '数据导出失败。')
      const blob = new Blob([JSON.stringify(body, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `brainecho-personal-data-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setStatusMessage('个人数据副本已生成。')
    } catch (requestError: any) {
      setError(requestError.message || '数据导出失败。')
    } finally {
      setIsWorking(false)
    }
  }

  const deleteAccount = async () => {
    if (!password) {
      setError('请输入当前密码以确认永久删除。')
      return
    }
    if (!window.confirm('此操作会永久删除账户和全部评估记录，且无法撤销。确定继续吗？')) {
      return
    }
    setIsWorking(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('请先登录账户。')
      const response = await fetch(`${API_BASE}/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || '账户删除失败。')
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem(CONSENT_STORAGE_KEY)
      router.push('/')
    } catch (requestError: any) {
      setError(requestError.message || '账户删除失败。')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <>
      <Head>
        <title>Data and Privacy - BrainEcho</title>
      </Head>
      <Layout>
        <main className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8">
              <p className="text-sm font-semibold text-sage-dark">
                Consent version {CONSENT_VERSION}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-warm-wood">
                数据与隐私
              </h1>
              <p className="mt-3 max-w-3xl leading-7 text-warm-wood-light">
                BrainEcho 是课程研究原型，不是医疗服务。系统处理健康史、认知、
                功能和人口统计信息，以生成并解释问卷条件下的模型概率。
              </p>
            </header>

            <div className="space-y-8 bg-white p-6 sm:p-8">
              <section>
                <h2 className="text-xl font-bold text-warm-wood">收集与用途</h2>
                <p className="mt-3 leading-7 text-warm-wood-light">
                  登录评估会保存账户标识、原始问卷回答、项目派生分数、填补信息、
                  模型输出和 SHAP 解释。数据用于展示模型设计、可解释性和历史记录功能，
                  不用于临床诊断、治疗决定或商业营销。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-warm-wood">保存与访问</h2>
                <p className="mt-3 leading-7 text-warm-wood-light">
                  当前原型将数据保存在项目本机的 SQLite 数据库中。系统尚未设置自动
                  到期删除，因此记录会保留到用户主动删除单次评估或删除账户。部署到
                  公共环境前仍需配置独立密钥、访问控制、备份与正式保存期限。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-warm-wood">您的控制权</h2>
                <p className="mt-3 leading-7 text-warm-wood-light">
                  登录用户可以下载结构化 JSON 数据副本，在历史页面删除单次评估，
                  或在下方删除账户及全部关联记录。删除操作不会影响已经写入课程报告的
                  汇总统计，但个人账户记录会从当前数据库移除。
                </p>
              </section>

              {isLoggedIn ? (
                <section className="border-t border-almond-light pt-7">
                  <h2 className="text-xl font-bold text-warm-wood">账户数据操作</h2>
                  {statusMessage && (
                    <p className="mt-4 border border-green-300 bg-green-50 p-3 text-sm text-green-800">
                      {statusMessage}
                    </p>
                  )}
                  {error && (
                    <p className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={exportData}
                      disabled={isWorking}
                      className="btn-primary min-h-11 disabled:opacity-50"
                    >
                      导出我的数据
                    </button>
                  </div>
                  <div className="mt-8 border border-red-300 bg-red-50 p-5">
                    <h3 className="font-bold text-red-800">永久删除账户</h3>
                    <p className="mt-2 text-sm leading-6 text-red-700">
                      账户、问卷、模型结果和历史记录将一并删除。此操作无法撤销。
                    </p>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="输入当前密码"
                      className="mt-4 w-full max-w-sm border border-red-300 bg-white px-4 py-3"
                    />
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={isWorking}
                      className="mt-4 min-h-11 bg-red-700 px-5 font-semibold text-white disabled:opacity-50"
                    >
                      删除账户和全部数据
                    </button>
                  </div>
                </section>
              ) : (
                <p className="border-t border-almond-light pt-6 text-sm text-warm-wood-light">
                  登录后可在此导出或删除账户数据。
                </p>
              )}
            </div>
          </div>
        </main>
      </Layout>
    </>
  )
}
