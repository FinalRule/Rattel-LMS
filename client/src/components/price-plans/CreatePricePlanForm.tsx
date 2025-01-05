import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";

const createPricePlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subjectId: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  monthlyPrice: z.coerce.number().min(0, "Price must be non-negative"),
  currency: z.string().min(1, "Currency is required"),
  features: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof createPricePlanSchema>;

export default function CreatePricePlanForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user and check authentication
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get subjects for the select input
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    enabled: !!user, // Only fetch if user is authenticated
  });

  const form = useForm<FormData>({
    resolver: zodResolver(createPricePlanSchema),
    defaultValues: {
      name: "",
      subjectId: "",
      description: "",
      monthlyPrice: 0,
      currency: "USD",
      features: [],
    },
  });

  const createPricePlanMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/price-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for auth
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create price plan");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-plans"] });
      toast({
        title: "Success",
        description: "Price plan created successfully",
      });
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

  const onSubmit = (data: FormData) => {
    createPricePlanMutation.mutate(data);
  };

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to continue</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Price</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
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

        <Button type="submit" disabled={createPricePlanMutation.isPending}>
          {createPricePlanMutation.isPending ? "Creating..." : "Create Price Plan"}
        </Button>
      </form>
    </Form>
  );
}
