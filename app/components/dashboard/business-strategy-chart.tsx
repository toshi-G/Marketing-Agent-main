'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { VisualizationData } from '@/app/lib/api/types';

interface BusinessStrategyChartProps {
  data: VisualizationData['businessStrategy'];
}

export function BusinessStrategyChart({ data }: BusinessStrategyChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ビジネス戦略・ROI予測</CardTitle>
          <CardDescription>ビジネス戦略データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = React.useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey === 'price' || entry.dataKey === 'amount' 
                  ? formatCurrency(entry.value)
                  : entry.dataKey === 'profitMargin' || entry.dataKey === 'rate'
                  ? `${(entry.value * 100).toFixed(1)}%`
                  : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  return (
    <div className="space-y-6">
      {/* ROI概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.roiProjection?.monthlyTargetLeads || 0}
              </p>
              <p className="text-sm text-gray-500">月間目標リード数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.roiProjection?.revenueBreakdown.find(r => r.category === 'Revenue')?.amount || 0)}
              </p>
              <p className="text-sm text-gray-500">月間売上予測</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(data.roiProjection?.revenueBreakdown.find(r => r.category === 'Net Profit')?.amount || 0)}
              </p>
              <p className="text-sm text-gray-500">純利益予測</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {data.productLineup?.length || 0}
              </p>
              <p className="text-sm text-gray-500">商品ラインナップ数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 商品ラインナップ分析 */}
      {data.productLineup && data.productLineup.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>商品価格と利益率</CardTitle>
              <CardDescription>各商品の価格設定と利益率の関係</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.productLineup} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="price" fill="#3B82F6" name="価格" />
                    <Bar yAxisId="right" dataKey="profitMargin" fill="#10B981" name="利益率" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商品別売上構成</CardTitle>
              <CardDescription>予想売上の商品別構成比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.productLineup.map(product => ({
                        name: product.name,
                        value: product.price * product.profitMargin
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.productLineup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), '予想利益']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* コンバージョンファネル */}
      {data.roiProjection?.conversionRates && data.roiProjection.conversionRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>コンバージョンファネル</CardTitle>
            <CardDescription>各段階のコンバージョン率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.roiProjection.conversionRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="コンバージョン率"
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 収支分析 */}
      {data.roiProjection?.revenueBreakdown && data.roiProjection.revenueBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>収支分析</CardTitle>
            <CardDescription>売上・コスト・利益の詳細分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roiProjection.revenueBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Amount']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="amount" 
                    fill="#3B82F6"
                    name="金額"
                  >
                    {data.roiProjection.revenueBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.category === 'Revenue' ? '#10B981' :
                          entry.category === 'Net Profit' ? '#3B82F6' :
                          '#EF4444'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細データテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>詳細データ</CardTitle>
          <CardDescription>すべての戦略データの詳細表示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 商品ラインナップ詳細 */}
            {data.productLineup && data.productLineup.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">商品ラインナップ詳細</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">商品名</th>
                        <th className="text-center p-2">価格</th>
                        <th className="text-center p-2">利益率</th>
                        <th className="text-center p-2">予想利益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.productLineup.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{product.name}</td>
                          <td className="text-center p-2">{formatCurrency(product.price)}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.profitMargin >= 0.5 ? 'bg-green-100 text-green-800' :
                              product.profitMargin >= 0.3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(product.profitMargin * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center p-2">
                            {formatCurrency(product.price * product.profitMargin)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 収支詳細 */}
            {data.roiProjection?.revenueBreakdown && (
              <div>
                <h4 className="font-medium mb-3">月間収支詳細</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">項目</th>
                        <th className="text-center p-2">金額</th>
                        <th className="text-center p-2">種別</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.roiProjection.revenueBreakdown.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.category}</td>
                          <td className="text-center p-2">{formatCurrency(item.amount)}</td>
                          <td className="text-center p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.category === 'Revenue' ? 'bg-green-100 text-green-800' :
                              item.category === 'Net Profit' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.category === 'Revenue' ? '売上' :
                               item.category === 'Net Profit' ? '利益' : 'コスト'}
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