import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type LoadingContextType = {
  isLoading: boolean
  loadingMessage: string | null
  showLoading: (message?: string) => void
  hideLoading: () => void
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [loadingCount, setLoadingCount] = useState(0) // Track multiple concurrent loading operations

  const showLoading = useCallback((message?: string) => {
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
    setLoadingMessage(message || null)
  }, [])

  const hideLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      if (newCount === 0) {
        setIsLoading(false)
        setLoadingMessage(null)
      }
      return newCount
    })
  }, [])

  // Wrapper function to show loading during async operations
  const withLoading = useCallback(async <T,>(promise: Promise<T>, message?: string): Promise<T> => {
    showLoading(message)
    try {
      const result = await promise
      return result
    } finally {
      hideLoading()
    }
  }, [showLoading, hideLoading])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoading,
        hideLoading,
        withLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
