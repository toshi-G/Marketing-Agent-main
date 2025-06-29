'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  BookOpen,
  TrendingUp,
  Copy,
  Share2,
  Grid3x3,
  List,
  SortAsc,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

// テンプレートの型定義
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'landing_page' | 'social_post' | 'email' | 'hook' | 'funnel' | 'copy';
  content: any;
  performance: {
    successRate: number;
    usageCount: number;
    averageEngagement: number;
    conversionRate?: number;
    lastUsed?: string;
  };
  tags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: {
    industry?: string;
    targetAudience?: string;
    platform?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime?: number;
  };
}

interface TemplateStats {
  total: number;
  categories: Record<string, number>;
  averageSuccess: number;
  topPerforming: Template[];
  recentlyUsed: Template[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'performance' | 'usage'>('performance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // テンプレートデータを取得
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // フォールバックデータ
      setTemplates([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // フィルタリングとソート
  const filteredAndSortedTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => template.tags.includes(tag));
      
      const matchesFavorites = !showOnlyFavorites || template.isFavorite;
      
      return matchesSearch && matchesCategory && matchesTags && matchesFavorites;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'performance':
          return b.performance.successRate - a.performance.successRate;
        case 'usage':
          return b.performance.usageCount - a.performance.usageCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedTags, sortBy, showOnlyFavorites]);

  // 利用可能なタグを取得
  const availableTags = React.useMemo(() => {
    const allTags = templates.flatMap(template => template.tags);
    return [...new Set(allTags)].sort();
  }, [templates]);

  // カテゴリー名の日本語化
  const getCategoryName = (category: string) => {
    const names = {
      landing_page: 'ランディングページ',
      social_post: 'SNS投稿',
      email: 'メール',
      hook: 'フック',
      funnel: 'ファネル',
      copy: 'コピー'
    };
    return names[category as keyof typeof names] || category;
  };

  // パフォーマンスバッジの色
  const getPerformanceBadgeColor = (successRate: number) => {
    if (successRate >= 80) return 'bg-green-100 text-green-800';
    if (successRate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // テンプレートアクション
  const handleUseTemplate = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // 使用カウントを更新
        fetchTemplates();
        alert('テンプレートを適用しました');
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  const handleToggleFavorite = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !template.isFavorite })
      });
      
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template.content, null, 2));
      alert('テンプレートがクリップボードにコピーされました');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm('このテンプレートを削除しますか？')) return;
    
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (loading) {
    return (
      <div className="container-responsive py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900">テンプレートライブラリ</h1>
          <p className="text-gray-600">
            {filteredAndSortedTemplates.length} 件のテンプレート（全 {templates.length} 件中）
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={fetchTemplates} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総テンプレート数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均成功率</p>
                  <p className="text-2xl font-bold">{stats.averageSuccess.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">トップパフォーマー</p>
                  <p className="text-2xl font-bold">{stats.topPerforming.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">最近使用</p>
                  <p className="text-2xl font-bold">{stats.recentlyUsed.length}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルターとサーチ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="テンプレートを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">全カテゴリー</option>
              <option value="landing_page">ランディングページ</option>
              <option value="social_post">SNS投稿</option>
              <option value="email">メール</option>
              <option value="hook">フック</option>
              <option value="funnel">ファネル</option>
              <option value="copy">コピー</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="performance">パフォーマンス順</option>
              <option value="usage">使用回数順</option>
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={showOnlyFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Star className="w-4 h-4 mr-2" />
            お気に入りのみ
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

          {/* タグフィルター */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 5).map(tag => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className="text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* テンプレートグリッド/リスト */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">テンプレートが見つかりません</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
              ? 'フィルター条件を変更してみてください'
              : 'テンプレートライブラリが空です'
            }
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            最初のテンプレートを作成
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
          : 'space-y-4'
        }>
          {filteredAndSortedTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(template)}
                        className="p-1"
                      >
                        <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">
                        {getCategoryName(template.category)}
                      </Badge>
                      <Badge className={getPerformanceBadgeColor(template.performance.successRate)}>
                        {template.performance.successRate.toFixed(1)}% 成功率
                      </Badge>
                      {template.performance.usageCount > 0 && (
                        <Badge variant="outline">
                          {template.performance.usageCount} 回使用
                        </Badge>
                      )}
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{template.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">エンゲージメント</p>
                      <p className="font-medium">{template.performance.averageEngagement.toFixed(1)}%</p>
                    </div>
                    {template.performance.conversionRate && (
                      <div>
                        <p className="text-gray-600">コンバージョン</p>
                        <p className="font-medium">{template.performance.conversionRate.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      使用
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Edit template:', template.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}