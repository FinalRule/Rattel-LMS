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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectTeacher, SelectPricePlan, SelectSubject } from "@db/schema";

const WEEKDAYS = [
  { label: "Monday", value: "MON" },
  { label: "Tuesday", value: "TUE" },
  { label: "Wednesday", value: "WED" },
  { label: "Thursday", value: "THU" },
  { label: "Friday", value: "FRI" },
  { label: "Saturday", value: "SAT" },
  { label: "Sunday", value: "SUN" },
] as const;

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacherId: z.string().uuid("Please select a teacher"),
  pricePlanId: z.string().uuid("Please select a price plan"),
  startDate: z.string().min(1, "Start date is required"),
  durationInMonths: z.coerce.number().min(1, "Duration must be at least 1 month"),
  defaultDuration: z.coerce.number().min(30, "Duration must be at least 30 minutes"),
  schedule: z.object({
    days: z.array(z.string()).min(1, "Select at least one day"),
    times: z.array(z.object({
      day: z.string(),
      time: z.string(),
    })).min(1, "Add at least one time slot"),
  }),
  monthlyPrice: z.coerce.number().min(0, "Price must be non-negative"),
  currency: z.string().min(1, "Currency is required"),
  teacherHourlyRate: z.coerce.number().min(0, "Teacher rate must be non-negative"),
  bufferTime: z.coerce.number().optional(),
  selectedStudentIds: z.array(z.string().uuid()).optional(),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClassDialog({
  open,
  onOpenChange,
}: CreateClassDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Check user authentication
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const form = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      teacherId: undefined,
      pricePlanId: undefined,
      startDate: new Date().toISOString().split("T")[0],
      durationInMonths: 1,
      defaultDuration: 60,
      schedule: {
        days: [],
        times: [],
      },
      bufferTime: 10,
      currency: "USD",
      monthlyPrice: 0,
      teacherHourlyRate: 0,
      selectedStudentIds: [],
    },
  });

  const { data: teachers } = useQuery<SelectTeacher[]>({
    queryKey: ["/api/teachers"],
    enabled: !!user,
  });

  const { data: pricePlans } = useQuery<SelectPricePlan[]>({
    queryKey: ["/api/price-plans"],
    enabled: !!user,
  });

  const { data: subjects } = useQuery<SelectSubject[]>({
    queryKey: ["/api/subjects"],
    enabled: !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassFormData) => {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      onOpenChange(false);
      form.reset();
      setStep(1);
    },
    onError: (error) => {
      if (error.message.includes("401")) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a class",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateCurrentStep = async () => {
    let isValid = true;
    const formData = form.getValues();

    // Check authentication first
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a class",
        variant: "destructive",
      });
      return false;
    }

    if (step === 1) {
      isValid = Boolean(
        formData.name &&
        formData.teacherId &&
        formData.pricePlanId
      );
    } else if (step === 2) {
      isValid = Boolean(
        formData.startDate &&
        formData.durationInMonths &&
        formData.defaultDuration &&
        formData.defaultDuration >= 30
      );
    } else if (step === 3) {
      isValid = Boolean(
        formData.schedule.days.length > 0 &&
        formData.schedule.times.length > 0
      );
    }

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }

    return isValid;
  };

  const handleDayChange = (day: string, checked: boolean) => {
    const newDays = checked
      ? [...selectedDays, day]
      : selectedDays.filter(d => d !== day);

    setSelectedDays(newDays);
    form.setValue("schedule.days", newDays);

    // Update times array
    const currentTimes = form.getValues("schedule.times");
    if (checked) {
      // Add a default time for the new day
      form.setValue("schedule.times", [
        ...currentTimes,
        { day, time: "09:00" }
      ]);
    } else {
      // Remove times for the unchecked day
      form.setValue(
        "schedule.times",
        currentTimes.filter(t => t.day !== day)
      );
    }
  };

  const onSubmit = async (data: CreateClassFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a class",
        variant: "destructive",
      });
      return;
    }

    if (step < 4) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setStep(step + 1);
      }
      return;
    }
    createClassMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? "Basic Information" : 
              step === 2 ? "Schedule & Duration" : 
              step === 3 ? "Weekly Schedule" :
              "Pricing & Settings"
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
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          {teachers?.map((teacher) => (
                            <SelectItem key={teacher.userId} value={teacher.userId}>
                              {teacher.user?.fullName}
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
                          {pricePlans?.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - {plan.subject?.name}
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
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationInMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
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
                      <FormLabel>Buffer Time (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Select Days</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => 
                            handleDayChange(day.value, checked as boolean)
                          }
                        />
                        <label>{day.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDays.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Class Times</FormLabel>
                    <div className="space-y-2">
                      {selectedDays.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
                          name={`schedule.times`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <span className="w-24">{
                                WEEKDAYS.find(d => d.value === day)?.label
                              }</span>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={
                                    field.value.find(t => t.day === day)?.time || "09:00"
                                  }
                                  onChange={(e) => {
                                    const newTimes = field.value.filter(t => t.day !== day);
                                    newTimes.push({ day, time: e.target.value });
                                    field.onChange(newTimes);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <>
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  name="teacherHourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Hourly Rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {students && (
                  <FormField
                    control={form.control}
                    name="selectedStudentIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Students</FormLabel>
                        <Select multiple onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select students" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                {step === 4 ? "Create Class" : "Next"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}