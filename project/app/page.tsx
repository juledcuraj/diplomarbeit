'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Shield, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';
import VerifyEmailModal from '@/components/verify-email-modal';
import { GENDER_OPTIONS } from '@/lib/constants/medical';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const router = useRouter();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear any existing tokens to ensure fresh login
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerifyModal(false);
    toast.success("Account created and verified successfully! Check your email for confirmation.");
    // Redirect to dashboard after successful verification
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          full_name: registerData.fullName,
          date_of_birth: registerData.dateOfBirth,
          gender: registerData.gender,
          phone: registerData.phone
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show verification modal instead of direct login
        setRegisteredEmail(registerData.email);
        setShowVerifyModal(true);
        toast.success('Registration initiated! Please check your email for verification code.');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">HealthCheck Reminder</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Your Personal Health Assistant
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Comprehensive health management platform for preventive healthcare, 
                appointment tracking, and health monitoring.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-medical-primary-light rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-medical-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Appointment Management</h3>
                  <p className="text-gray-600">Never miss a health checkup with automated reminders and scheduling.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-health-good-light rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-health-good" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Health Metrics Tracking</h3>
                  <p className="text-gray-600">Monitor your vital signs and health trends over time.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-health-excellent-light rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-health-excellent" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Emergency QR Profile</h3>
                  <p className="text-gray-600">Quick access to critical health information in emergencies.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
                <CardDescription>
                  {isLogin ? 'Sign in to your health dashboard' : 'Start managing your health today'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                          placeholder="+4312345678789"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={registerData.dateOfBirth}
                          onChange={(e) => setRegisterData({...registerData, dateOfBirth: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={registerData.gender} onValueChange={(value) => setRegisterData({...registerData, gender: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <VerifyEmailModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={registeredEmail}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}