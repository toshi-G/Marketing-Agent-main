'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { VisualizationData } from '@/app/lib/api/types';

interface ContentAnalysisChartProps {
  data: VisualizationData['contentAnalysis'];
}

export function ContentAnalysisChart({ data }: ContentAnalysisChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>コンテンツ分析結果</CardTitle>
          <CardDescription>コンテンツ分析データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'percentage' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 概要統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.platformStats?.reduce((sum, platform) => sum + platform.count, 0) || 0}
              </p>
              <p className="text-sm text-gray-500">総コンテンツ数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {data.platformStats?.length || 0}
              </p>
              <p className="text-sm text-gray-500">分析プラットフォーム数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {data.structurePatterns?.length || 0}
              </p>
              <p className="text-sm text-gray-500">構造パターン数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* プラットフォーム別統計 */}
      {data.platformStats && data.platformStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>プラットフォーム別コンテンツ統計</CardTitle>
            <CardDescription>各プラットフォームのコンテンツ数とエンゲージメント率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.platformStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="コンテンツ数" />
                  <Bar yAxisId="right" dataKey="avgEngagement" fill="#10B981" name="平均エンゲージメント率" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 感情分布 */}
      {data.emotionDistribution && data.emotionDistribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>感情分布（パイチャート）</CardTitle>
              <CardDescription>コンテンツの感情タイプ別分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.emotionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>感情分布（詳細）</CardTitle>
              <CardDescription>数値とパーセンテージの詳細</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.emotionDistribution.map((emotion, index) => (
                  <div key={emotion.emotion} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium capitalize">{emotion.emotion}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{emotion.count}</p>
                      <p className="text-sm text-gray-500">{emotion.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 構造パターン分析 */}
      {data.structurePatterns && data.structurePatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>構造パターン分析</CardTitle>
            <CardDescription>各構造パターンの成功率と使用頻度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.structurePatterns} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="pattern" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="成功率"
                  />
                  <Bar yAxisId="right" dataKey="usage" fill="#10B981" name="使用数" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>詳細データテーブル</CardTitle>
          <CardDescription>すべての分析データの詳細表示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* プラットフォーム詳細 */}
            {data.platformStats && data.platformStats.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">プラットフォーム別統計</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">プラットフォーム</th>
                        <th className="text-center p-2">コンテンツ数</th>
                        <th className="text-center p-2">平均エンゲージメント率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.platformStats.map((platform, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{platform.platform}</td>
                          <td className="text-center p-2">{platform.count}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              platform.avgEngagement >= 5 ? 'bg-green-100 text-green-800' :
                              platform.avgEngagement >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {platform.avgEngagement.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 構造パターン詳細 */}
            {data.structurePatterns && data.structurePatterns.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">構造パターン詳細</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">パターン</th>
                        <th className="text-center p-2">成功率</th>
                        <th className="text-center p-2">使用回数</th>
                        <th className="text-center p-2">効果レベル</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.structurePatterns.map((pattern, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{pattern.pattern}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              pattern.successRate >= 80 ? 'bg-green-100 text-green-800' :
                              pattern.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pattern.successRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center p-2">{pattern.usage}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              pattern.successRate >= 80 ? 'bg-green-100 text-green-800' :
                              pattern.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pattern.successRate >= 80 ? '高' : pattern.successRate >= 60 ? '中' : '低'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}