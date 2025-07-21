'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface TokenDetails {
  id: string
  token: string
  label: string
  company: string | null
  maxMessages: number
  usedMessages: number
  expiresAt: string
  createdAt: string
  sessions: SessionDetails[]
}

interface SessionDetails {
  id: string
  sessionId: string
  createdAt: string
  conversations: ConversationDetails[]
}

interface ConversationDetails {
  id: string
  message: string
  response: string
  createdAt: string
}

export default function TokenDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.id as string
  
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    label: '',
    company: '',
    maxMessages: 0,
    expiresAt: ''
  })

  useEffect(() => {
    if (tokenId) {
      fetchTokenDetails()
    }
  }, [tokenId])

  const fetchTokenDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tokens/${tokenId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch token details')
      }
      
      const data = await response.json()
      setTokenDetails(data)
      
      // Initialize edit form with current values
      setEditForm({
        label: data.label,
        company: data.company || '',
        maxMessages: data.maxMessages,
        expiresAt: new Date(data.expiresAt).toISOString().slice(0, 16) // Format for datetime-local input
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form to original values
    if (tokenDetails) {
      setEditForm({
        label: tokenDetails.label,
        company: tokenDetails.company || '',
        maxMessages: tokenDetails.maxMessages,
        expiresAt: new Date(tokenDetails.expiresAt).toISOString().slice(0, 16)
      })
    }
  }

  const handleSaveChanges = async () => {
    if (!tokenDetails) return

    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/tokens/${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: editForm.label,
          company: editForm.company || null,
          maxMessages: editForm.maxMessages,
          expiresAt: new Date(editForm.expiresAt).toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update token')
      }

      const updatedToken = await response.json()
      
      // Update the token details with the new values
      setTokenDetails({
        ...tokenDetails,
        label: updatedToken.label,
        company: updatedToken.company,
        maxMessages: updatedToken.maxMessages,
        expiresAt: updatedToken.expiresAt
      })
      
      setIsEditing(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update token')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="text-center text-stone-600">Loading token details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tokenDetails) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="text-center text-red-600">Error: {error || 'Token not found'}</div>
            <div className="text-center mt-4">
              <button
                onClick={() => router.push('/generate')}
                className="px-4 py-2 bg-stone-700 text-white rounded hover:bg-stone-800"
              >
                Back to Tokens
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/generate')}
            className="flex items-center text-stone-600 hover:text-stone-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tokens
          </button>
        </div>

        {/* Token Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-medium text-stone-800">Token Details</h1>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-stone-700 text-white rounded hover:bg-stone-800 transition-colors"
              >
                Edit Token
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-stone-700 text-white rounded hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Label</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter label"
                  />
                  <p className="text-xs text-stone-500 mt-1">Descriptive label for this token</p>
                </div>
              ) : (
                <p className="text-stone-800 font-medium">{tokenDetails.label}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Company</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter company name (optional)"
                  />
                  <p className="text-xs text-stone-500 mt-1">Company name (optional)</p>
                </div>
              ) : (
                <p className="text-stone-800">{tokenDetails.company || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Token</label>
              <code className="block bg-stone-100 text-stone-800 px-3 py-2 rounded text-sm font-mono break-all">
                {tokenDetails.token}
              </code>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Messages Used</label>
              {isEditing ? (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-stone-800">{tokenDetails.usedMessages} / </span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.maxMessages}
                      onChange={(e) => setEditForm({ ...editForm, maxMessages: parseInt(e.target.value) || 1 })}
                      className="w-20 border border-stone-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1">Max messages limit</p>
                </div>
              ) : (
                <p className={`font-medium ${tokenDetails.usedMessages >= tokenDetails.maxMessages ? 'text-red-600' : 'text-stone-800'}`}>
                  {tokenDetails.usedMessages} / {tokenDetails.maxMessages}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Sessions</label>
              <p className="text-stone-800 font-medium">{tokenDetails.sessions.length}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                isExpired(tokenDetails.expiresAt) || tokenDetails.usedMessages >= tokenDetails.maxMessages
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {isExpired(tokenDetails.expiresAt) ? 'Expired' : 
                 tokenDetails.usedMessages >= tokenDetails.maxMessages ? 'Used Up' : 'Active'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Created</label>
              <p className="text-stone-600 text-sm">{formatDate(tokenDetails.createdAt)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Expires</label>
              {isEditing ? (
                <div>
                  <input
                    type="datetime-local"
                    value={editForm.expiresAt}
                    onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                    className="border border-stone-300 rounded px-3 py-2 text-sm w-full"
                  />
                  <p className="text-xs text-stone-500 mt-1">Expiration date and time</p>
                </div>
              ) : (
                <p className="text-stone-600 text-sm">{formatDate(tokenDetails.expiresAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          <h2 className="text-xl font-medium text-stone-800 mb-6">Sessions</h2>
          
          {tokenDetails.sessions.length === 0 ? (
            <div className="text-center text-stone-600 py-8">
              No sessions found for this token
            </div>
          ) : (
            <div className="space-y-4">
              {tokenDetails.sessions.map((session) => (
                <div key={session.id} className="border border-stone-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="w-full px-6 py-4 bg-stone-50 hover:bg-stone-100 transition-colors text-left flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-stone-800">
                          Session {session.sessionId.slice(-8)}
                        </div>
                        <div className="text-sm text-stone-600">
                          {session.conversations.length} messages • {formatDate(session.createdAt)}
                        </div>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-stone-600 transition-transform ${
                        expandedSessions.has(session.id) ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSessions.has(session.id) && (
                    <div className="px-6 py-4 border-t border-stone-200">
                      {session.conversations.length === 0 ? (
                        <div className="text-center text-stone-500 py-4">
                          No conversations in this session
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {session.conversations.map((conversation) => (
                            <div key={conversation.id} className="border-l-4 border-stone-200 pl-4">
                              <div className="mb-2">
                                <div className="text-sm font-medium text-stone-700 mb-1">User Message:</div>
                                <div className="text-stone-800 bg-stone-50 p-3 rounded text-sm">
                                  {conversation.message}
                                </div>
                              </div>
                              <div className="mb-2">
                                <div className="text-sm font-medium text-stone-700 mb-1">AI Response:</div>
                                <div className="text-stone-800 bg-blue-50 p-3 rounded text-sm">
                                  {conversation.response}
                                </div>
                              </div>
                              <div className="text-xs text-stone-500">
                                {formatDate(conversation.createdAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}