import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { insertTeacherSchema } from "@db/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  timezone: z.string().min(1),
  bio: z.string().optional(),
  residenceCity: z.string().min(1),
  baseSalaryPerHour: z.number().min(0),
  googleAccount: z.string().email().optional(),
  bufferTimePreference: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type CreateTeacherForm = z.infer<typeof createTeacherSchema>;

interface CreateTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTeacherDialog({
  open,
  onOpenChange,
}: CreateTeacherDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<CreateTeacherForm>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      bufferTimePreference: 15,
    },
  });

  // Auth token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const createTeacher = useMutation({
    mutationFn: async (data: CreateTeacherForm) => {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Authentication required");

      const response = await fetch("/api/teachers", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          throw new Error("Please log in again");
        }
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create teacher");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Success",
        description: "Teacher created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Create a new teacher profile with their account details and teaching preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createTeacher.mutate(data))}
            className="space-y-6 max-h-[60vh] overflow-y-auto pr-6"
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="residenceCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City of Residence</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseSalaryPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary per Hour ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googleAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Account</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormDescription>
                      Used for Google Meet integration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bufferTimePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Time between consecutive classes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 sticky bottom-0 bg-background pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTeacher.isPending}
              >
                {createTeacher.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Teacher
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}