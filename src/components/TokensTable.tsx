'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'

interface Token {
  id: string
  token: string
  label: string
  company: string | null
  maxMessages: number
  usedMessages: number
  expiresAt: string
  createdAt: string
  _count: {
    sessions: number
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface TokensResponse {
  tokens: Token[]
  pagination: PaginationInfo
}

export interface TokensTableRef {
  refresh: () => void
}

const TokensTable = forwardRef<TokensTableRef>((props, ref) => {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'label' | 'company' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchTokens()
  }, [currentPage, sortBy, sortOrder])

  useImperativeHandle(ref, () => ({
    refresh: fetchTokens
  }))

  const fetchTokens = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/tokens?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens')
      }
      
      const data: TokensResponse = await response.json()
      setTokens(data.tokens)
      setPagination(data.pagination)
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
    return `${process.env.NEXT_PUBLIC_APP_URL}?src=${token}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const handleSort = (column: 'label' | 'company' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTokenDetailsClick = (tokenId: string) => {
    router.push(`/tokens/${tokenId}`)
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
          {/* Desktop view */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="w-[20%] text-left py-4 px-4 font-medium text-stone-700">
                    <button
                      onClick={() => handleSort('label')}
                      className="group flex items-center justify-between hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all w-full text-left"
                    >
                      <span className="truncate">Label</span>
                      <div className="flex flex-col ml-1 flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 transition-colors ${
                            sortBy === 'label' && sortOrder === 'asc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg 
                          className={`w-3 h-3 transition-colors -mt-1 ${
                            sortBy === 'label' && sortOrder === 'desc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </th>
                  <th className="w-[18%] text-left py-4 px-4 font-medium text-stone-700">
                    <button
                      onClick={() => handleSort('company')}
                      className="group flex items-center justify-between hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all w-full text-left"
                    >
                      <span className="truncate">Company</span>
                      <div className="flex flex-col ml-1 flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 transition-colors ${
                            sortBy === 'company' && sortOrder === 'asc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg 
                          className={`w-3 h-3 transition-colors -mt-1 ${
                            sortBy === 'company' && sortOrder === 'desc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </th>
                  <th className="w-[16%] text-left py-4 px-4 font-medium text-stone-700">
                    <span>Token</span>
                  </th>
                  <th className="w-[9%] text-center py-4 px-4 font-medium text-stone-700">
                    <span>Messages</span>
                  </th>
                  <th className="w-[9%] text-center py-4 px-4 font-medium text-stone-700">
                    <span>Sessions</span>
                  </th>
                  <th className="w-[11%] text-center py-4 px-4 font-medium text-stone-700">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="group flex items-center justify-center hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all w-full"
                    >
                      <span>Created</span>
                      <div className="flex flex-col ml-1 flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 transition-colors ${
                            sortBy === 'createdAt' && sortOrder === 'asc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg 
                          className={`w-3 h-3 transition-colors -mt-1 ${
                            sortBy === 'createdAt' && sortOrder === 'desc' 
                              ? 'text-stone-900' 
                              : 'text-stone-400 group-hover:text-stone-600'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </th>
                  <th className="w-[11%] text-center py-4 px-4 font-medium text-stone-700">
                    <span>Expires</span>
                  </th>
                  <th className="w-[8%] text-center py-4 px-4 font-medium text-stone-700">
                    <span>Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-stone-800 truncate" title={token.label}>{token.label}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-stone-600 truncate" title={token.company || ''}>{token.company || '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-stone-50 rounded p-1 -m-1 transition-colors"
                        onClick={() => copyToClipboard(getFullUrl(token.token), token.id)}
                        title="Click to copy full URL"
                      >
                        <code className="flex-1 bg-stone-100 text-stone-800 px-2 py-1 rounded text-sm font-mono truncate">
                          {token.token}
                        </code>
                        <div className="text-stone-600 flex-shrink-0">
                          {copiedTokenId === token.id ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTokenDetailsClick(token.id)}
                        className="hover:bg-stone-100 rounded px-2 py-1 transition-colors cursor-pointer text-sm"
                        title="View token details"
                      >
                        <span className={`${token.usedMessages >= token.maxMessages ? 'text-red-600' : 'text-stone-600'}`}>
                          {token.usedMessages}/{token.maxMessages}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTokenDetailsClick(token.id)}
                        className="hover:bg-stone-100 rounded px-2 py-1 transition-colors cursor-pointer"
                        title="View token details"
                      >
                        <span className="text-stone-600">
                          {token._count.sessions}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center text-stone-600 text-sm">
                      {formatDate(token.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-center text-stone-600 text-sm">
                      {formatDate(token.expiresAt)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${
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

          {/* Mobile/Tablet view */}
          <div className="lg:hidden space-y-4">
            {tokens.map((token) => (
              <div key={token.id} className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 truncate">{token.label}</h3>
                    {token.company && (
                      <p className="text-sm text-stone-600 truncate">{token.company}</p>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      isExpired(token.expiresAt) || token.usedMessages >= token.maxMessages
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isExpired(token.expiresAt) ? 'Expired' : 
                       token.usedMessages >= token.maxMessages ? 'Used Up' : 'Active'}
                    </span>
                  </div>
                </div>

                <div 
                  className="mb-3 cursor-pointer"
                  onClick={() => copyToClipboard(getFullUrl(token.token), token.id)}
                  title="Click to copy full URL"
                >
                  <div className="flex items-center space-x-2 bg-white rounded border border-stone-200 p-2">
                    <code className="flex-1 text-stone-800 text-sm font-mono truncate">
                      {token.token}
                    </code>
                    <div className="text-stone-600 flex-shrink-0">
                      {copiedTokenId === token.id ? (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-600">Copied</span>
                        </div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <button
                      onClick={() => handleTokenDetailsClick(token.id)}
                      className="w-full text-left hover:bg-stone-100 rounded p-2 transition-colors"
                      title="View token details"
                    >
                      <span className="text-stone-500 block">Messages</span>
                      <span className={`font-medium ${token.usedMessages >= token.maxMessages ? 'text-red-600' : 'text-stone-700'}`}>
                        {token.usedMessages}/{token.maxMessages}
                      </span>
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => handleTokenDetailsClick(token.id)}
                      className="w-full text-left hover:bg-stone-100 rounded p-2 transition-colors"
                      title="View token details"
                    >
                      <span className="text-stone-500 block">Sessions</span>
                      <span className="font-medium text-stone-700">{token._count.sessions}</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Created</span>
                    <span className="font-medium text-stone-700">{formatDate(token.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Expires</span>
                    <span className="font-medium text-stone-700">{formatDate(token.expiresAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-stone-600 text-center sm:text-left">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tokens
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="hidden sm:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded transition-colors ${
                            pageNum === pagination.currentPage
                              ? 'bg-stone-700 text-white'
                              : 'border border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="sm:hidden text-sm text-stone-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

TokensTable.displayName = 'TokensTable'

export default TokensTable