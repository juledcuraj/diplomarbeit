'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Activity, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { HEALTH_METRIC_TYPES, HEALTH_METRIC_LABELS } from '@/lib/constants/medical';

interface HealthMetric {
  id: number;
  metric_date: string;
  metric_type: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    metric_type: 'all',
    from: '',
    to: ''
  });
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
  }, [router, pagination.page, filters]);

  const fetchMetrics = async (token: string) => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters.metric_type && filters.metric_type !== 'all') params.append('metric_type', filters.metric_type);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const response = await fetch(`/api/getMetrics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.metrics) {
        setMetrics(data.metrics);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error(data.error || 'Failed to load health metrics');
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

    setSubmitting(true);
    try {
      const payload = {
        metric_type: newMetric.metric_type,
        metric_date: newMetric.metric_date,
        value_numeric: newMetric.value_numeric ? parseFloat(newMetric.value_numeric) : null,
        value_text: newMetric.value_text || null,
        unit: newMetric.unit || null
      };

      const response = await fetch('/api/setMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        // Reset form
        setNewMetric({
          metric_type: '',
          metric_date: new Date().toISOString().split('T')[0],
          value_numeric: '',
          value_text: '',
          unit: ''
        });
        // Refresh metrics list
        fetchMetrics(token);
        toast.success('Health metric added successfully!');
      } else {
        toast.error(data.error || 'Failed to add health metric');
      }
    } catch (error) {
      toast.error('Failed to add health metric');
    } finally {
      setSubmitting(false);
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({ metric_type: 'all', from: '', to: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatValue = (metric: HealthMetric) => {
    if (metric.value_text) {
      return metric.unit ? `${metric.value_text} ${metric.unit}` : metric.value_text;
    }
    if (metric.value_numeric !== null && metric.value_numeric !== undefined) {
      return metric.unit ? `${metric.value_numeric} ${metric.unit}` : metric.value_numeric.toString();
    }
    return 'N/A';
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add New Metric Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Health Metric
                </CardTitle>
                <CardDescription>
                  Record a new health measurement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMetric} className="space-y-4">
                  <div>
                    <Label htmlFor="metric_type">Metric Type</Label>
                    <Select value={newMetric.metric_type} onValueChange={handleMetricTypeChange}>
                      <SelectTrigger className="mt-1">
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
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="value">Numeric Value</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.1"
                        value={newMetric.value_numeric}
                        onChange={(e) => setNewMetric({...newMetric, value_numeric: e.target.value})}
                        placeholder="120"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newMetric.unit}
                        onChange={(e) => setNewMetric({...newMetric, unit: e.target.value})}
                        placeholder="kg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text_value">Text Value (Optional)</Label>
                    <Input
                      id="text_value"
                      value={newMetric.value_text}
                      onChange={(e) => setNewMetric({...newMetric, value_text: e.target.value})}
                      placeholder="e.g., 120/80 for blood pressure"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting || !newMetric.metric_type || !newMetric.metric_date}
                  >
                    {submitting ? 'Adding...' : 'Add Metric'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Metrics List with Filters */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Health Metrics ({pagination.totalCount})
                </CardTitle>
                <CardDescription>
                  View and filter your health measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="filter_type" className="text-xs">Metric Type</Label>
                      <Select value={filters.metric_type} onValueChange={(value) => handleFilterChange('metric_type', value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
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
                      <Label htmlFor="filter_from" className="text-xs">From Date</Label>
                      <Input
                        id="filter_from"
                        type="date"
                        value={filters.from}
                        onChange={(e) => handleFilterChange('from', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter_to" className="text-xs">To Date</Label>
                      <Input
                        id="filter_to"
                        type="date"
                        value={filters.to}
                        onChange={(e) => handleFilterChange('to', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearFilters}
                        className="h-8 w-full"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Metrics Table */}
                {metrics.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No health metrics found</h3>
                    <p className="text-gray-600">
                      {(filters.metric_type !== 'all' || filters.from || filters.to) ? 
                        'Try adjusting your filters or add your first metric.' :
                        'Start tracking your health by adding your first measurement.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Recorded</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.map((metric) => (
                            <TableRow key={metric.id}>
                              <TableCell className="font-medium">
                                {format(new Date(metric.metric_date), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="capitalize">
                                {metric.metric_type.replace('_', ' ')}
                              </TableCell>
                              <TableCell>
                                {formatValue(metric)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {format(new Date(metric.created_at), 'MMM dd, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                          {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                          {pagination.totalCount} metrics
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}