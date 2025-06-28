'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HealthMetric {
  id: number;
  metric_date: string;
  metric_type: string;
  value_numeric: number;
  value_text?: string;
  unit: string;
}

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metric_type: '',
    metric_date: new Date().toISOString().split('T')[0],
    value_numeric: '',
    value_text: '',
    unit: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchMetrics(token);
  }, [router]);

  const fetchMetrics = async (token: string) => {
    try {
      const response = await fetch('/api/health-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      toast.error('Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/health-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMetric,
          value_numeric: parseFloat(newMetric.value_numeric)
        })
      });

      const data = await response.json();
      if (data.success) {
        setMetrics([...metrics, data.metric]);
        setNewMetric({
          metric_type: '',
          metric_date: new Date().toISOString().split('T')[0],
          value_numeric: '',
          value_text: '',
          unit: ''
        });
        setShowDialog(false);
        toast.success('Health metric added successfully!');
      }
    } catch (error) {
      toast.error('Failed to add health metric');
    }
  };

  const handleMetricTypeChange = (type: string) => {
    setNewMetric({ ...newMetric, metric_type: type });
    
    // Set default units based on metric type
    switch (type) {
      case 'weight':
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: 'kg' }));
        break;
      case 'blood_pressure':
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: 'mmHg' }));
        break;
      case 'heart_rate':
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: 'bpm' }));
        break;
      case 'temperature':
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: '°C' }));
        break;
      case 'glucose':
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: 'mg/dL' }));
        break;
      default:
        setNewMetric(prev => ({ ...prev, metric_type: type, unit: '' }));
    }
  };

  // Group metrics by type for charts
  const metricTypes = [...new Set(metrics.map(m => m.metric_type))];
  
  const getChartData = (type: string) => {
    return metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime())
      .map(m => ({
        date: format(new Date(m.metric_date), 'MMM dd'),
        value: m.value_numeric,
        fullDate: m.metric_date
      }));
  };

  const getLatestValue = (type: string) => {
    const typeMetrics = metrics.filter(m => m.metric_type === type);
    if (typeMetrics.length === 0) return null;
    
    const latest = typeMetrics.sort((a, b) => 
      new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
    )[0];
    
    return latest;
  };

  const getTrend = (type: string) => {
    const typeMetrics = metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime());
    
    if (typeMetrics.length < 2) return 'stable';
    
    const recent = typeMetrics.slice(-2);
    const diff = recent[1].value_numeric - recent[0].value_numeric;
    
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading health metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Health Metrics</h1>
                  <p className="text-sm text-gray-600">Track your vital signs and health data</p>
                </div>
              </div>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Health Metric</DialogTitle>
                  <DialogDescription>
                    Record a new health measurement.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMetric} className="space-y-4">
                  <div>
                    <Label htmlFor="metric_type">Metric Type</Label>
                    <Select value={newMetric.metric_type} onValueChange={handleMetricTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight">Weight</SelectItem>
                        <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                        <SelectItem value="heart_rate">Heart Rate</SelectItem>
                        <SelectItem value="temperature">Temperature</SelectItem>
                        <SelectItem value="glucose">Blood Glucose</SelectItem>
                        <SelectItem value="cholesterol">Cholesterol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMetric.metric_date}
                      onChange={(e) => setNewMetric({...newMetric, metric_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="value">Value</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.1"
                        value={newMetric.value_numeric}
                        onChange={(e) => setNewMetric({...newMetric, value_numeric: e.target.value})}
                        placeholder="120"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newMetric.unit}
                        onChange={(e) => setNewMetric({...newMetric, unit: e.target.value})}
                        placeholder="kg"
                        required
                      />
                    </div>
                  </div>
                  {newMetric.metric_type === 'blood_pressure' && (
                    <div>
                      <Label htmlFor="text_value">Reading (e.g., 120/80)</Label>
                      <Input
                        id="text_value"
                        value={newMetric.value_text}
                        onChange={(e) => setNewMetric({...newMetric, value_text: e.target.value})}
                        placeholder="120/80"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Add Metric
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metricTypes.slice(0, 3).map((type) => {
            const latest = getLatestValue(type);
            const trend = getTrend(type);
            
            return (
              <Card key={type}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        {type.replace('_', ' ')}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {latest ? (
                          latest.value_text || `${latest.value_numeric} ${latest.unit}`
                        ) : 'No data'}
                      </p>
                    </div>
                    <div className="text-center">
                      {trend === 'up' && <TrendingUp className="h-6 w-6 text-green-600" />}
                      {trend === 'down' && <TrendingDown className="h-6 w-6 text-red-600" />}
                      {trend === 'stable' && <Activity className="h-6 w-6 text-gray-600" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {latest ? format(new Date(latest.metric_date), 'PPP') : 'No recent data'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-8">
          {metricTypes.map((type) => {
            const chartData = getChartData(type);
            if (chartData.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize">{type.replace('_', ' ')} Trend</CardTitle>
                  <CardDescription>
                    Your {type.replace('_', ' ')} measurements over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(label) => `Date: ${label}`}
                          formatter={(value, name) => [
                            `${value} ${metrics.find(m => m.metric_type === type)?.unit || ''}`,
                            type.replace('_', ' ')
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {metrics.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No health metrics yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your health by adding your first measurement.</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Metric
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}