'use client'

import React, { useState, useEffect } from 'react';
import { ContentPreview, ContentData } from './content-preview';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Download, 
  RefreshCw,
  FileText,
  Instagram,
  Twitter,
  Mail,
  Zap
} from 'lucide-react';

interface ContentGalleryProps {
  workflowId?: string;
  agentType?: string;
  contentTypes?: string[];
  className?: string;
}

export function ContentGallery({ 
  workflowId, 
  agentType, 
  contentTypes,
  className = '' 
}: ContentGalleryProps) {
  const [contents, setContents] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // コンテンツデータを取得
  const fetchContents = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (workflowId) params.append('workflowId', workflowId);
      if (agentType) params.append('agentType', agentType);
      if (contentTypes?.length) params.append('types', contentTypes.join(','));
      
      const response = await fetch(`/api/content/gallery?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contents');
      }
      
      const data = await response.json();
      setContents(data.contents || []);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      // フォールバックデータ
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [workflowId, agentType, contentTypes]);

  // フィルタリング
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(content.content).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || content.type === selectedType;
    
    const matchesPlatform = selectedPlatform === 'all' || content.platform === selectedPlatform;
    
    return matchesSearch && matchesType && matchesPlatform;
  });

  // ソート
  const sortedContents = [...filteredContents].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // コンテンツタイプの統計
  const contentStats = contents.reduce((acc, content) => {
    acc[content.type] = (acc[content.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // アクションハンドラー
  const handleCopy = async (content: ContentData) => {
    try {
      const textContent = typeof content.content === 'string' 
        ? content.content 
        : JSON.stringify(content.content, null, 2);
      
      await navigator.clipboard.writeText(textContent);
      alert('コンテンツがクリップボードにコピーされました');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownload = (content: ContentData) => {
    const textContent = typeof content.content === 'string' 
      ? content.content 
      : JSON.stringify(content.content, null, 2);
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShare = async (content: ContentData) => {
    try {
      await navigator.share({
        title: content.title,
        text: typeof content.content === 'string' ? content.content : content.title,
        url: window.location.href,
      });
    } catch (error) {
      // フォールバック: URLをクリップボードにコピー
      await navigator.clipboard.writeText(window.location.href);
      alert('URLがクリップボードにコピーされました');
    }
  };

  const handleBulkDownload = () => {
    const zip = filteredContents.map(content => ({
      name: `${content.title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`,
      content: typeof content.content === 'string' 
        ? content.content 
        : JSON.stringify(content.content, null, 2)
    }));

    // 簡単なテキストファイルとしてダウンロード
    const allContent = zip.map(item => `=== ${item.name} ===\n${item.content}\n\n`).join('');
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contents-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダーとコントロール */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">生成コンテンツ</h2>
          <p className="text-gray-600">
            {filteredContents.length} 件のコンテンツ（全 {contents.length} 件中）
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={fetchContents} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleBulkDownload} 
            variant="outline" 
            size="sm"
            disabled={filteredContents.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            一括ダウンロード
          </Button>
          
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      {Object.keys(contentStats).length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(contentStats).map(([type, count]) => {
            const icon = type === 'social_post' ? Instagram :
                        type === 'email_sequence' ? Mail :
                        type === 'hook' ? Zap : FileText;
            
            return (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {type === 'landing_page' ? 'LP' :
                         type === 'social_post' ? 'SNS' :
                         type === 'email_sequence' ? 'メール' :
                         type === 'hook' ? 'フック' : type}
                      </p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    {React.createElement(icon, { className: 'w-8 h-8 text-blue-500' })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* フィルターとサーチ */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="コンテンツを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">全てのタイプ</option>
            <option value="landing_page">ランディングページ</option>
            <option value="social_post">SNS投稿</option>
            <option value="email_sequence">メールシーケンス</option>
            <option value="hook">フック</option>
            <option value="template">テンプレート</option>
          </select>
          
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">全てのプラットフォーム</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="title">タイトル順</option>
          </select>
        </div>
      </div>

      {/* コンテンツグリッド/リスト */}
      {sortedContents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">コンテンツが見つかりません</h3>
          <p className="text-gray-600">
            {searchTerm || selectedType !== 'all' || selectedPlatform !== 'all'
              ? 'フィルター条件を変更してみてください'
              : 'ワークフローを実行してコンテンツを生成してください'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
          : 'space-y-6'
        }>
          {sortedContents.map((content) => (
            <ContentPreview
              key={content.id}
              content={content}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onShare={handleShare}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}