'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { VisualizationData } from '@/app/lib/api/types';

interface TemplateOptimizationChartProps {
  data: VisualizationData['templateOptimization'];
}

export function TemplateOptimizationChart({ data }: TemplateOptimizationChartProps) {
  if (!data || !data.templates || data.templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>テンプレート最適化結果</CardTitle>
          <CardDescription>テンプレート最適化データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const CustomTooltip = React.useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  // テンプレートの表示用データ変換
  const templateData = data.templates.map(template => ({
    name: template.name.length > 15 ? template.name.slice(0, 15) + '...' : template.name,
    fullName: template.name,
    successRate: (template.successRate * 100).toFixed(1),
    engagementRate: (template.engagementRate * 100).toFixed(1),
    conversionRate: (template.conversionRate * 100).toFixed(1)
  }));

  // 上位5テンプレートのレーダーチャート用データ
  const topTemplates = data.templates.slice(0, 5);
  const radarData = topTemplates.map(template => ({
    template: template.name.length > 10 ? template.name.slice(0, 10) + '...' : template.name,
    成功率: template.successRate * 100,
    エンゲージメント: template.engagementRate * 100,
    コンバージョン: template.conversionRate * 100
  }));

  return (
    <div className="space-y-6">
      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.templates.length}
              </p>
              <p className="text-sm text-gray-500">最適化テンプレート数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(Math.max(...data.templates.map(t => t.successRate)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">最高成功率</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {(data.templates.reduce((sum, t) => sum + t.engagementRate, 0) / data.templates.length * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">平均エンゲージメント率</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {data.templates.filter(t => t.successRate >= 0.8).length}
              </p>
              <p className="text-sm text-gray-500">高性能テンプレート数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* テンプレート比較バーチャート */}
      <Card>
        <CardHeader>
          <CardTitle>テンプレート性能比較</CardTitle>
          <CardDescription>各テンプレートの成功率、エンゲージメント率、コンバージョン率</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{data.fullName}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}%
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="successRate" fill="#3B82F6" name="成功率" />
                <Bar dataKey="engagementRate" fill="#10B981" name="エンゲージメント率" />
                <Bar dataKey="conversionRate" fill="#F59E0B" name="コンバージョン率" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* トップテンプレートレーダーチャート */}
      <Card>
        <CardHeader>
          <CardTitle>トップ5テンプレート総合評価</CardTitle>
          <CardDescription>上位5つのテンプレートの多角的性能評価</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="template" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 8 }}
                />
                <Radar
                  name="成功率"
                  dataKey="成功率"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                />
                <Radar
                  name="エンゲージメント"
                  dataKey="エンゲージメント"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <Radar
                  name="コンバージョン"
                  dataKey="コンバージョン"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 比較テーブル */}
      {data.comparison && data.comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>上位3テンプレート比較</CardTitle>
            <CardDescription>トップ3テンプレートの詳細比較</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.comparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="template1" fill="#3B82F6" name="1位テンプレート" />
                  <Bar dataKey="template2" fill="#10B981" name="2位テンプレート" />
                  <Bar dataKey="template3" fill="#F59E0B" name="3位テンプレート" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>全テンプレート詳細データ</CardTitle>
          <CardDescription>すべてのテンプレートの詳細情報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">テンプレート名</th>
                  <th className="text-center p-2">成功率</th>
                  <th className="text-center p-2">エンゲージメント率</th>
                  <th className="text-center p-2">コンバージョン率</th>
                  <th className="text-center p-2">総合評価</th>
                </tr>
              </thead>
              <tbody>
                {data.templates.map((template, index) => {
                  const avgScore = (template.successRate + template.engagementRate + template.conversionRate) / 3;
                  return (
                    <tr key={template.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{template.name}</td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.successRate >= 0.8 ? 'bg-green-100 text-green-800' :
                          template.successRate >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(template.successRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.engagementRate >= 0.8 ? 'bg-green-100 text-green-800' :
                          template.engagementRate >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(template.engagementRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.conversionRate >= 0.8 ? 'bg-green-100 text-green-800' :
                          template.conversionRate >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(template.conversionRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          avgScore >= 0.8 ? 'bg-green-100 text-green-800' :
                          avgScore >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {avgScore >= 0.8 ? 'A' : avgScore >= 0.6 ? 'B' : 'C'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}