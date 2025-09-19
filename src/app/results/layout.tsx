import { Suspense } from 'react'

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading Results...</div>}>
      {children}
    </Suspense>
  )
}