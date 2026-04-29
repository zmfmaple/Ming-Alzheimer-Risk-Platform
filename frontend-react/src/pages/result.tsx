'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { jsPDF } from 'jspdf'

// Risk level translations
const riskTranslations: any = {
  '低风险': { en: 'Low Risk', color: '#34C759', bg: 'bg-green-100' },
  '中风险': { en: 'Medium Risk', color: '#FF9500', bg: 'bg-yellow-100' },
  '高风险': { en: 'High Risk', color: '#FF3B30', bg: 'bg-red-100' }
}

export default function Result() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    // Get data from URL params
    const resultParam = searchParams.get('result')
    const formDataParam = searchParams.get('formData')

    if (resultParam) {
      try {
        setResult(JSON.parse(decodeURIComponent(resultParam)))
      } catch (e) {
        console.error('Failed to parse result:', e)
      }
    }

    if (formDataParam) {
      try {
        setFormData(JSON.parse(decodeURIComponent(formDataParam)))
      } catch (e) {
        console.error('Failed to parse formData:', e)
      }
    }
  }, [searchParams])

  const getRiskInfo = (level: string) => {
    return riskTranslations[level] || { en: 'Unknown', color: '#86868B', bg: 'bg-gray-100' }
  }

    // Send message to AI assistant
  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return
    
    // Add user message
    const userMsg = { role: 'user', content: message }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsChatLoading(true)
    
    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          result: result,
          formData: formData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const aiMsg = { role: 'assistant', content: data.response }
        setChatMessages(prev => [...prev, aiMsg])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect to the assistant. Please ensure the backend is running.' }])
    }
    setIsChatLoading(false)
  }
  
  // Starter questions
  const starterQuestions = [
    'Explain my result',
    'Why is my risk score high/low?',
    'What are the top risk factors?',
    'Summarise my report simply'
  ]

const generatePDF = () => {
    if (!result || !formData) return

    setIsGeneratingPDF(true)

    const doc = new jsPDF()
    const riskInfo = getRiskInfo(result.risk_level)
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(24)
    doc.setTextColor(117, 88, 82) // warm-wood
    doc.text('BrainEcho Assessment Report', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(134, 134, 139)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 33, { align: 'center' })

    // Risk Summary
    doc.setDrawColor(140, 157, 121) // sage
    doc.setLineWidth(0.5)
    doc.line(20, 40, pageWidth - 20, 40)

    doc.setFontSize(16)
    doc.setTextColor(29, 29, 31)
    doc.text('Risk Assessment Summary', 20, 50)

    doc.setFontSize(14)
    doc.setTextColor(parseInt(riskInfo.color.slice(1, 3), 16), parseInt(riskInfo.color.slice(3, 5), 16), parseInt(riskInfo.color.slice(5, 7), 16))
    doc.text(`Risk Level: ${result.risk_level} (${riskInfo.en})`, 20, 60)

    doc.setFontSize(12)
    doc.setTextColor(29, 29, 31)
    doc.text(`Risk Probability: ${(result.risk_probability * 100).toFixed(1)}%`, 20, 70)

    // Key Factors
    doc.setFontSize(14)
    doc.text('Key Risk Factors', 20, 85)

    doc.setFontSize(10)
    let yPos = 95
    result.top_explanations.forEach((exp: any, i: number) => {
      const impact = exp.impact === 'positive' ? '↑ Increases risk' : '↓ Decreases risk'
      const color = exp.impact === 'positive' ? [255, 59, 48] : [52, 199, 89]
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(`${i + 1}. ${exp.feature}: ${impact} (${exp.shap_value.toFixed(4)})`, 25, yPos)
      yPos += 8
    })

    // Input Summary
    doc.setTextColor(29, 29, 31)
    doc.setFontSize(14)
    doc.text('Input Summary', 20, yPos + 10)

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const summaryItems = [
      `Age: ${formData.Age}`,
      `Gender: ${formData.Gender === 1 ? 'Male' : 'Female'}`,
      `MMSE: ${formData.MMSE}`,
      `BMI: ${formData.BMI}`,
      `Blood Pressure: ${formData.SystolicBP}/${formData.DiastolicBP}`
    ]

    yPos += 20
    summaryItems.forEach(item => {
      doc.text(item, 25, yPos)
      yPos += 6
    })

    // Disclaimer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Disclaimer: This report is for demonstration and risk-assessment support only.', 20, 270)
    doc.text('It is not a clinical diagnosis. Please consult healthcare professionals for medical advice.', 20, 276)

    // Save
    doc.save(`assessment_report_${new Date().toISOString().split('T')[0]}.pdf`)
    setIsGeneratingPDF(false)
  }

  if (!result) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-warm-wood-light">No result data available.</p>
            <Link href="/assessment" className="text-sage hover:underline mt-4 inline-block">
              Go to Assessment →
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const riskInfo = getRiskInfo(result.risk_level)

  return (
    <>
      <Head>
        <title>Assessment Result - BrainEcho</title>
      </Head>

      <Layout>
        <div className="min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="font-display text-4xl font-bold text-warm-wood mb-2">
                Assessment Report
              </h1>
              <p className="text-warm-wood-light">
                Your personalized Alzheimer's risk assessment results
              </p>
            </motion.div>

            {/* A. Overall Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 mb-6"
            >
              <h2 className="font-display text-xl font-bold text-warm-wood mb-6">
                A. Overall Risk Assessment
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Risk Level Badge */}
                <div className="text-center">
                  <div className={`inline-block px-8 py-4 rounded-2xl ${riskInfo.bg}`}>
                    <p className="text-4xl mb-2">
                      {result.risk_level === '高风险' ? '⚠️' : result.risk_level === '中风险' ? '⚡' : '✅'}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: riskInfo.color }}>
                      {result.risk_level}
                    </p>
                    <p className="text-sm text-warm-wood-light">{riskInfo.en}</p>
                  </div>
                </div>

                {/* Risk Probability */}
                <div className="text-center">
                  <p className="text-warm-wood-light mb-2">Risk Probability</p>
                  <p className="font-display text-5xl font-bold text-warm-wood">
                    {(result.risk_probability * 100).toFixed(1)}
                    <span className="text-2xl">%</span>
                  </p>
                  <p className="text-sm text-warm-wood-light mt-2">
                    Based on your submitted information
                  </p>
                </div>
              </div>

              {/* Summary Text */}
              <div className="mt-6 p-4 bg-almond-light rounded-xl">
                <p className="text-warm-wood">
                  {result.risk_level === '低风险' && "Your current estimated risk is low. Continue maintaining a healthy lifestyle."}
                  {result.risk_level === '中风险' && "Your risk level is moderate. Consider consulting a healthcare professional for further evaluation."}
                  {result.risk_level === '高风险' && "Your risk level is elevated. We recommend consulting a healthcare professional promptly."}
                </p>
              </div>
            </motion.div>

            {/* B. Key Risk Factors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 mb-6"
            >
              <h2 className="font-display text-xl font-bold text-warm-wood mb-6">
                B. Key Risk Factors Analysis
              </h2>

              <div className="space-y-4">
                {result.top_explanations.map((exp: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      exp.impact === 'positive' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <span className={exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}>
                        {exp.impact === 'positive' ? '↑' : '↓'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-warm-wood">{exp.feature}</p>
                      <p className={`text-sm ${exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}`}>
                        {exp.impact === 'positive' ? 'Increases risk' : 'Decreases risk'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}`}>
                        {exp.shap_value > 0 ? '+' : ''}{exp.shap_value.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Bar Chart */}
              <div className="mt-6">
                {result.top_explanations.map((exp: any, i: number) => {
                  const width = Math.min(Math.abs(exp.shap_value) * 500, 100)
                  return (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-warm-wood">{exp.feature}</span>
                        <span className={exp.impact === 'positive' ? 'text-red-500' : 'text-green-500'}>
                          {exp.impact === 'positive' ? '+' : ''}{exp.shap_value.toFixed(4)}
                        </span>
                      </div>
                      <div className="h-3 bg-almond-light rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${exp.impact === 'positive' ? 'bg-red-400' : 'bg-green-400'}`}
                          style={{ width: `${width}%`, marginLeft: exp.impact === 'negative' ? 'auto' : 0 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* C. Input Summary */}
            {formData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-8 mb-6"
              >
                <h2 className="font-display text-xl font-bold text-warm-wood mb-6">
                  C. Your Input Summary
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="p-4 bg-almond-light rounded-xl">
                    <h3 className="font-semibold text-warm-wood mb-3">👤 Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">Age:</span> {formData.Age} years</p>
                      <p><span className="text-warm-wood-light">Gender:</span> {formData.Gender === 1 ? 'Male' : 'Female'}</p>
                      <p><span className="text-warm-wood-light">Education:</span> {['Elementary', 'High School', 'College'][formData.EducationLevel]}</p>
                    </div>
                  </div>

                  {/* Lifestyle */}
                  <div className="p-4 bg-almond-light rounded-xl">
                    <h3 className="font-semibold text-warm-wood mb-3">🏃 Lifestyle</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">BMI:</span> {formData.BMI}</p>
                      <p><span className="text-warm-wood-light">Physical Activity:</span> {formData.PhysicalActivity}/10</p>
                      <p><span className="text-warm-wood-light">Sleep Quality:</span> {formData.SleepQuality}/10</p>
                      <p><span className="text-warm-wood-light">Smoking:</span> {formData.Smoking === 1 ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {/* Medical */}
                  <div className="p-4 bg-almond-light rounded-xl">
                    <h3 className="font-semibold text-warm-wood mb-3">🏥 Medical History</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">Family History:</span> {formData.FamilyHistoryAlzheimers === 1 ? 'Yes' : 'No'}</p>
                      <p><span className="text-warm-wood-light">Diabetes:</span> {formData.Diabetes === 1 ? 'Yes' : 'No'}</p>
                      <p><span className="text-warm-wood-light">Hypertension:</span> {formData.Hypertension === 1 ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {/* Cognitive */}
                  <div className="p-4 bg-almond-light rounded-xl">
                    <h3 className="font-semibold text-warm-wood mb-3">🧠 Cognitive Assessment</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-warm-wood-light">MMSE Score:</span> {formData.MMSE}/30</p>
                      <p><span className="text-warm-wood-light">Functional Assessment:</span> {formData.FunctionalAssessment}</p>
                      <p><span className="text-warm-wood-light">ADL Score:</span> {formData.ADL}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* D. Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 mb-6"
            >
              <h2 className="font-display text-lg font-bold text-warm-wood mb-3">
                📋 Important Notice
              </h2>
              <p className="text-sm text-warm-wood-light leading-relaxed">
                This result is for demonstration and risk-assessment support only.
                It is not a clinical diagnosis and should not be used as a substitute for
                professional medical advice. Please consult with qualified healthcare
                professionals for proper evaluation and guidance regarding Alzheimer's disease.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="btn-primary"
              >
                {isGeneratingPDF ? 'Generating...' : '📥 Download PDF Report'}
              </button>

              <Link href="/assessment" className="btn-primary" style={{ background: '#755852' }}>
                🔄 New Assessment
              </Link>
            

            {/* AI Chatbox Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-warm-wood mb-2">
                  🤖 AI Report Assistant
                </h2>
                <p className="text-sm text-warm-wood-light mb-4">
                  Ask questions about your result. This assistant explains the report and does not provide medical diagnosis.
                </p>
                
                {/* Starter Questions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {starterQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(q)}
                      disabled={isChatLoading}
                      className="text-xs px-3 py-1.5 bg-almond-light text-warm-wood rounded-full hover:bg-sage hover:text-white transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                
                {/* Chat Messages */}
                <div className="bg-white rounded-xl p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-warm-wood-light text-center py-4">
                      Ask a question above or choose a suggested question!
                    </p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user' 
                            ? 'bg-sage text-white' 
                            : 'bg-almond-light text-warm-wood'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-almond-light rounded-2xl px-4 py-2">
                        <p className="text-sm text-warm-wood-light">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage(chatInput)}
                    placeholder="Ask about your report..."
                    className="flex-1 px-4 py-2 bg-white border border-almond-light rounded-xl focus:outline-none focus:border-sage text-sm"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={() => sendChatMessage(chatInput)}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="px-4 py-2 bg-sage text-white rounded-xl hover:bg-sage-dark transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                
                {/* Disclaimer */}
                <p className="text-xs text-warm-wood-light mt-3 text-center">
                  ⚠️ This assistant explains your assessment report for informational purposes only. It does not provide medical diagnosis or treatment advice.
                </p>
              </div>
            </motion.div>

</motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}