'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Download, QrCode, User, Phone, Heart, Pill, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EmergencyProfile {
  id: number;
  user_id: number;
  blood_type: string;
  allergies: string;
  conditions: string;
  medications: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  qr_code: string;
  last_updated: string;
}

export default function EmergencyPage() {
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchEmergencyProfile(token);
  }, [router]);

  const fetchEmergencyProfile = async (token: string) => {
    try {
      const response = await fetch('/api/emergency-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        setQrCode(data.qrCode);
      }
    } catch (error) {
      toast.error('Failed to load emergency profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'emergency-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded successfully!');
  };

  const handlePrintProfile = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading emergency profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Emergency Profile</h1>
                  <p className="text-sm text-gray-600">Critical health information for emergencies</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency profile found</h3>
              <p className="text-gray-600">Emergency profile setup is coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Emergency Profile</h1>
                  <p className="text-sm text-gray-600">Critical health information for emergencies</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrintProfile}>
                <Download className="h-4 w-4 mr-2" />
                Print Profile
              </Button>
              <Button onClick={handleDownloadQR} className="bg-red-600 hover:bg-red-700">
                <QrCode className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Emergency Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-red-700">
                  Basic details for emergency responders
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user.date_of_birth ? format(new Date(user.date_of_birth), 'PPP') : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blood Type</p>
                    <Badge variant="outline" className="text-lg font-bold text-red-600 border-red-200">
                      {profile.blood_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gender</p>
                    <p className="text-lg font-semibold text-gray-900">{user.gender || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Heart className="h-5 w-5" />
                  Medical Information
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Critical medical details and conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="font-medium text-gray-900">Allergies</p>
                  </div>
                  <p className="text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    {profile.allergies || 'No known allergies'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-gray-900">Medical Conditions</p>
                  </div>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {profile.conditions || 'No known conditions'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-gray-900">Current Medications</p>
                  </div>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    {profile.medications || 'No current medications'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Phone className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Person to contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contact Name</p>
                    <p className="text-lg font-semibold text-gray-900">{profile.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-900">{profile.emergency_contact_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Section */}
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <QrCode className="h-5 w-5" />
                  Emergency QR Code
                </CardTitle>
                <CardDescription className="text-green-700">
                  Scan for instant access to critical information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                {qrCode && (
                  <div className="space-y-4">
                    <img 
                      src={qrCode} 
                      alt="Emergency QR Code" 
                      className="mx-auto border-2 border-green-200 rounded-lg"
                    />
                    <p className="text-sm text-gray-600">
                      Save this QR code to your phone's lock screen or wallet for emergency access
                    </p>
                    <Button onClick={handleDownloadQR} className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <p>Download and save the QR code to your phone</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <p>Add it to your lock screen or digital wallet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <p>Emergency responders can scan for instant access to your medical information</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 text-center">
                  Last updated: {format(new Date(profile.last_updated), 'PPP')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}