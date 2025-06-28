'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, ArrowLeft, MapPin, User, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  title: string;
  appointment_date: string;
  location: string;
  doctor_name: string;
  notes?: string;
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    appointment_date: '',
    location: '',
    doctor_name: '',
    notes: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchAppointments(token);
  }, [router]);

  const fetchAppointments = async (token: string) => {
    try {
      const response = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAppointment)
      });

      const data = await response.json();
      if (data.success) {
        setAppointments([...appointments, data.appointment]);
        setNewAppointment({
          title: '',
          appointment_date: '',
          location: '',
          doctor_name: '',
          notes: ''
        });
        setShowDialog(false);
        toast.success('Appointment scheduled successfully!');
      }
    } catch (error) {
      toast.error('Failed to create appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date()
  ).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) <= new Date()
  ).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading appointments...</p>
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
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                  <p className="text-sm text-gray-600">Manage your health appointments</p>
                </div>
              </div>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new health appointment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Appointment Type</Label>
                    <Input
                      id="title"
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                      placeholder="e.g., Annual Physical, Dental Cleaning"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date & Time</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={newAppointment.appointment_date}
                      onChange={(e) => setNewAppointment({...newAppointment, appointment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor">Doctor Name</Label>
                    <Input
                      id="doctor"
                      value={newAppointment.doctor_name}
                      onChange={(e) => setNewAppointment({...newAppointment, doctor_name: e.target.value})}
                      placeholder="Dr. Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                      placeholder="Medical Center Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      placeholder="Any special instructions or reminders"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Schedule
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{pastAppointments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{appointment.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{appointment.doctor_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(appointment.appointment_date), 'PPP')} at{' '}
                                {format(new Date(appointment.appointment_date), 'p')}
                              </span>
                            </div>
                            {appointment.notes && (
                              <div className="flex items-start gap-2 mt-2">
                                <FileText className="h-4 w-4 mt-0.5" />
                                <span className="text-gray-700">{appointment.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                <p className="text-gray-600 mb-4">Schedule your next health checkup to stay on top of your wellness.</p>
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-80">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{appointment.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{appointment.doctor_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(appointment.appointment_date), 'PPP')} at{' '}
                                {format(new Date(appointment.appointment_date), 'p')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}