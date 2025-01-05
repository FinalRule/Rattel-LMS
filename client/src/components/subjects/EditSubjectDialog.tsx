import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Subject } from "@db/schema";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  details: z.string(),
  category: z.string().min(1, "Category is required"),
  difficultyLevel: z.string().min(1, "Difficulty level is required"),
  availableDurations: z.string().transform((val) => 
    val.split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n))
  ),
  sessionsPerMonth: z.number(),
  defaultBufferTime: z.number(),
  isActive: z.boolean(),
});

type Props = {
  subject: Subject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditSubjectDialog({ subject, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject.name,
      details: subject.details || "",
      category: subject.category || "",
      difficultyLevel: subject.difficultyLevel || "",
      availableDurations: subject.availableDurations?.join(",") || "60,90,120",
      sessionsPerMonth: subject.sessionsPerMonth || 4,
      defaultBufferTime: subject.defaultBufferTime || 15,
      isActive: subject.isActive,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof subjectSchema>) => {
      const response = await fetch(`/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof subjectSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficultyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableDurations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Durations (minutes)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="60,90,120" />
                  </FormControl>
                  <FormDescription>
                    Enter durations in minutes, separated by commas (e.g., 60,90,120)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sessionsPerMonth"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Sessions per Month</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      value={value}
                      onChange={(e) => onChange(parseInt(e.target.value))}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultBufferTime"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Default Buffer Time (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      value={value}
                      onChange={(e) => onChange(parseInt(e.target.value))}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Set whether this subject is active and available
                    </FormDescription>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Subject</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}