'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Edit3, Save, X, Mail, Calendar, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
        setEditForm({
          full_name: data.profile.full_name || '',
          date_of_birth: data.profile.date_of_birth || '',
          gender: data.profile.gender || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          emergency_contact_name: data.profile.emergency_contact_name || '',
          emergency_contact_phone: data.profile.emergency_contact_phone || ''
        });
      } else {
        toast.error(data.error || 'Failed to load profile');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        address: profile.address || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || ''
      });
    }
    setEditing(false);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Return to Dashboard
          </Button>
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
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{profile.full_name || 'User'}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.date_of_birth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">Age: </span>
                        <span className="font-medium">{calculateAge(profile.date_of_birth)} years old</span>
                      </div>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{profile.address}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      {editing ? 'Update your personal information' : 'Your personal information and emergency contacts'}
                    </CardDescription>
                  </div>
                  {!editing ? (
                    <Button onClick={handleEdit} variant="outline">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {editing ? (
                    // Edit Form
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            placeholder="Enter your full name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            value={profile.email}
                            disabled
                            className="mt-1 bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={editForm.date_of_birth}
                            onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="123 Main St, City, State, ZIP"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Emergency Contacts Section */}
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emergency_contact_name">Contact Name</Label>
                            <Input
                              id="emergency_contact_name"
                              value={editForm.emergency_contact_name}
                              onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                              placeholder="Emergency contact full name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                            <Input
                              id="emergency_contact_phone"
                              value={editForm.emergency_contact_phone}
                              onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                              placeholder="+1 (555) 987-6543"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                          <p className="mt-1 text-gray-900">{profile.full_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                          <p className="mt-1 text-gray-900">{profile.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                          <p className="mt-1 text-gray-900">
                            {profile.date_of_birth 
                              ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { 
                                  year: 'numeric', month: 'long', day: 'numeric' 
                                })
                              : 'Not provided'
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Gender</Label>
                          <p className="mt-1 text-gray-900 capitalize">
                            {profile.gender?.replace('_', ' ') || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                          <p className="mt-1 text-gray-900">{profile.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Address</Label>
                          <p className="mt-1 text-gray-900">{profile.address || 'Not provided'}</p>
                        </div>
                      </div>

                      {/* Emergency Contacts Section */}
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Contact Name</Label>
                            <p className="mt-1 text-gray-900">{profile.emergency_contact_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
                            <p className="mt-1 text-gray-900">{profile.emergency_contact_phone || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
