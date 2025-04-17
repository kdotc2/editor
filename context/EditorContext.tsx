'use client'

import { createContext, useContext, useState } from 'react'

const EditorContext = createContext<{
  showDiff: boolean
  setShowDiff: (val: boolean) => void
  title: string
  setTitle: (val: string) => void
}>({
  showDiff: false,
  setShowDiff: () => {},
  title: 'Untitled Document',
  setTitle: () => {},
})

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [showDiff, setShowDiff] = useState(false)
  const [title, setTitle] = useState('Untitled Document')
  return (
    <EditorContext.Provider value={{ showDiff, setShowDiff, title, setTitle }}>
      {children}
    </EditorContext.Provider>
  )
}

export const useEditor = () => {
  const context = useContext(EditorContext)

  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }

  return context
}
