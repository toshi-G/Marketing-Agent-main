'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">エラーが発生しました</h2>
        <p className="text-muted-foreground max-w-md">
          申し訳ございません。予期しないエラーが発生しました。
          問題が続く場合は、管理者にお問い合わせください。
        </p>
        <Button onClick={reset}>もう一度試す</Button>
      </div>
    </div>
  )
}
