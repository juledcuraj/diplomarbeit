'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Activity, 
  FileText, 
  Shield, 
  Bell, 
  Heart,
  LogOut,
  Plus,
  TrendingUp,
  User,
  Lightbulb,
  Clock,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  created_at?: string;
}

interface Appointment {
  id: number;
  title: string;
  appointment_date: string;
  location: string;
  doctor_name: string;
  status: string;
}

interface HealthSuggestion {
  id: number;
  suggestion_text: string;
  read: boolean;
}

interface HealthMetric {
  id: number;
  metric_date: string;
  metric_type: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [suggestions, setSuggestions] = useState<HealthSuggestion[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointmentTips, setAppointmentTips] = useState<any[]>([]);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const [appointmentsRes, suggestionsRes, metricsRes] = await Promise.all([
        fetch('/api/getAppointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/health-suggestions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/getMetrics?pageSize=5', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const appointmentsData = await appointmentsRes.json();
      const suggestionsData = await suggestionsRes.json();
      const metricsData = await metricsRes.json();

      if (appointmentsData.appointments) {
        setAppointments(appointmentsData.appointments);
      }
      if (suggestionsData.suggestions) {
        setSuggestions(suggestionsData.suggestions);
      }
      if (metricsData.metrics) {
        setMetrics(metricsData.metrics);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully. Please log in again with correct credentials.');
    router.push('/');
  };

  const generateAppointmentTips = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setGeneratingTips(true);
    try {
      const response = await fetch('/api/appointment-tips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAppointmentTips(data.suggestions);
        
        // Save suggestions to database
        await fetch('/api/appointment-suggestions', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ suggestions: data.suggestions })
        });
      } else {
        toast.error(data.error || 'Failed to generate appointment tips');
      }
    } catch (error) {
      console.error('Error generating tips:', error);
      toast.error('Failed to generate appointment tips');
    } finally {
      setGeneratingTips(false);
    }
  };

  const handleAcceptTip = async (suggestion: any, selectedSlot: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/appointment-suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'accept',
          suggestion_id: suggestion.id,
          selected_slot: selectedSlot
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Appointment created successfully!');
        // Refresh appointments
        window.location.reload();
      } else {
        alert(data.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error accepting tip:', error);
      alert('Failed to create appointment');
    }
  };

  const generateHealthSuggestions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/health-suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        alert(data.error || 'Failed to generate health suggestions');
      }
    } catch (error) {
      console.error('Error generating health suggestions:', error);
      alert('Failed to generate health suggestions');
    }
  };

  const handleDeclineTip = async (suggestion: any, reason: string = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/appointment-suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'decline',
          suggestion_id: suggestion.id,
          decline_reason: reason
        })
      });

      const data = await response.json();
      if (data.success) {
        // Remove from tips display
        setAppointmentTips(prev => prev.filter(tip => tip.id !== suggestion.id));
      } else {
        alert(data.error || 'Failed to decline suggestion');
      }
    } catch (error) {
      console.error('Error declining tip:', error);
    }
  };

  const markSuggestionAsRead = async (suggestionId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/health-suggestions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: suggestionId })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state to mark as read
        setSuggestions(prev => 
          prev.map(suggestion => 
            suggestion.id === suggestionId 
              ? { ...suggestion, read: true }
              : suggestion
          )
        );
      }
    } catch (error) {
      console.error('Error marking suggestion as read:', error);
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 3);

  const unreadSuggestions = suggestions.filter(s => !s.read);
  
  const recentMetrics = metrics.slice(0, 3);
  
  // Helper function to format metric type names
  const formatMetricType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'systolic_bp': 'Systolic Blood Pressure',
      'diastolic_bp': 'Diastolic Blood Pressure',
      'blood_pressure': 'Blood Pressure',
      'heart_rate': 'Heart Rate',
      'blood_glucose': 'Blood Glucose',
      'weight': 'Weight',
      'bmi': 'BMI',
      'temperature': 'Body Temperature',
      'spo2': 'Oxygen Saturation',
      'oxygen_saturation': 'Oxygen Saturation',
      'cholesterol': 'Cholesterol',
      'ldl_cholesterol': 'LDL Cholesterol',
      'hdl_cholesterol': 'HDL Cholesterol',
      'hba1c': 'HbA1c',
      'triglycerides': 'Triglycerides'
    };
    return typeMap[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get metric icon
  const getMetricIcon = (type: string) => {
    if (type.includes('bp') || type.includes('blood_pressure')) return '❤️';
    if (type.includes('heart_rate')) return '💓';
    if (type.includes('glucose')) return '🩸';
    if (type.includes('weight') || type.includes('bmi')) return '⚖️';
    if (type.includes('temperature')) return '🌡️';
    if (type.includes('spo2') || type.includes('oxygen')) return '🫁';
    if (type.includes('cholesterol')) return '🧪';
    if (type.includes('hba1c')) return '📊';
    return '📋';
  };
  
  // Calculate days active since user creation
  const daysActive = user?.created_at 
    ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const getLatestMetricByType = (type: string) => {
    return metrics.find(m => m.metric_type === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your health dashboard...</p>
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
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">HealthCare Manager</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/profile')}
                  title="View Profile"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Here's an overview of your health management.</p>
        </div>

        {/* Quick Actions - Moved to top */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Actions</CardTitle>
            <CardDescription className="text-blue-700">Manage your health efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 bg-white hover:bg-blue-50 border-blue-200"
                onClick={() => router.push('/appointments')}
              >
                <Calendar className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-blue-600">Appointments</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 bg-white hover:bg-green-50 border-green-200"
                onClick={() => router.push('/health-metrics')}
              >
                <Activity className="h-6 w-6 text-green-600" />
                <span className="text-sm text-green-600">Health Metrics</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={() => router.push('/medical-records')}
                title="Comprehensive medical records with PDF upload and health metrics integration"
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-blue-600">Medical Records</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 bg-white hover:bg-purple-50 border-purple-200"
                onClick={() => router.push('/profile')}
              >
                <User className="h-6 w-6 text-purple-600" />
                <span className="text-sm text-purple-600">Profile</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 bg-white hover:bg-red-50 border-red-200"
                onClick={() => router.push('/emergency')}
              >
                <Shield className="h-6 w-6 text-red-600" />
                <span className="text-sm text-red-600">Emergency</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Now clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-blue-50"
            onClick={() => router.push('/appointments')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                  <p className="text-3xl font-bold text-blue-600">{upcomingAppointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-orange-50"
            onClick={() => {
              // Navigate to a health alerts/suggestions page or show modal
              toast.info('Health alerts coming soon!');
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Health Alerts</p>
                  <p className="text-3xl font-bold text-orange-600">{unreadSuggestions.length}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-green-50"
            onClick={() => router.push('/health-metrics')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Health Metrics</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.length}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-purple-50"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Active</p>
                  <p className="text-3xl font-bold text-purple-600">{daysActive}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled health checkups</CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/appointments')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                            <p className="text-sm text-gray-600">{appointment.doctor_name}</p>
                            <p className="text-sm text-gray-500">{appointment.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {format(new Date(appointment.appointment_date), 'MMM dd')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(appointment.appointment_date), 'h:mm a')}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming appointments</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/appointments')}
                    >
                      Schedule Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Tips Generator - Moved below appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Appointment Tips
                    </CardTitle>
                    <CardDescription>Rule-based appointment recommendations from your health metrics</CardDescription>
                  </div>
                  <Button 
                    onClick={generateAppointmentTips}
                    disabled={generatingTips}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {generatingTips ? 'Analyzing...' : 'Analyze Metrics'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {appointmentTips.length > 0 ? (
                  <div className="space-y-4">
                    {appointmentTips.slice(0, 2).map((tip) => (
                      <div 
                        key={tip.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          tip.danger_level === 3 ? 'border-red-500 bg-red-50' :
                          tip.danger_level === 2 ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{tip.title}</h4>
                            <Badge 
                              variant={tip.danger_level === 3 ? 'destructive' : tip.danger_level === 2 ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              Priority {tip.danger_level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle 
                              className={`h-4 w-4 ${
                                tip.danger_level === 3 ? 'text-red-500' :
                                tip.danger_level === 2 ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} 
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{tip.reason}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Clock className="h-4 w-4" />
                          <span>{tip.specialty} • {tip.timeframe}</span>
                        </div>
                        
                        {/* Proposed appointment slots */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Suggested time slots:</p>
                          <div className="flex flex-wrap gap-1">
                            {tip.proposed_slots?.map((slot: string, index: number) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                              >
                                {slot}
                              </span>
                            )) || <span className="text-xs text-gray-500">No specific slots suggested</span>}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptTip(tip, tip.proposed_slots?.[0] || '')}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept First Slot
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDeclineTip(tip, 'Not needed at this time')}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                        
                        {/* Consequences */}
                        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                          <p className="text-gray-600">
                            <span className="font-medium">If declined:</span> {tip.decline_consequence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No appointment tips available</p>
                    <p className="text-xs text-gray-500 mt-1">Click "Generate Tips" to get personalized recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Health Suggestions */}
            <Card>
              <CardHeader className="pb-4 relative">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold pr-32">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  Health Suggestions
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 pr-32">
                  AI-powered wellness recommendations
                </CardDescription>
                <Button 
                  onClick={generateHealthSuggestions}
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Generate Tips
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <div 
                        key={suggestion.id} 
                        onClick={() => !suggestion.read && markSuggestionAsRead(suggestion.id)}
                        className={`relative p-4 rounded-lg border transition-all duration-200 ${
                          suggestion.read 
                            ? 'bg-gray-50/50 border-gray-200 text-gray-600' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-gray-800 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            suggestion.read ? 'bg-gray-300 text-gray-600' : 'bg-blue-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">{suggestion.suggestion_text}</p>
                            {!suggestion.read && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                  New
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {suggestions.length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          +{suggestions.length - 3} more suggestions available
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No suggestions yet</h4>
                    <p className="text-sm text-gray-600 mb-4">Get personalized wellness recommendations</p>
                    <Button 
                      onClick={generateHealthSuggestions}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Generate Your First Tips
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Health Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Recent Health Metrics</CardTitle>
                  <CardDescription>
                    {recentMetrics.length > 0 
                      ? `${recentMetrics.length} recent measurement${recentMetrics.length > 1 ? 's' : ''}`
                      : 'Your latest health measurements'
                    }
                  </CardDescription>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/health-metrics')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentMetrics.length > 0 ? (
                  <div className="space-y-4">
                    {recentMetrics.map((metric) => (
                      <div key={metric.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getMetricIcon(metric.metric_type)}</span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatMetricType(metric.metric_type)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {format(new Date(metric.metric_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {metric.value_text || 
                             (metric.value_numeric && metric.unit ? 
                              `${metric.value_numeric} ${metric.unit}` : 
                              metric.value_numeric)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No health metrics recorded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={() => router.push('/health-metrics')}
                    >
                      Add Your First Metric
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}