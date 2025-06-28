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
  TrendingUp
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [suggestions, setSuggestions] = useState<HealthSuggestion[]>([]);
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
      const [appointmentsRes, suggestionsRes] = await Promise.all([
        fetch('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/health-suggestions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const appointmentsData = await appointmentsRes.json();
      const suggestionsData = await suggestionsRes.json();

      if (appointmentsData.appointments) {
        setAppointments(appointmentsData.appointments);
      }
      if (suggestionsData.suggestions) {
        setSuggestions(suggestionsData.suggestions);
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
    router.push('/');
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 3);

  const unreadSuggestions = suggestions.filter(s => !s.read);

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
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
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

          <Card>
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Health Score</p>
                  <p className="text-3xl font-bold text-green-600">85</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Active</p>
                  <p className="text-3xl font-bold text-purple-600">30</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your health efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/appointments')}
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Appointments</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/health-metrics')}
                  >
                    <Activity className="h-6 w-6" />
                    <span className="text-sm">Health Metrics</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/records')}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Medical Records</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => router.push('/emergency')}
                  >
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">Emergency Profile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Health Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Health Suggestions
                </CardTitle>
                <CardDescription>Personalized recommendations for you</CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <div 
                        key={suggestion.id} 
                        className={`p-3 rounded-lg border ${suggestion.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                      >
                        <p className="text-sm text-gray-700">{suggestion.suggestion_text}</p>
                        {!suggestion.read && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No suggestions available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
                <CardDescription>Your overall health status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blood Pressure</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Weight Trend</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Stable</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Checkup</span>
                  <span className="text-sm text-gray-900">Nov 15, 2024</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next Due</span>
                  <span className="text-sm text-gray-900">Dec 25, 2024</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}