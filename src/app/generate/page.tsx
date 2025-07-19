'use client'

import { useState } from 'react'
import TokensTable from '@/components/TokensTable'

interface TokenResult {
  token: string
  label: string
  maxMessages: number
  expiresAt: string
  url: string
}

export default function GenerateToken() {
  const [label, setLabel] = useState('')
  const [maxMessages, setMaxMessages] = useState(30)
  const [validityDays, setValidityDays] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TokenResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          <h1 className="text-2xl font-medium text-stone-800 mb-6">Generate Access Token</h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-stone-700 mb-2">
                Label (e.g., ABC_Company_AI_Engineer)
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
              className="w-full bg-stone-700 text-white rounded-lg py-3 px-4 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Token</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-stone-100 text-stone-800 p-3 rounded font-mono text-sm break-all">
                    {result.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.token)}
                    className="px-3 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Full URL</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-stone-100 text-stone-800 p-3 rounded font-mono text-sm break-all">
                    {result.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.url)}
                    className="px-3 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 text-sm"
                  >
                    Copy
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
          <TokensTable />
        </div>
      </div>
    </div>
  )
}