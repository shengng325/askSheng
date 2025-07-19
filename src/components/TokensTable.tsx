'use client'

import { useState, useEffect } from 'react'

interface Token {
  id: string
  token: string
  label: string
  maxMessages: number
  usedMessages: number
  expiresAt: string
  createdAt: string
}

export default function TokensTable() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tokens')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens')
      }
      
      const data = await response.json()
      setTokens(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTokenId(tokenId)
      setTimeout(() => setCopiedTokenId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getFullUrl = (token: string) => {
    return `${process.env.NEXT_PUBLIC_APP_URL}?token=${token}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
        <div className="text-center text-stone-600">Loading tokens...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-medium text-stone-800">Generated Tokens</h2>
        <button
          onClick={fetchTokens}
          className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 text-sm"
        >
          Refresh
        </button>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center text-stone-600 py-8">
          No tokens generated yet
        </div>
      ) : (
        <div className="w-full">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-4 px-6 font-medium text-stone-700 w-1/5">Label</th>
                <th className="text-left py-4 px-6 font-medium text-stone-700 w-2/5">Token</th>
                <th className="text-center py-4 px-6 font-medium text-stone-700 w-1/6">Used/Max Messages</th>
                <th className="text-center py-4 px-6 font-medium text-stone-700 w-1/8">Created</th>
                <th className="text-center py-4 px-6 font-medium text-stone-700 w-1/8">Expires</th>
                <th className="text-center py-4 px-6 font-medium text-stone-700 w-1/12">Status</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-stone-800 truncate">{token.label}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div 
                      className="flex items-center space-x-2 cursor-pointer hover:bg-stone-50 rounded p-1 -m-1 transition-colors"
                      onClick={() => copyToClipboard(getFullUrl(token.token), token.id)}
                      title="Click to copy full URL"
                    >
                      <code className="flex-1 bg-stone-100 text-stone-800 px-3 py-2 rounded text-sm font-mono truncate">
                        {token.token}
                      </code>
                      <div className="text-stone-600">
                        {copiedTokenId === token.id ? (
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-green-600 animate-pulse">Copied</span>
                          </div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`${token.usedMessages >= token.maxMessages ? 'text-red-600' : 'text-stone-600'}`}>
                      {token.usedMessages}/{token.maxMessages}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-stone-600 text-sm">
                    {formatDate(token.createdAt)}
                  </td>
                  <td className="py-4 px-6 text-center text-stone-600 text-sm">
                    {formatDate(token.expiresAt)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      isExpired(token.expiresAt) || token.usedMessages >= token.maxMessages
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isExpired(token.expiresAt) ? 'Expired' : 
                       token.usedMessages >= token.maxMessages ? 'Used Up' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}