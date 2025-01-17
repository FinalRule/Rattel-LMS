import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AuthErrorModal from "@/components/auth/AuthErrorModal";

const authSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "teacher", "student"]).optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, authError, clearAuthError } = useUser();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "student",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isLogin) {
        await login({
          email: data.email,
          password: data.password
        });
      } else {
        if (!data.fullName) {
          throw new Error("Full name is required for registration");
        }

        await register({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: data.role || "student",
        });
      }
    } catch (error) {
      // Error handling is now managed by the useUser hook and displayed in the modal
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Login" : "Register"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isLogin && (
                <>
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

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex flex-col gap-4">
                <Button type="submit" className="w-full">
                  {isLogin ? "Login" : "Register"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full"
                >
                  {isLogin ? "Need an account? Register" : "Have an account? Login"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Auth Error Modal */}
      {authError && (
        <AuthErrorModal
          isOpen={!!authError}
          onClose={clearAuthError}
          error={authError}
        />
      )}
    </div>
  );
}