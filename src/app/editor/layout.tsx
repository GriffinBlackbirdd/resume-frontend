import { Suspense } from 'react'

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      {children}
    </Suspense>
  )
}