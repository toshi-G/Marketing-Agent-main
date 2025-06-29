'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Download, 
  Copy, 
  Share2, 
  Edit, 
  FileText,
  Instagram,
  Twitter,
  Mail,
  Globe,
  Zap,
  Heart,
  MessageCircle,
  Bookmark,
  ExternalLink
} from 'lucide-react';

// コンテンツタイプの型定義
export interface ContentData {
  id: string;
  type: 'landing_page' | 'social_post' | 'email_sequence' | 'hook' | 'template';
  title: string;
  content: string | any;
  platform?: 'instagram' | 'twitter' | 'facebook' | 'linkedin';
  metadata?: {
    wordCount?: number;
    characterCount?: number;
    estimatedReach?: number;
    engagementScore?: number;
    tone?: string;
    audience?: string;
  };
  createdAt: string;
  agentType: string;
}

interface ContentPreviewProps {
  content: ContentData;
  className?: string;
  showActions?: boolean;
  onEdit?: (content: ContentData) => void;
  onCopy?: (content: ContentData) => void;
  onDownload?: (content: ContentData) => void;
  onShare?: (content: ContentData) => void;
}

export function ContentPreview({ 
  content, 
  className = '',
  showActions = true,
  onEdit,
  onCopy,
  onDownload,
  onShare 
}: ContentPreviewProps) {
  const [activeView, setActiveView] = useState<'preview' | 'raw'>('preview');

  // プラットフォームアイコンの取得
  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'twitter': return Twitter;
      case 'facebook': return Globe;
      case 'linkedin': return Globe;
      default: return FileText;
    }
  };

  // プラットフォーム色の取得
  const getPlatformColor = (platform?: string) => {
    switch (platform) {
      case 'instagram': return 'text-pink-600 bg-pink-100';
      case 'twitter': return 'text-blue-600 bg-blue-100';
      case 'facebook': return 'text-blue-700 bg-blue-100';
      case 'linkedin': return 'text-blue-800 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // コンテンツタイプの日本語名
  const getContentTypeName = (type: string) => {
    switch (type) {
      case 'landing_page': return 'ランディングページ';
      case 'social_post': return 'SNS投稿';
      case 'email_sequence': return 'メールシーケンス';
      case 'hook': return 'フック';
      case 'template': return 'テンプレート';
      default: return type;
    }
  };

  // ランディングページのプレビュー
  const renderLandingPagePreview = (data: any) => {
    return (
      <div className="space-y-6">
        {/* ヘッダーセクション */}
        {data.header && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h1 className="text-3xl font-bold mb-2">{data.header.headline}</h1>
            {data.header.subheadline && (
              <p className="text-lg opacity-90">{data.header.subheadline}</p>
            )}
            {data.header.cta && (
              <Button className="mt-4 bg-white text-blue-600 hover:bg-gray-100">
                {data.header.cta}
              </Button>
            )}
          </div>
        )}

        {/* 問題・解決セクション */}
        {data.problem && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <h3 className="font-bold text-red-800 mb-2">解決する問題</h3>
            <p className="text-red-700">{data.problem}</p>
          </div>
        )}

        {data.solution && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <h3 className="font-bold text-green-800 mb-2">提供する解決策</h3>
            <p className="text-green-700">{data.solution}</p>
          </div>
        )}

        {/* 特徴・メリット */}
        {data.features && data.features.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.features.map((feature: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {data.cta && (
          <div className="text-center bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">{data.cta.headline}</h3>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              {data.cta.buttonText}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // SNS投稿のプレビュー
  const renderSocialPostPreview = (data: any) => {
    const PlatformIcon = getPlatformIcon(content.platform);
    
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white border rounded-lg shadow-sm">
          {/* ヘッダー */}
          <div className="flex items-center p-4 border-b">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <PlatformIcon className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="font-semibold">Your Brand</p>
              <p className="text-sm text-gray-500">今</p>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-4">
            <p className="whitespace-pre-wrap">{data.text || data.content || content.content}</p>
            
            {data.hashtags && data.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {data.hashtags.map((tag: string, index: number) => (
                  <span key={index} className="text-blue-600 text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Bookmark className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // メールシーケンスのプレビュー
  const renderEmailSequencePreview = (data: any) => {
    const emails = Array.isArray(data) ? data : [data];
    
    return (
      <div className="space-y-4">
        {emails.map((email: any, index: number) => (
          <div key={index} className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">メール #{index + 1}</h4>
                <span className="text-sm text-gray-500">
                  送信タイミング: {email.timing || `${index + 1}日後`}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600">件名:</p>
                <p className="font-semibold">{email.subject}</p>
              </div>
              <div className="bg-white border rounded p-3">
                <p className="whitespace-pre-wrap">{email.body || email.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // フックのプレビュー
  const renderHookPreview = (data: any) => {
    const hooks = Array.isArray(data) ? data : [data];
    
    return (
      <div className="grid gap-3">
        {hooks.map((hook: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-lg mb-2">
                  {hook.text || hook.content || (typeof hook === 'string' ? hook : '')}
                </p>
                {hook.type && (
                  <Badge variant="outline" className="text-xs">
                    {hook.type === 'curiosity' ? '好奇心' :
                     hook.type === 'urgency' ? '緊急性' :
                     hook.type === 'social_proof' ? '社会的証明' :
                     hook.type === 'benefit' ? 'ベネフィット' : hook.type}
                  </Badge>
                )}
              </div>
              {hook.engagementScore && (
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-600">期待エンゲージメント</p>
                  <p className="font-bold text-green-600">{hook.engagementScore}%</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // メインレンダリング関数
  const renderPreview = () => {
    try {
      const data = typeof content.content === 'string' 
        ? JSON.parse(content.content) 
        : content.content;

      switch (content.type) {
        case 'landing_page':
          return renderLandingPagePreview(data);
        case 'social_post':
          return renderSocialPostPreview(data);
        case 'email_sequence':
          return renderEmailSequencePreview(data);
        case 'hook':
          return renderHookPreview(data);
        default:
          return (
            <div className="p-4 bg-gray-50 rounded">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          );
      }
    } catch (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">コンテンツの表示でエラーが発生しました</p>
          <p className="text-sm text-red-600 mt-1">Raw data: {String(content.content)}</p>
        </div>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="flex items-center">
              {content.platform && (
                <div className={`p-2 rounded-full mr-3 ${getPlatformColor(content.platform)}`}>
                  {React.createElement(getPlatformIcon(content.platform), { className: 'w-4 h-4' })}
                </div>
              )}
              {content.title}
            </CardTitle>
            <Badge variant="outline">
              {getContentTypeName(content.type)}
            </Badge>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView(activeView === 'preview' ? 'raw' : 'preview')}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              {onCopy && (
                <Button variant="ghost" size="sm" onClick={() => onCopy(content)}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
              
              {onDownload && (
                <Button variant="ghost" size="sm" onClick={() => onDownload(content)}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
              
              {onShare && (
                <Button variant="ghost" size="sm" onClick={() => onShare(content)}>
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
              
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(content)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* メタデータ */}
        {content.metadata && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {content.metadata.wordCount && (
              <span>語数: {content.metadata.wordCount}</span>
            )}
            {content.metadata.characterCount && (
              <span>文字数: {content.metadata.characterCount}</span>
            )}
            {content.metadata.estimatedReach && (
              <span>推定リーチ: {content.metadata.estimatedReach.toLocaleString()}</span>
            )}
            {content.metadata.engagementScore && (
              <span>エンゲージメント予測: {content.metadata.engagementScore}%</span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'preview' | 'raw')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">プレビュー</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(
                  typeof content.content === 'string' 
                    ? JSON.parse(content.content) 
                    : content.content, 
                  null, 
                  2
                )}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}