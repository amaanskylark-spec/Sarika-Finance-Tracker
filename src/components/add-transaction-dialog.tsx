'use client';

import { useState, type ReactNode, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { addTransactionAction, updateTransactionAction, getAiCategories } from '@/lib/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn, debounce } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { useApp } from '@/hooks/use-app';
import { Badge } from '@/components/ui/badge';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense'], { required_error: 'Transaction type is required' }),
  date: z.date({ required_error: 'Date is required' }),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
});

type TransactionFormInputs = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
  children: ReactNode;
  personId: string;
  transaction?: Transaction;
  onTransactionComplete: () => void;
}

export function AddTransactionDialog({ children, personId, transaction, onTransactionComplete }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { user } = useApp();

  const isEditMode = !!transaction;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormInputs>({
    resolver: zodResolver(transactionSchema),
    defaultValues: isEditMode
      ? {
          amount: transaction.amount,
          type: transaction.type,
          date: new Date(transaction.date),
          description: transaction.description,
          category: transaction.category,
        }
      : {
          type: 'expense',
          date: new Date(),
        },
  });

  const descriptionValue = watch('description');

  const fetchAiSuggestions = useCallback(
    debounce(async (description: string) => {
      if (!description || description.length < 5) {
        setAiSuggestions([]);
        return;
      }
      setIsAiLoading(true);
      const suggestions = await getAiCategories(description);
      setAiSuggestions(suggestions);
      setIsAiLoading(false);
    }, 500),
    []
  );

  useEffect(() => {
    fetchAiSuggestions(descriptionValue);
  }, [descriptionValue, fetchAiSuggestions]);

  const onSubmit: SubmitHandler<TransactionFormInputs> = async (data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const actionData = {
        personId: personId,
        amount: data.amount,
        type: data.type,
        date: data.date.getTime(),
        description: data.description,
        category: data.category,
        addedBy: user.username,
      };

      if (isEditMode) {
        await updateTransactionAction(transaction.id, actionData);
        toast({
          title: 'Transaction Updated',
          description: `The transaction has been successfully updated.`,
        });
      } else {
        await addTransactionAction(actionData);
        toast({
          title: 'Transaction Added',
          description: `A new transaction has been added.`,
        });
      }
      onTransactionComplete();
      reset({ type: 'expense', date: new Date() });
      setAiSuggestions([]);
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'add'} transaction. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-headline">{isEditMode ? 'Edit' : 'Add'} Transaction</DialogTitle>
            <DialogDescription>
              Record a new financial event. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="r-expense" />
                      <Label htmlFor="r-expense">Money Given</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="r-income" />
                      <Label htmlFor="r-income">Money Received</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                 {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Comment</Label>
              <Textarea id="description" {...register('description')} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex items-center gap-2">
                <Input id="category" {...register('category')} />
                {isAiLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {aiSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Wand2 className="h-3 w-3" /> Suggestions:</span>
                  {aiSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setValue('category', suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
