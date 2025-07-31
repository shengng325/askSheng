'use client'

import { useState, useRef } from 'react'
import TokensTable, { TokensTableRef } from '@/components/TokensTable'

interface TokenResult {
  token: string
  label: string
  company: string | null
  maxMessages: number
  expiresAt: string
  url: string
}

export default function GenerateToken() {
  const [label, setLabel] = useState('')
  const [company, setCompany] = useState('')
  const [maxMessages, setMaxMessages] = useState(30)
  const [validityDays, setValidityDays] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TokenResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const tokensTableRef = useRef<TokensTableRef>(null)

  const generateToken = async () => {
    if (!label.trim()) {
      setError('Label is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: label.trim(),
          company: company.trim() || null,
          maxMessages,
          validityDays
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token')
      }

      setResult(data)
      setLabel('')
      setCompany('')
      
      // Refresh the tokens table
      tokensTableRef.current?.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyUrlToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          <h1 className="text-2xl font-medium text-stone-800 mb-6">Generate Access Token</h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-stone-700 mb-2">
                Label (e.g., AI_Engineer_Position)
              </label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter a descriptive label"
                className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-stone-700 mb-2">
                Company (optional)
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name"
                className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxMessages" className="block text-sm font-medium text-stone-700 mb-2">
                  Max Messages
                </label>
                <input
                  id="maxMessages"
                  type="number"
                  value={maxMessages}
                  onChange={(e) => setMaxMessages(parseInt(e.target.value) || 30)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700"
                />
              </div>

              <div>
                <label htmlFor="validityDays" className="block text-sm font-medium text-stone-700 mb-2">
                  Validity (Days)
                </label>
                <input
                  id="validityDays"
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={generateToken}
              disabled={isLoading}
              className="w-full bg-stone-700 text-white rounded-lg py-3 px-4 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <h2 className="text-xl font-medium text-stone-800 mb-6">Generated Token</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Label</label>
                <p className="text-stone-600">{result.label}</p>
              </div>

              {result.company && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Company</label>
                  <p className="text-stone-600">{result.company}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Full URL</label>
                <div className="flex items-center space-x-2">
                  <code 
                    className="flex-1 bg-stone-100 text-stone-800 p-3 rounded font-mono text-sm break-all cursor-pointer hover:bg-stone-200 transition-colors"
                    onClick={() => copyUrlToClipboard(result.url)}
                    title="Click to copy URL"
                  >
                    {result.url}
                  </code>
                  <button
                    onClick={() => copyUrlToClipboard(result.url)}
                    className="px-3 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 text-sm transition-all duration-200 cursor-pointer"
                  >
                    {copiedUrl ? (
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-600">Copied</span>
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-stone-600">
                <div>
                  <span className="font-medium">Max Messages:</span> {result.maxMessages}
                </div>
                <div>
                  <span className="font-medium">Expires:</span> {new Date(result.expiresAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <TokensTable ref={tokensTableRef} />
        </div>
      </div>
    </div>
  )
}