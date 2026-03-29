'use client';

import { useState } from 'react';
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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInputs = z.infer<typeof loginSchema>;

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "@dmin1007";

export function AdminAuthModal() {
  const { isAdminAuthModalOpen, setAdminAuthModalOpen, adminLogin } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginInputs>({ resolver: zodResolver(loginSchema) });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    setAdminAuthModalOpen(open);
  };

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setIsLoading(true);
    if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
        adminLogin();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid admin credentials.' });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isAdminAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-headline">Admin Login</DialogTitle>
            <DialogDescription>Enter your admin credentials.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Admin Username</Label>
              <Input id="admin-username" {...register('username')} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input id="admin-password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
