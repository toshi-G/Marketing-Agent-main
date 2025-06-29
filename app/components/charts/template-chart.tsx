'use client'

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart as PieChartIcon, BarChart3, Award, TrendingUp } from 'lucide-react';

// テンプレートデータ型定義
interface TemplateData {
  id: string;
  name: string;
  performance: number;
  usage: number;
}

interface TemplateChartProps {
  data: TemplateData[];
  chartType?: 'bar' | 'pie';
  className?: string;
}

export function TemplateChart({ data, chartType = 'bar', className = '' }: TemplateChartProps) {
  // データが空の場合のフォールバック
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            テンプレートパフォーマンス
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>テンプレートデータがありません</p>
              <p className="text-sm">テンプレートを作成してください</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 棒グラフ用データの準備
  const barData = data.slice(0, 6).map(template => ({
    name: template.name.length > 10 ? template.name.substring(0, 10) + '...' : template.name,
    fullName: template.name,
    performance: template.performance,
    usage: template.usage,
  }));

  // 円グラフ用データの準備
  const pieData = data.slice(0, 5).map(template => ({
    name: template.name.length > 15 ? template.name.substring(0, 15) + '...' : template.name,
    fullName: template.name,
    value: template.usage,
    performance: template.performance,
  }));

  // 円グラフの色設定
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // カスタムツールチップ（棒グラフ用）
  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data?.fullName}</p>
          <div className="space-y-1">
            <p className="text-blue-600">
              パフォーマンス: {payload.find((p: any) => p.dataKey === 'performance')?.value?.toFixed(1)}%
            </p>
            <p className="text-green-600">
              使用回数: {payload.find((p: any) => p.dataKey === 'usage')?.value}回
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // カスタムツールチップ（円グラフ用）
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data?.fullName}</p>
          <div className="space-y-1">
            <p className="text-blue-600">
              使用回数: {data?.value}回
            </p>
            <p className="text-green-600">
              パフォーマンス: {data?.performance?.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // 統計情報の計算
  const totalUsage = data.reduce((sum, template) => sum + template.usage, 0);
  const avgPerformance = data.reduce((sum, template) => sum + template.performance, 0) / data.length;
  const topTemplate = data.reduce((max, template) => 
    template.performance > max.performance ? template : max
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {chartType === 'bar' ? (
              <BarChart3 className="w-5 h-5 mr-2" />
            ) : (
              <PieChartIcon className="w-5 h-5 mr-2" />
            )}
            テンプレートパフォーマンス
          </div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>平均 {avgPerformance.toFixed(1)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartType === 'bar' ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip content={<BarTooltip />} />
                <Legend />
                
                <Bar
                  yAxisId="left"
                  dataKey="performance"
                  fill="#3b82f6"
                  name="パフォーマンス (%)"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="usage"
                  fill="#10b981"
                  name="使用回数"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 統計情報 */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-medium">総使用回数</p>
            <p className="text-2xl font-bold text-blue-700">{totalUsage}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-green-600 font-medium">平均パフォーマンス</p>
            <p className="text-2xl font-bold text-green-700">{avgPerformance.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg col-span-2 lg:col-span-1">
            <p className="text-orange-600 font-medium">トップテンプレート</p>
            <p className="font-bold text-orange-700 truncate">{topTemplate.name}</p>
            <p className="text-sm text-orange-600">{topTemplate.performance.toFixed(1)}%</p>
          </div>
        </div>

        {/* 凡例（棒グラフの場合） */}
        {chartType === 'bar' && (
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>パフォーマンス%（左軸）</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>使用回数（右軸）</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}