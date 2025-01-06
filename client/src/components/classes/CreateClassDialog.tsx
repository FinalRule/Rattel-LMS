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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectTeacher, SelectStudent, SelectPricePlan } from "@db/schema";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  endDate: z.string().min(1, "End date is required"),
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
  selectedStudentIds: z.array(z.string().uuid()).min(1, "Select at least one student"),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClassDialog({ open, onOpenChange }: CreateClassDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form definition
  const form = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      teacherId: "",
      pricePlanId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      defaultDuration: 60,
      schedule: {
        days: [],
        times: [],
      },
      monthlyPrice: 0,
      currency: "USD",
      teacherHourlyRate: 0,
      bufferTime: 10,
      selectedStudentIds: [],
    },
  });

  // Get current user and check authentication
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      const response = await fetch("/api/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          return null;
        }
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
  });

  // Fetch teachers
  const { data: teachers = [], isLoading: isTeachersLoading, error: teachersError } = useQuery<SelectTeacher[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch("/api/teachers", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          throw new Error("Please log in again");
        }
        throw new Error("Failed to fetch teachers");
      }

      return response.json();
    },
    retry: 1,
  });

  // Fetch students
  const { data: students = [], isLoading: isStudentsLoading, error: studentsError } = useQuery<SelectStudent[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch("/api/students", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          throw new Error("Please log in again");
        }
        throw new Error("Failed to fetch students");
      }

      return response.json();
    },
    retry: 1,
  });

  // Fetch price plans
  const { data: pricePlans = [], isLoading: isPricePlansLoading, error: pricePlansError } = useQuery<SelectPricePlan[]>({
    queryKey: ["/api/price-plans"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch("/api/price-plans", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          throw new Error("Please log in again");
        }
        throw new Error("Failed to fetch price plans");
      }

      return response.json();
    },
    retry: 1,
  });

  // Show error messages if any of the queries fail
  if (teachersError || studentsError || pricePlansError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">
          {teachersError?.message || studentsError?.message || pricePlansError?.message}
        </p>
      </div>
    );
  }

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassFormData) => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateClassFormData) => {
    createClassMutation.mutate(data);
  };

  // Show loading state while checking authentication
  if (isUserLoading || isTeachersLoading || isPricePlansLoading || isStudentsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Please log in to continue</p>
      </div>
    );
  }

  const selectedStudents = form.watch("selectedStudentIds");
  const selectedDays = form.watch("schedule.days");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Fill in all the required information to create a new class
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Student Selection */}
              <FormField
                control={form.control}
                name="selectedStudentIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Students</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value.length && "text-muted-foreground"
                            )}
                          >
                            {field.value.length > 0
                              ? `${field.value.length} student(s) selected`
                              : "Select students"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search students..." />
                          <CommandEmpty>No students found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {students.map((student) => (
                                <CommandItem
                                  value={student.userId}
                                  key={student.userId}
                                  onSelect={() => {
                                    const current = field.value;
                                    const newValue = current.includes(student.userId)
                                      ? current.filter((id) => id !== student.userId)
                                      : [...current, student.userId];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value.includes(student.userId)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {student.user?.fullName}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedStudents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedStudents.map((id) => {
                          const student = students.find(s => s.userId === id);
                          return (
                            <Badge key={id} variant="secondary">
                              {student?.user?.fullName}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule and Duration */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Set end date to at least a week after start date
                            const startDate = new Date(e.target.value);
                            const minEndDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                            const currentEndDate = new Date(form.getValues("endDate"));
                            if (currentEndDate < minEndDate) {
                              form.setValue("endDate", minEndDate.toISOString().split("T")[0]);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date(form.getValues("startDate")).toISOString().split("T")[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Weekly Schedule */}
              <div className="space-y-4">
                <FormLabel>Weekly Schedule</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("schedule.days");
                          const newDays = checked
                            ? [...current, day.value]
                            : current.filter(d => d !== day.value);
                          form.setValue("schedule.days", newDays);

                          // Update times array
                          const currentTimes = form.getValues("schedule.times");
                          if (checked) {
                            form.setValue("schedule.times", [
                              ...currentTimes,
                              { day: day.value, time: "09:00" }
                            ]);
                          } else {
                            form.setValue(
                              "schedule.times",
                              currentTimes.filter(t => t.day !== day.value)
                            );
                          }
                        }}
                      />
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
                {selectedDays.length > 0 && (
                  <div className="space-y-2">
                    {selectedDays.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="schedule.times"
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
                )}
              </div>
            </div>

            {/* Pricing and Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  );
}