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
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const thinkingMessages = [
    'exploring their background...',
    'reviewing their experience...',
    'analyzing their skills...',
    'finding relevant information...',
    'processing their expertise...',
    'understanding their qualifications...'
  ]

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      // Add welcome message
      setMessages([{
        id: '1',
        text: "Hello! I'm here to help answer any questions you have about this candidate. Feel free to ask about their experience, skills, projects, or anything else you'd like to know!",
        isUser: false,
        timestamp: new Date()
      }])
    } else {
      setError('No access token provided. Please use the link provided by the candidate.')
    }
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
    if (!inputValue.trim() || !token || isLoading) return

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
          token
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

  if (error && !token) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-stone-200 p-8 text-center">
          <h2 className="text-xl font-medium text-stone-800 mb-4">Access Required</h2>
          <p className="text-stone-600 leading-relaxed">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-medium text-stone-800">AI Assistant</h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.isUser
                    ? 'bg-stone-200 text-stone-800'
                    : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                {message.isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                ) : (
                  <div className="prose prose-stone prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-base">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-stone-800">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-stone-800 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-stone-800 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold text-stone-800 mb-2">{children}</h3>,
                        code: ({ children }) => <code className="bg-stone-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-stone-300 pl-4 italic">{children}</blockquote>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                <time className="text-xs text-stone-500 mt-2 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white text-stone-700 border border-stone-200 rounded-lg px-4 py-3 max-w-[70%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm italic text-stone-500">{thinkingText}</span>
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
              placeholder="Ask about their experience, skills, or background..."
              className="flex-1 resize-none border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700 placeholder-stone-400"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}