'use client'

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// チャートデータ型定義
interface PerformanceDataPoint {
  date: string;
  workflows: number;
  success_rate: number;
  avg_time: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  timeRange: '7d' | '30d' | '90d';
  className?: string;
}

export function PerformanceChart({ data, timeRange, className = '' }: PerformanceChartProps) {
  // データが空の場合のフォールバック
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            パフォーマンス推移
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>データがありません</p>
              <p className="text-sm">ワークフローを実行してください</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7d') {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  // 成功率のトレンド計算
  const calculateTrend = () => {
    if (data.length < 2) return { trend: 0, direction: 'stable' as const };
    
    const recent = data.slice(-3).reduce((sum, d) => sum + d.success_rate, 0) / Math.min(3, data.length);
    const earlier = data.slice(0, 3).reduce((sum, d) => sum + d.success_rate, 0) / Math.min(3, data.length);
    
    const trend = recent - earlier;
    const direction = trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable';
    
    return { trend: Math.abs(trend), direction };
  };

  const trendInfo = calculateTrend();

  // 平均実行時間を分に変換
  const formatTime = (seconds: number) => {
    return Math.round(seconds / 60);
  };

  // カスタムツールチップをuseCallbackでメモ化
  const CustomTooltip = React.useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            <p className="text-blue-600">
              ワークフロー数: {payload[0]?.value || 0}
            </p>
            <p className="text-green-600">
              成功率: {(payload[1]?.value || 0).toFixed(1)}%
            </p>
            <p className="text-orange-600">
              平均実行時間: {formatTime(payload[2]?.value || 0)}分
            </p>
          </div>
        </div>
      );
    }
    return null;
  }, [timeRange]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            パフォーマンス推移
          </div>
          <div className="flex items-center text-sm">
            {trendInfo.direction === 'up' && (
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{trendInfo.trend.toFixed(1)}%</span>
              </div>
            )}
            {trendInfo.direction === 'down' && (
              <div className="flex items-center text-red-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span>-{trendInfo.trend.toFixed(1)}%</span>
              </div>
            )}
            {trendInfo.direction === 'stable' && (
              <div className="flex items-center text-gray-600">
                <Activity className="w-4 h-4 mr-1" />
                <span>安定</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* ワークフロー数（左軸） */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="workflows"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="ワークフロー数"
              />
              
              {/* 成功率（右軸） */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="success_rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="成功率 (%)"
              />
              
              {/* 平均実行時間（右軸、分単位に変換） */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_time"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                name="実行時間 (秒)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* 凡例説明 */}
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>ワークフロー数（左軸）</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>成功率%（右軸）</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>実行時間秒（右軸）</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}