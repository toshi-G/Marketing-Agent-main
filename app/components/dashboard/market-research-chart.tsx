'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { VisualizationData } from '@/app/lib/api/types';

interface MarketResearchChartProps {
  data: VisualizationData['marketResearch'];
}

export function MarketResearchChart({ data }: MarketResearchChartProps) {
  if (!data || !data.genres || data.genres.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>市場調査結果</CardTitle>
          <CardDescription>市場調査データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // バーチャート用のデータ変換
  const barChartData = data.genres.map(genre => ({
    name: genre.name.length > 10 ? genre.name.slice(0, 10) + '...' : genre.name,
    fullName: genre.name,
    trendScore: genre.trendScore,
    profitabilityScore: genre.profitabilityScore,
    marketSize: genre.marketSize === 'large' ? 3 : genre.marketSize === 'medium' ? 2 : 1
  }));

  // レーダーチャート用のデータ変換（上位5ジャンル）
  const radarData = data.genres.slice(0, 5).map(genre => ({
    genre: genre.name.length > 8 ? genre.name.slice(0, 8) + '...' : genre.name,
    トレンド: genre.trendScore * 10, // 0-100スケールに変換
    収益性: genre.profitabilityScore * 10,
    市場規模: genre.marketSize === 'large' ? 90 : genre.marketSize === 'medium' ? 60 : 30,
    競合度: genre.competitionLevel === 'low' ? 90 : genre.competitionLevel === 'medium' ? 60 : 30
  }));

  const CustomTooltip = React.useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'marketSize' && ' (1:Small, 2:Medium, 3:Large)'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <Card>
        <CardHeader>
          <CardTitle>市場調査サマリー</CardTitle>
          <CardDescription>
            {data.genres.length}個のジャンルを分析しました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{data.summary}</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.max(...data.genres.map(g => g.trendScore)).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">最高トレンドスコア</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...data.genres.map(g => g.profitabilityScore)).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">最高収益性スコア</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {data.genres.filter(g => g.competitionLevel === 'low').length}
              </p>
              <p className="text-xs text-gray-500">低競合ジャンル数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {data.genres.filter(g => g.marketSize === 'large').length}
              </p>
              <p className="text-xs text-gray-500">大規模市場数</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* バーチャート */}
      <Card>
        <CardHeader>
          <CardTitle>ジャンル別スコア比較</CardTitle>
          <CardDescription>トレンドスコアと収益性スコアの比較</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="trendScore" fill="#3B82F6" name="トレンドスコア" />
                <Bar dataKey="profitabilityScore" fill="#10B981" name="収益性スコア" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* レーダーチャート */}
      <Card>
        <CardHeader>
          <CardTitle>総合評価レーダーチャート</CardTitle>
          <CardDescription>上位5ジャンルの多角的評価</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="genre" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 8 }}
                />
                <Radar
                  name="トレンド"
                  dataKey="トレンド"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                />
                <Radar
                  name="収益性"
                  dataKey="収益性"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <Radar
                  name="市場規模"
                  dataKey="市場規模"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                />
                <Radar
                  name="競合度（逆転）"
                  dataKey="競合度"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.1}
                />
                <Legend />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 詳細テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>詳細データ</CardTitle>
          <CardDescription>全ジャンルの詳細情報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ジャンル</th>
                  <th className="text-center p-2">トレンド</th>
                  <th className="text-center p-2">収益性</th>
                  <th className="text-center p-2">競合レベル</th>
                  <th className="text-center p-2">市場規模</th>
                </tr>
              </thead>
              <tbody>
                {data.genres.map((genre, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{genre.name}</td>
                    <td className="text-center p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        genre.trendScore >= 8 ? 'bg-green-100 text-green-800' :
                        genre.trendScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {genre.trendScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        genre.profitabilityScore >= 8 ? 'bg-green-100 text-green-800' :
                        genre.profitabilityScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {genre.profitabilityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        genre.competitionLevel === 'low' ? 'bg-green-100 text-green-800' :
                        genre.competitionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {genre.competitionLevel}
                      </span>
                    </td>
                    <td className="text-center p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        genre.marketSize === 'large' ? 'bg-blue-100 text-blue-800' :
                        genre.marketSize === 'medium' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {genre.marketSize}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}