'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Plus, ArrowLeft, Clock, FileText, Edit3, Check, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getAppointmentStatusThemeClasses } from '@/lib/utils/theme-utils';

interface Appointment {
  id: number;
  title: string;
  appointment_date: string;
  location?: string;
  doctor_name?: string;
  notes?: string;
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    appointment_date: '',
    location: '',
    doctor_name: '',
    notes: ''
  });
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
      const response = await fetch('/api/getAppointments', {
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

    setSubmitting(true);
    try {
      const response = await fetch('/api/setAppointments', {
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
        toast.success('Appointment created successfully! Email reminders have been scheduled.');
      } else {
        toast.error(data.error || 'Failed to create appointment');
      }
    } catch (error) {
      toast.error('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    // Use new theme system instead of hardcoded colors
    return getAppointmentStatusThemeClasses(status);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setEditForm({
      title: appointment.title,
      appointment_date: appointment.appointment_date,
      location: appointment.location || '',
      doctor_name: appointment.doctor_name || '',
      notes: appointment.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    const token = localStorage.getItem('token');
    if (!token || !editingId) return;

    try {
      const response = await fetch(`/api/appointments/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        setAppointments(appointments.map(apt => 
          apt.id === editingId ? { ...apt, ...editForm } : apt
        ));
        setEditingId(null);
        setEditForm({
          title: '',
          appointment_date: '',
          location: '',
          doctor_name: '',
          notes: ''
        });
        toast.success('Appointment updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update appointment');
      }
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      title: '',
      appointment_date: '',
      location: '',
      doctor_name: '',
      notes: ''
    });
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
        toast.success(`Appointment marked as ${newStatus}!`);
      } else {
        toast.error(data.error || 'Failed to update appointment status');
      }
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setDeletingId(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAppointments(appointments.filter(apt => apt.id !== appointmentId));
        toast.success('Appointment deleted successfully!');
      } else {
        toast.error(data.error || 'Failed to delete appointment');
      }
    } catch (error) {
      toast.error('Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  // Sort appointments by date (upcoming first, then past)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.appointment_date);
    const dateB = new Date(b.appointment_date);
    const now = new Date();
    
    // Upcoming appointments first (sorted by date ascending)
    // Past appointments last (sorted by date descending)
    if (dateA > now && dateB > now) {
      return dateA.getTime() - dateB.getTime();
    } else if (dateA <= now && dateB <= now) {
      return dateB.getTime() - dateA.getTime();
    } else if (dateA > now && dateB <= now) {
      return -1;
    } else {
      return 1;
    }
  });

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                <p className="text-sm text-gray-600">Manage your appointments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add New Appointment Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Appointment
                </CardTitle>
                <CardDescription>
                  Fill in the details for your new appointment. Email reminders will be automatically scheduled based on your appointment type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Appointment Title</Label>
                    <Input
                      id="title"
                      type="text"
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment, 
                        title: e.target.value
                      })}
                      placeholder="e.g., Annual Physical, Dental Cleaning"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date & Time</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={newAppointment.appointment_date}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment, 
                        appointment_date: e.target.value
                      })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor">Doctor Name</Label>
                    <Input
                      id="doctor"
                      type="text"
                      value={newAppointment.doctor_name}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment, 
                        doctor_name: e.target.value
                      })}
                      placeholder="Dr. Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment, 
                        location: e.target.value
                      })}
                      placeholder="Medical Center Name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment, 
                        notes: e.target.value
                      })}
                      placeholder="Any special instructions or reminders..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Appointment'}
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center mt-3 px-2">
                    📧 Automatic email reminders will be sent based on your appointment type:
                    <br />
                    <span className="text-blue-600">Urgent appointments</span>: 1 week, 3 days, 1 day, 2 hours before
                    <br />
                    <span className="text-green-600">Regular/Specialist</span>: 1 week, 1 day, 2 hours before
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Appointments ({appointments.length})
                </CardTitle>
                <CardDescription>
                  All your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                    <p className="text-gray-600">Create your first appointment using the form on the left.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.appointment_date);
                      const isUpcoming = appointmentDate > new Date();
                      const isEditing = editingId === appointment.id;
                      
                      return (
                        <div
                          key={appointment.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            isUpcoming 
                              ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50' 
                              : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/50'
                          }`}
                        >
                          {isEditing ? (
                            // Edit Form
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`edit-title-${appointment.id}`}>Title</Label>
                                  <Input
                                    id={`edit-title-${appointment.id}`}
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`edit-date-${appointment.id}`}>Date & Time</Label>
                                  <Input
                                    id={`edit-date-${appointment.id}`}
                                    type="datetime-local"
                                    value={editForm.appointment_date}
                                    onChange={(e) => setEditForm({ ...editForm, appointment_date: e.target.value })}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`edit-doctor-${appointment.id}`}>Doctor Name</Label>
                                  <Input
                                    id={`edit-doctor-${appointment.id}`}
                                    value={editForm.doctor_name}
                                    onChange={(e) => setEditForm({ ...editForm, doctor_name: e.target.value })}
                                    placeholder="Dr. Smith"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`edit-location-${appointment.id}`}>Location</Label>
                                  <Input
                                    id={`edit-location-${appointment.id}`}
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="Medical Center Name"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor={`edit-notes-${appointment.id}`}>Notes</Label>
                                <Textarea
                                  id={`edit-notes-${appointment.id}`}
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  placeholder="Any special instructions or reminders..."
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveEdit}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  size="sm"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Display View
                            <div>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      isUpcoming ? 'bg-blue-100' : 'bg-gray-100'
                                    }`}>
                                      <Calendar className={`h-5 w-5 ${
                                        isUpcoming ? 'text-blue-600' : 'text-gray-600'
                                      }`} />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {appointment.title}
                                      </h3>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {format(appointmentDate, 'PPP')} at{' '}
                                          {format(appointmentDate, 'p')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {appointment.notes && (
                                    <p className="text-gray-700 text-sm ml-13 mt-2">
                                      <span className="font-medium">Notes:</span> {appointment.notes}
                                    </p>
                                  )}

                                  {(appointment.location || appointment.doctor_name) && (
                                    <div className="text-sm text-gray-600 ml-13 mt-2 space-y-1">
                                      {appointment.doctor_name && (
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">Doctor:</span> {appointment.doctor_name}
                                        </div>
                                      )}
                                      {appointment.location && (
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">Location:</span> {appointment.location}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                  <Button
                                    onClick={() => handleEditAppointment(appointment)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                    title="Edit appointment"
                                  >
                                    <Edit3 className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        title="Delete appointment"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{appointment.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteAppointment(appointment.id)}
                                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                          disabled={deletingId === appointment.id}
                                        >
                                          {deletingId === appointment.id ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Status Update Buttons */}
                              {appointment.status === 'scheduled' && !isUpcoming && (
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                  <span className="text-sm font-medium text-gray-700 self-center">
                                    Mark as:
                                  </span>
                                  <Button
                                    onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                    size="sm"
                                    variant="outline"
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Attended
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Missed/Cancelled
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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