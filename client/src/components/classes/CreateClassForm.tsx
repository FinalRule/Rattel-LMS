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
import { useQuery } from "@tanstack/react-query";
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

  const form = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      name: "",
      teacherId: "",
      pricePlanId: "",
    },
  });

  // Fetch teachers
  const { data: teachers, isLoading: isTeachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Fetch price plans
  const { data: pricePlans, isLoading: isPricePlansLoading } = useQuery({
    queryKey: ['/api/price-plans'],
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const formData = form.getValues();
      // Log the form data to help with debugging
      console.log('Form data:', formData);

      try {
        setCurrentStep(prev => prev + 1);
        toast({
          title: "Success",
          description: "Basic information saved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save basic information",
          variant: "destructive",
        });
      }
    } else {
      // Show which fields have errors
      console.log('Form errors:', form.formState.errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
    }
  };

  const isLoading = isTeachersLoading || isPricePlansLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
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
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter class name" />
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
                <FormLabel>Teacher</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Price Plan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            <Button type="submit">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}