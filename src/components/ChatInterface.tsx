'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const thinkingMessages = [
    `exploring Sheng's background...`,
    `reviewing Sheng's experience...`,
    `analyzing Sheng's skills...`,
    `finding relevant information...`,
    `processing Sheng's expertise...`,
    `understanding Sheng's qualifications..`
  ]

  const firstMessages = [
    `**Hi there! 👋  I'm askSheng, Sheng's AI Assistant.**
\nI'm here to help you get to know Sheng beyond his resume. You can:
- 📝 Paste a job description, and I'll assess how well Sheng fits the role
- 💼 Ask about specific skills, projects, or experiences from his resume
- 🤝 Learn more about his interests, personality, and what makes him unique

\nJust type your question or **paste a job post** — let's get started!
  `,
    `**Hey there! 👋 You’re chatting with askSheng, Sheng's AI assistant.**

\nI'm here to help you get to know Sheng beyond his resume. I can help you:
- 📝 Understand how Sheng aligns with your job requirements
- 💼 Explore his technical skills and past work
- 🤝 Discover more about who he is beyond the resume

Feel free to ask a question or **paste a job description** to begin.`
  ]

  const getRandomFirstMessage = () => {
    return firstMessages[Math.floor(Math.random() * firstMessages.length)]
  }

  const createSession = async (token: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      setSessionId(data.sessionId)
      return data.sessionId
    } catch (error) {
      // Session creation failed - will be handled when user tries to send message
      return null
    }
  }

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      // Create session when landing on the page
      createSession(tokenParam)
    }
    // Always add welcome message regardless of token
    setMessages([{
      id: '1',
      text: getRandomFirstMessage(),
      isUser: false,
      timestamp: new Date()
    }])
  }, [searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const simulateThinking = () => {
    setIsThinking(true)
    let messageIndex = 0
    
    const thinkingInterval = setInterval(() => {
      setThinkingText(thinkingMessages[messageIndex])
      messageIndex = (messageIndex + 1) % thinkingMessages.length
    }, 1500)

    return () => {
      clearInterval(thinkingInterval)
      setIsThinking(false)
      setThinkingText('')
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Check if token is missing and show error
    if (!token) {
      setError(`This link doesn’t seem to be active anymore. Please contact Sheng to regain access to askSheng.`)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    // Start thinking simulation
    const stopThinking = simulateThinking()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.text,
          token,
          sessionId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Stop thinking simulation before showing response
      stopThinking()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      stopThinking()
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }


  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/sheng.png" alt="Sheng's icon" className="w-8 h-8 rounded-full" />
              <h1 className="text-xl font-medium text-stone-800">askSheng</h1>
            </div>
            <a 
              href="https://ngtingsheng.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors font-medium flex items-center space-x-2"
            >
              <span>Personal Blog</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                  message.isUser
                    ? 'bg-orange-100 text-amber-900'
                    : 'bg-gradient-to-b from-amber-50 to-orange-50 text-amber-900 border border-orange-200'
                }`}
              >
                {message.isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                ) : (
                  <div className="prose prose-amber prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-base">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-amber-900">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-900 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-amber-900 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-900 mb-2">{children}</h3>,
                        code: ({ children }) => <code className="bg-orange-100 px-1 py-0.5 rounded text-sm font-mono text-amber-900">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-orange-300 pl-4 italic">{children}</blockquote>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                <time className="text-xs text-amber-700 mt-2 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-b from-amber-50 to-orange-50 text-amber-900 border border-orange-200 rounded-lg px-4 py-3 max-w-[100%] shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm italic text-amber-700">{thinkingText}</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-stone-200 bg-white p-6">
          <div className="flex space-x-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about his experience, skills, or background..."
              className="flex-1 resize-none border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-stone-700 placeholder-stone-400 placeholder:text-ellipsis placeholder:overflow-hidden placeholder:whitespace-nowrap"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-orange-100 text-amber-900 rounded-lg hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}