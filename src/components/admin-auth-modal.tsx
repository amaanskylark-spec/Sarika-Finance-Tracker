'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/hooks/use-app';
import { Loader2 } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import Image from 'next/image';

const step1Schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const step2Schema = z.object({
  totp: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Must be digits'),
});

type Step1Inputs = z.infer<typeof step1Schema>;
type Step2Inputs = z.infer<typeof step2Schema>;

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "@dmin1007";
const TOTP_SECRET = "JBSWY3DPEHPK3PXP";

export function AdminAuthModal() {
  const { isAdminAuthModalOpen, setAdminAuthModalOpen, adminLogin, store } = useApp();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const { toast } = useToast();

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
    reset: resetStep1,
  } = useForm<Step1Inputs>({ resolver: zodResolver(step1Schema) });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
    reset: resetStep2,
  } = useForm<Step2Inputs>({ resolver: zodResolver(step2Schema) });
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime > 0) {
      timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutTime]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep(1);
      resetStep1();
      resetStep2();
      setFailedAttempts(0);
      setLockoutTime(0);
    }
    setAdminAuthModalOpen(open);
  };
  
  const onStep1Submit: SubmitHandler<Step1Inputs> = async (data) => {
    setIsLoading(true);
    if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
        const isTotpSetup = localStorage.getItem('sarkia_admin_totp_setup') === 'true';
        if (isTotpSetup) {
            setStep(3);
        } else {
            const totp = new OTPAuth.TOTP({
                issuer: 'Sarkia',
                label: 'Admin',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: TOTP_SECRET,
            });
            setTotpUri(totp.toString());
            setStep(2);
        }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid admin credentials.' });
    }
    setIsLoading(false);
  };

  const handleProceedToVerification = () => {
    localStorage.setItem('sarkia_admin_totp_setup', 'true');
    setStep(3);
  };
  
  const onStep2Submit: SubmitHandler<Step2Inputs> = async (data) => {
    if (lockoutTime > 0) {
        toast({ variant: 'destructive', title: 'Locked', description: `Please wait ${lockoutTime} seconds.`});
        return;
    }

    setIsLoading(true);
    try {
        const totp = new OTPAuth.TOTP({
            issuer: 'Sarkia',
            label: 'Admin',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: TOTP_SECRET,
        });

        const delta = totp.validate({ token: data.totp, window: 1 });

        if (delta === null) {
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts + 1 >= 3) {
                setLockoutTime(60);
                toast({ variant: 'destructive', title: 'Too many failed attempts', description: 'Please wait 60 seconds before trying again.'});
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid authenticator code. Please try again.' });
            }
        } else {
            setFailedAttempts(0);
            adminLogin();
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred during verification.' });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isAdminAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 1 && (
          <form onSubmit={handleSubmitStep1(onStep1Submit)}>
            <DialogHeader>
              <DialogTitle className="font-headline">Admin Login</DialogTitle>
              <DialogDescription>Enter your admin credentials.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Admin Username</Label>
                <Input id="admin-username" {...registerStep1('username')} />
                {errorsStep1.username && <p className="text-sm text-destructive">{errorsStep1.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin Password</Label>
                <Input id="admin-password" type="password" {...registerStep1('password')} />
                {errorsStep1.password && <p className="text-sm text-destructive">{errorsStep1.password.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next
              </Button>
            </DialogFooter>
          </form>
        )}
        {step === 2 && (
          <div>
            <DialogHeader>
              <DialogTitle className="font-headline">Set Up Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app (e.g., Google Authenticator).
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              {totpUri ? (
                <Image
                  src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(totpUri)}`}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin" />
              )}
              <p className="text-sm text-muted-foreground">Or manually enter this key:</p>
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{TOTP_SECRET}</code>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" onClick={handleProceedToVerification}>
                    Continue to Verification
                </Button>
            </DialogFooter>
          </div>
        )}
        {step === 3 && (
          <form onSubmit={handleSubmitStep2(onStep2Submit)}>
            <DialogHeader>
              <DialogTitle className="font-headline">Two-Step Verification</DialogTitle>
              <DialogDescription>Enter the 6-digit code from your authenticator app.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">Authenticator Code</Label>
                <Input id="totp-code" {...registerStep2('totp')} placeholder="123456" maxLength={6} />
                {errorsStep2.totp && <p className="text-sm text-destructive">{errorsStep2.totp.message}</p>}
                {lockoutTime > 0 && <p className="text-sm text-destructive">Locked out. Try again in {lockoutTime}s.</p>}
              </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" disabled={isLoading || lockoutTime > 0}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
