import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectSubject } from "@db/schema";

const createPricePlanSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters"),
  subjectId: z.string().uuid("Please select a subject"),
  durationPerSession: z.number().min(30, "Duration must be at least 30 minutes"),
  sessionsPerMonth: z.number().min(1, "Must have at least 1 session per month").max(30, "Maximum 30 sessions per month"),
  monthlyFee: z.number().min(0, "Price must be non-negative"),
  currency: z.string().min(1, "Currency is required"),
  promotionalPrice: z.number().optional(),
  promotionValidUntil: z.string().optional(),
  minimumCommitment: z.number().optional(),
  isTrialEligible: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CreatePricePlanFormData = z.infer<typeof createPricePlanSchema>;

interface CreatePricePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePricePlanDialog({
  open,
  onOpenChange,
}: CreatePricePlanDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const form = useForm<CreatePricePlanFormData>({
    resolver: zodResolver(createPricePlanSchema),
    defaultValues: {
      durationPerSession: 60,
      sessionsPerMonth: 4,
      currency: "USD",
      isTrialEligible: false,
      isActive: true,
    },
  });

  const { data: subjects } = useQuery<SelectSubject[]>({
    queryKey: ["/api/subjects"],
  });

  const createPricePlanMutation = useMutation({
    mutationFn: async (data: CreatePricePlanFormData) => {
      const response = await fetch("/api/price-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-plans"] });
      toast({
        title: "Success",
        description: "Price plan created successfully",
      });
      onOpenChange(false);
      form.reset();
      setStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePricePlanFormData) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    createPricePlanMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Price Plan</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {
              step === 1 ? "Basic Information" : 
              step === 2 ? "Session Details" : 
              "Pricing & Promotion"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="durationPerSession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration per Session (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionsPerMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sessions per Month</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="monthlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Fee</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promotionalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotional Price (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promotionValidUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Valid Until (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumCommitment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Commitment (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isTrialEligible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Trial Eligible</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Previous
                </Button>
              )}
              <Button type="submit">
                {step === 3 ? "Create Plan" : "Next"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
