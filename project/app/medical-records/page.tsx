'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, FileText, Filter, ChevronLeft, ChevronRight, Eye, Download, Activity, Calendar, Clock, Upload, X, File, FileArchive } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HealthMetric {
  metric_type: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  metric_date: string;
}

interface MedicalRecord {
  id: number;
  user_id: number;
  record_type: string;
  storage_uri: string;
  record_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  related_metrics?: HealthMetric[];
}

interface RecordsResponse {
  items: MedicalRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  error?: string;
}

interface UploadResponse {
  storage_uri: string;
  filename: string;
  size: number;
  mime: string;
  uploaded_at: string;
}

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function MedicalRecordsPage() {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });
  const [filters, setFilters] = useState({
    record_type: 'all',
    from: '',
    to: '',
    q: ''
  });
  const [newRecord, setNewRecord] = useState({
    record_type: '',
    record_date: new Date().toISOString().split('T')[0],
    storage_uri: '',
    description: '',
    include_metrics_summary: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const router = useRouter();
  const debouncedSearch = useDebounce(filters.q, 300);

  // SWR fetcher function
  const fetcher = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      throw new Error('No token');
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    
    return response.json();
  };

  // Build SWR key
  const buildSWRKey = useCallback(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      pageSize: pagination.pageSize.toString(),
    });

    if (filters.record_type && filters.record_type !== 'all') params.append('record_type', filters.record_type);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (debouncedSearch) params.append('q', debouncedSearch);

    return `/api/medical-records?${params}`;
  }, [pagination.page, pagination.pageSize, filters.record_type, filters.from, filters.to, debouncedSearch]);

  // Use SWR for data fetching
  const { data: recordsData, error, isLoading } = useSWR<RecordsResponse>(
    buildSWRKey(),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ record_type: 'all', from: '', to: '', q: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // File upload handlers
  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadFile = async (file: File): Promise<UploadResponse> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/records/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      let storage_uri = newRecord.storage_uri;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        
        try {
          const uploadResult = await uploadFile(selectedFile);
          storage_uri = uploadResult.storage_uri;
          toast.success(`File uploaded: ${uploadResult.filename}`);
        } catch (uploadError) {
          toast.error(uploadError instanceof Error ? uploadError.message : 'Upload failed');
          return;
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      // Create record using medical-records endpoint for enhanced features
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newRecord,
          storage_uri
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Reset form
        setNewRecord({
          record_type: '',
          record_date: new Date().toISOString().split('T')[0],
          storage_uri: '',
          description: '',
          include_metrics_summary: true
        });
        setSelectedFile(null);
        
        // Invalidate SWR cache to refresh data
        mutate(buildSWRKey());
        toast.success('Medical record added successfully!');
      } else {
        toast.error(data.error || 'Failed to add medical record');
      }
    } catch (error) {
      toast.error('Failed to add medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async (recordId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/records/${recordId}/view`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        toast.error('Failed to preview file');
        return;
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error('Failed to preview file');
    }
  };

  const handleDownload = async (recordId: number, recordType: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/records/${recordId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        toast.error('Failed to download file');
        return;
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${recordType}_${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDownloadComplete = async (recordId: number, recordType: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/records/${recordId}/download-complete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        toast.error('Failed to download complete record');
        return;
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `complete_medical_record_${recordType}_${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Complete medical record downloaded successfully');
    } catch (error) {
      toast.error('Failed to download complete record');
    }
  };

  const getRecordTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'lab_report': 'bg-blue-100 text-blue-800',
      'prescription': 'bg-green-100 text-green-800',
      'imaging': 'bg-purple-100 text-purple-800',
      'consultation': 'bg-orange-100 text-orange-800',
      'vaccination': 'bg-pink-100 text-pink-800',
      'discharge_summary': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['other'];
  };

  const formatMetricValue = (metric: HealthMetric) => {
    if (metric.value_text) {
      return metric.unit ? `${metric.value_text} ${metric.unit}` : metric.value_text;
    }
    if (metric.value_numeric !== null && metric.value_numeric !== undefined) {
      return metric.unit ? `${metric.value_numeric} ${metric.unit}` : metric.value_numeric.toString();
    }
    return 'N/A';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Failed to load medical records</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  const records = recordsData?.items || [];
  const paginationData = recordsData ? {
    page: recordsData.page,
    pageSize: recordsData.pageSize,
    total: recordsData.total,
    totalPages: recordsData.totalPages
  } : {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: 0,
    totalPages: 0
  };

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
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-sm text-gray-600">Upload, manage, and view your comprehensive medical history with health metrics integration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add New Record Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Medical Record
                </CardTitle>
                <CardDescription>
                  Upload a PDF document or create a record with health metrics integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRecord} className="space-y-4">
                  <div>
                    <Label htmlFor="record_type">Record Type</Label>
                    <Select value={newRecord.record_type} onValueChange={(value) => setNewRecord({...newRecord, record_type: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select record type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lab_report">Lab Report</SelectItem>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        <SelectItem value="imaging">Imaging/X-Ray</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="record_date">Record Date</Label>
                    <Input
                      id="record_date"
                      type="date"
                      value={newRecord.record_date}
                      onChange={(e) => setNewRecord({...newRecord, record_date: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newRecord.description}
                      onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                      placeholder="Leave blank to auto-generate from health metrics"
                      className="mt-1"
                    />
                  </div>

                  {/* PDF Upload Area */}
                  <div>
                    <Label>PDF Document</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : selectedFile 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      {selectedFile ? (
                        <div className="space-y-2">
                          <File className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">
                            Drop PDF file here or{' '}
                            <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                              browse
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </p>
                          <p className="text-xs text-gray-500">PDF files up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual URI Input (alternative to file upload) */}
                  {!selectedFile && (
                    <div>
                      <Label htmlFor="storage_uri">Or File Path/URI</Label>
                      <Input
                        id="storage_uri"
                        value={newRecord.storage_uri}
                        onChange={(e) => setNewRecord({...newRecord, storage_uri: e.target.value})}
                        placeholder="path/to/document.pdf"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the path to an existing document
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_metrics"
                      checked={newRecord.include_metrics_summary}
                      onCheckedChange={(checked) => 
                        setNewRecord({...newRecord, include_metrics_summary: Boolean(checked)})
                      }
                    />
                    <Label htmlFor="include_metrics" className="text-sm">
                      Include health metrics summary in description
                    </Label>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={
                      submitting || 
                      uploading || 
                      !newRecord.record_type || 
                      !newRecord.record_date || 
                      (!selectedFile && !newRecord.storage_uri)
                    }
                  >
                    {submitting ? 'Adding...' : uploading ? 'Uploading...' : 'Add Record'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Records Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Medical Records Timeline ({paginationData.total})
                </CardTitle>
                <CardDescription>
                  Chronological view of your medical history with related health metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <Label htmlFor="filter_type" className="text-xs">Record Type</Label>
                      <Select value={filters.record_type} onValueChange={(value) => handleFilterChange('record_type', value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="lab_report">Lab Report</SelectItem>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="imaging">Imaging/X-Ray</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="vaccination">Vaccination</SelectItem>
                          <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                    <div>
                      <Label htmlFor="filter_search" className="text-xs">Search</Label>
                      <Input
                        id="filter_search"
                        type="text"
                        value={filters.q}
                        onChange={(e) => handleFilterChange('q', e.target.value)}
                        placeholder="Search records..."
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

                {/* Timeline View */}
                {records.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
                    <p className="text-gray-600">
                      {(filters.record_type !== 'all' || filters.from || filters.to || filters.q) ? 
                        'Try adjusting your filters or add your first record.' :
                        'Start building your comprehensive medical timeline by uploading your first document.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {records.map((record, index) => (
                        <div key={record.id} className="relative">
                          {/* Timeline line */}
                          {index !== records.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                          )}
                          
                          {/* Record card */}
                          <div className="flex gap-4">
                            {/* Timeline dot */}
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            
                            {/* Record content */}
                            <div className="flex-1 bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {record.description || `${record.record_type.replace('_', ' ')} Record`}
                                    </h3>
                                    <Badge className={getRecordTypeColor(record.record_type)}>
                                      {record.record_type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>{format(new Date(record.record_date), 'MMMM do, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>Added {format(new Date(record.created_at), 'MMM dd, yyyy')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(record.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(record.id, record.record_type)}
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                    title="Download Original File"
                                  >
                                    <Download className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadComplete(record.id, record.record_type)}
                                    className="h-8 w-8 p-0 hover:bg-purple-100"
                                    title="Download Complete Record (with summary)"
                                  >
                                    <FileArchive className="h-4 w-4 text-purple-600" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Related health metrics */}
                              {record.related_metrics && record.related_metrics.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Related Health Metrics</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {record.related_metrics.map((metric, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium capitalize text-gray-600">
                                          {metric.metric_type.replace('_', ' ')}:
                                        </span>
                                        <span className="ml-2 text-gray-900">
                                          {formatMetricValue(metric)}
                                        </span>
                                        <span className="ml-1 text-xs text-gray-500">
                                          ({format(new Date(metric.metric_date), 'MMM dd')})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {paginationData.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                          Showing {((paginationData.page - 1) * paginationData.pageSize) + 1} to{' '}
                          {Math.min(paginationData.page * paginationData.pageSize, paginationData.total)} of{' '}
                          {paginationData.total} records
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(paginationData.page - 1)}
                            disabled={paginationData.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {paginationData.page} of {paginationData.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(paginationData.page + 1)}
                            disabled={paginationData.page === paginationData.totalPages}
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
