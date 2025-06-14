'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { getWorkflowClient } from '@/lib/api/client'
import { StartWorkflowRequest } from '@/lib/api/types'

interface CreateWorkflowModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateWorkflowModal({ open, onClose, onSuccess }: CreateWorkflowModalProps) {
  const [formData, setFormData] = useState<StartWorkflowRequest>({
    name: '',
    initialInput: {
      targetGenre: '',
      keywords: []
    }
  })
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('ワークフロー名を入力してください')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const client = getWorkflowClient()
      
      // キーワードを配列に変換
      const keywordArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
      
      await client.startWorkflow({
        ...formData,
        initialInput: {
          ...formData.initialInput,
          keywords: keywordArray
        }
      })
      
      // 成功時の処理
      onSuccess()
      onClose()
      
      // フォームをリセット
      setFormData({
        name: '',
        initialInput: {
          targetGenre: '',
          keywords: []
        }
      })
      setKeywords('')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>新規ワークフロー作成</ModalTitle>
        </ModalHeader>
        
        <ModalBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ワークフロー名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: 2024年6月 美容ジャンル分析"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="genre">対象ジャンル（任意）</Label>
            <Input
              id="genre"
              value={formData.initialInput?.targetGenre || ''}
              onChange={(e) => setFormData({
                ...formData,
                initialInput: {
                  ...formData.initialInput!,
                  targetGenre: e.target.value
                }
              })}
              placeholder="例: 美容、健康、ビジネス"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">関連キーワード（任意）</Label>
            <Textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="カンマ区切りで入力（例: ダイエット, 美容, スキンケア）"
              rows={3}
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                作成中...
              </>
            ) : (
              'ワークフローを開始'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
