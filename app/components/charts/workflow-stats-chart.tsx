'use client'

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';

// ワークフロー統計データ型定義
interface WorkflowStatsData {
  date: string;
  total: number;
  completed: number;
  failed: number;
  running: number;
  avgTime: number;
}

interface WorkflowStatsChartProps {
  data: WorkflowStatsData[];
  chartType?: 'area' | 'bar';
  className?: string;
}

export function WorkflowStatsChart({ data, chartType = 'area', className = '' }: WorkflowStatsChartProps) {
  // データが空の場合のフォールバック
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            ワークフロー統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>統計データがありません</p>
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
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value}
                {entry.dataKey === 'avgTime' && '秒'}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // 統計情報の計算
  const totalWorkflows = data.reduce((sum, d) => sum + d.total, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const totalFailed = data.reduce((sum, d) => sum + d.failed, 0);
  const avgSuccessRate = totalWorkflows > 0 ? (totalCompleted / totalWorkflows) * 100 : 0;
  const avgExecutionTime = data.reduce((sum, d) => sum + d.avgTime, 0) / data.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            ワークフロー統計
          </div>
          <div className="flex items-center text-sm text-blue-600">
            <Zap className="w-4 h-4 mr-1" />
            <span>{avgSuccessRate.toFixed(1)}% 成功率</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartType === 'area' ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="完了"
                />
                <Area
                  type="monotone"
                  dataKey="running"
                  stackId="1"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorRunning)"
                  name="実行中"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  name="失敗"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar
                  dataKey="completed"
                  stackId="a"
                  fill="#10b981"
                  name="完了"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="running"
                  stackId="a"
                  fill="#f59e0b"
                  name="実行中"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  stackId="a"
                  fill="#ef4444"
                  name="失敗"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 統計サマリー */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-blue-600 font-medium">総実行数</p>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalWorkflows}</p>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-green-600 font-medium">成功</p>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{totalCompleted}</p>
            <p className="text-xs text-green-600">{avgSuccessRate.toFixed(1)}%</p>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-600 font-medium">失敗</p>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">{totalFailed}</p>
            <p className="text-xs text-red-600">
              {totalWorkflows > 0 ? ((totalFailed / totalWorkflows) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-orange-600 font-medium">平均実行時間</p>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {Math.round(avgExecutionTime / 60)}分
            </p>
            <p className="text-xs text-orange-600">{Math.round(avgExecutionTime)}秒</p>
          </div>
        </div>

        {/* パフォーマンス指標 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">パフォーマンス指標</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">成功率</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(avgSuccessRate, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{avgSuccessRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">効率性</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((1800 - avgExecutionTime) / 1800 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.min((1800 - avgExecutionTime) / 1800 * 100, 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}