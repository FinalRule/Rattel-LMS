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

// Form Schema
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  pricePlanId: z.string().min(1, "Price plan is required"),
  startDate: z.string().min(1, "Start date is required"),
  defaultDuration: z.number().min(1, "Duration is required"),
  monthlyPrice: z.number().min(0, "Monthly price must be 0 or greater"),
  currency: z.string().min(1, "Currency is required"),
  teacherHourlyRate: z.number().min(0, "Teacher hourly rate must be 0 or greater"),
  bufferTime: z.number().min(0, "Buffer time must be 0 or greater"),
});

type CreateClassData = z.infer<typeof createClassSchema>;

export default function CreateClassForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateClassData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      teacherId: "",
      pricePlanId: "",
      startDate: new Date().toISOString().split('T')[0],
      defaultDuration: 60,
      monthlyPrice: 0,
      currency: "USD",
      teacherHourlyRate: 0,
      bufferTime: 15,
    },
  });

  // Fetch teachers with error handling
  const { data: teachers = [], isLoading: isTeachersLoading, error: teachersError } = useQuery({
    queryKey: ['/api/teachers'],
    select: (data) => data || [],
  });

  // Fetch price plans with error handling
  const { data: pricePlans = [], isLoading: isPricePlansLoading, error: pricePlansError } = useQuery({
    queryKey: ['/api/price-plans'],
    select: (data) => data || [],
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassData) => {
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

  const onSubmit = async (data: CreateClassData) => {
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
          Fill in the class details below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="class-name">Class Name</FormLabel>
                <FormControl>
                  <Input 
                    id="class-name"
                    placeholder="Enter class name"
                    {...field}
                  />
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
                <FormLabel htmlFor="teacher-select">Teacher</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="teacher-select">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers.map((teacher) => (
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
                <FormLabel htmlFor="price-plan-select">Price Plan</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="price-plan-select">
                      <SelectValue placeholder="Select a price plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pricePlans.map((plan) => (
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

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="start-date">Start Date</FormLabel>
                <FormControl>
                  <Input 
                    id="start-date"
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="defaultDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="duration">Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      id="duration"
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
              name="bufferTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="buffer-time">Buffer Time (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      id="buffer-time"
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="monthlyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="monthly-price">Monthly Price</FormLabel>
                  <FormControl>
                    <Input 
                      id="monthly-price"
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
                  <FormLabel htmlFor="currency-select">Currency</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="currency-select">
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
          </div>

          <FormField
            control={form.control}
            name="teacherHourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="hourly-rate">Teacher Hourly Rate</FormLabel>
                <FormControl>
                  <Input 
                    id="hourly-rate"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Create Class
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}