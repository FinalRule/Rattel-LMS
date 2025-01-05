import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Step 1 Schema: Basic Information
const stepOneSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  pricePlanId: z.string().min(1, "Price plan is required"),
});

type StepOneData = z.infer<typeof stepOneSchema>;

export default function CreateClassForm({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      name: "",
      teacherId: "",
      pricePlanId: "",
    },
    mode: "onSubmit",
  });

  // Fetch teachers with error handling
  const { data: teachers = [], isLoading: isTeachersLoading, error: teachersError } = useQuery({
    queryKey: ['/api/teachers'],
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch price plans with error handling
  const { data: pricePlans = [], isLoading: isPricePlansLoading, error: pricePlansError } = useQuery({
    queryKey: ['/api/price-plans'],
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: StepOneData) => {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: StepOneData) => {
    try {
      await createClassMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const isLoading = isTeachersLoading || isPricePlansLoading;
  const hasError = teachersError || pricePlansError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Failed to load required data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Create New Class</h2>
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of 4: {currentStep === 1 ? "Basic Information" : ""}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="name">Class Name</FormLabel>
                <FormControl>
                  <Input id="name" {...field} placeholder="Enter class name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="teacherId">Teacher</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger id="teacherId">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers?.map((teacher: any) => (
                      <SelectItem key={teacher.userId} value={teacher.userId}>
                        {teacher.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePlanId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="pricePlanId">Price Plan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger id="pricePlanId">
                      <SelectValue placeholder="Select a price plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pricePlans?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClassMutation.isPending}>
              {createClassMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}