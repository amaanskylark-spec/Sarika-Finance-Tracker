'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addPersonAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

const personSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  initialBalance: z.coerce.number().default(0),
  notes: z.string().optional(),
});

type PersonFormInputs = z.infer<typeof personSchema>;

interface AddPersonDialogProps {
  children: ReactNode;
  username: string;
}

export function AddPersonDialog({ children, username }: AddPersonDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonFormInputs>({
    resolver: zodResolver(personSchema),
  });

  const onSubmit: SubmitHandler<PersonFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
      await addPersonAction({
        ...data,
        addedBy: username
      });
      toast({
        title: 'Person Added',
        description: `${data.name} has been added to your list.`,
      });
      router.refresh();
      reset();
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add person. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-headline">Add New Person</DialogTitle>
            <DialogDescription>
              Enter the details of the new person you want to track.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Person Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance</Label>
              <Input id="initialBalance" type="number" step="0.01" {...register('initialBalance')} />
              <p className="text-xs text-muted-foreground">If you owe them, use a negative number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" {...register('notes')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Person
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
