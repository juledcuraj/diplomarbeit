"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}

export default function VerifyEmailModal({ isOpen, onClose, email, onSuccess }: VerifyEmailModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Timer effect
  useEffect(() => {
    if (!isOpen) return;
    
    setTimeLeft(600); // Reset timer when modal opens
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setTimeLeft(600);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const filteredValue = value.replace(/\D/g, "").slice(0, 6);
    setCode(filteredValue);
  };

  const isValidCode = /^\d{6}$/.test(code);

  const handleVerify = async () => {
    if (!isValidCode) return;

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Email verified successfully!");
        onSuccess();
      } else {
        toast.error(result.error || "Verification failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Verification code resent!");
        setCode("");
        setTimeLeft(600); // Reset timer
      } else {
        toast.error(result.error || "Failed to resend code");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            We've sent a 6-digit verification code to your email address. Your account will be created after successful verification.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="code" className="text-sm font-medium">
              Verification Code
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              disabled={isVerifying || isResending}
            />
          </div>

          <div className="text-center text-sm text-gray-600">
            {timeLeft > 0 ? (
              <span>Code expires in {formatTime(timeLeft)}</span>
            ) : (
              <span className="text-red-600">Code has expired</span>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleVerify}
              disabled={!isValidCode || isVerifying || isResending || timeLeft === 0}
              className="flex-1"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || isVerifying}
            >
              {isResending ? "Resending..." : "Resend"}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
            disabled={isVerifying || isResending}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
