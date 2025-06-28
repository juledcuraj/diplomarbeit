'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Download, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MedicalRecord {
  id: number;
  record_type: string;
  storage_uri: string;
  record_date: string;
  description: string;
  created_at: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Simulate loading medical records (replace with actual API call)
    setTimeout(() => {
      setRecords([
        {
          id: 1,
          record_type: 'lab_result',
          storage_uri: '/records/lab-2024-11-15.pdf',
          record_date: '2024-11-15',
          description: 'Complete Blood Count and Basic Metabolic Panel',
          created_at: '2024-11-15T00:00:00Z'
        },
        {
          id: 2,
          record_type: 'imaging',
          storage_uri: '/records/chest-xray-2024-10-20.dcm',
          record_date: '2024-10-20',
          description: 'Chest X-Ray - Normal findings',
          created_at: '2024-10-20T00:00:00Z'
        },
        {
          id: 3,
          record_type: 'prescription',
          storage_uri: '/records/prescription-2024-09-10.pdf',
          record_date: '2024-09-10',
          description: 'Blood pressure medication prescription',
          created_at: '2024-09-10T00:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [router]);

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800';
      case 'imaging': return 'bg-purple-100 text-purple-800';
      case 'prescription': return 'bg-green-100 text-green-800';
      case 'report': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'lab_result': return '🧪';
      case 'imaging': return '📸';
      case 'prescription': return '💊';
      case 'report': return '📋';
      default: return '📄';
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    toast.info('Record viewing functionality will be implemented');
  };

  const handleDownloadRecord = (record: MedicalRecord) => {
    toast.info('Record download functionality will be implemented');
  };

  const handleUploadRecord = () => {
    toast.info('Record upload functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading medical records...</p>
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
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                  <p className="text-sm text-gray-600">Secure storage for your health documents</p>
                </div>
              </div>
            </div>
            
            <Button onClick={handleUploadRecord} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Record
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-blue-600">{records.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lab Results</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {records.filter(r => r.record_type === 'lab_result').length}
                  </p>
                </div>
                <span className="text-2xl">🧪</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Imaging</p>
                  <p className="text-3xl font-bold text-green-600">
                    {records.filter(r => r.record_type === 'imaging').length}
                  </p>
                </div>
                <span className="text-2xl">📸</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {records.filter(r => r.record_type === 'prescription').length}
                  </p>
                </div>
                <span className="text-2xl">💊</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Records</h2>
          </div>

          {records.length > 0 ? (
            <div className="grid gap-4">
              {records.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                          {getRecordTypeIcon(record.record_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{record.description}</h3>
                            <Badge className={getRecordTypeColor(record.record_type)}>
                              {record.record_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Record Date: {format(new Date(record.record_date), 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              <span>Uploaded: {format(new Date(record.created_at), 'PPP')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRecord(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadRecord(record)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records yet</h3>
                <p className="text-gray-600 mb-4">Upload your first medical document to get started.</p>
                <Button onClick={handleUploadRecord}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Record
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Security Notice */}
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Your Records Are Secure</h3>
                <p className="text-sm text-green-700">
                  All medical records are encrypted and stored securely. Only you have access to your personal health information.
                  We comply with HIPAA standards for medical data privacy and security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}