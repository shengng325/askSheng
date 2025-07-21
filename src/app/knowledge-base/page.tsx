'use client'

import { useState, useEffect } from 'react'

export default function KnowledgeBaseEditor() {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load existing content on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/api/knowledge-base')
        const data = await response.json()
        
        if (response.ok) {
          setContent(data.content || '')
        } else {
          setMessage({ type: 'error', text: 'Failed to load knowledge base' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error loading knowledge base' })
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Knowledge base saved successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save knowledge base' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving knowledge base' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-stone-600">Loading knowledge base...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-medium text-stone-800">Knowledge Base Editor</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-stone-700 text-white rounded-lg py-2 px-4 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-stone-700 mb-2">
                Knowledge Base Content (Markdown)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your knowledge base content in Markdown format..."
                className="w-full h-96 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-700 font-mono text-sm resize-none"
              />
            </div>

            <div className="text-sm text-stone-600">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Use Markdown syntax for formatting (# for headers, ** for bold, etc.)</li>
                <li>This content will be used by the AI to answer questions about you</li>
                <li>Include your skills, experience, education, and preferences</li>
                <li>Changes are saved immediately to the database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}