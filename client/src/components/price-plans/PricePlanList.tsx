import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Users, 
  Calendar,
  Edit2,
  BookOpen,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SelectPricePlan } from "@db/schema";
import PricePlanDetailsDialog from "./PricePlanDetailsDialog";

export default function PricePlanList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<SelectPricePlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SelectPricePlan | null>(null);

  const { data: pricePlans, isLoading, error } = useQuery<SelectPricePlan[]>({
    queryKey: ["/api/price-plans"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/price-plans/${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Price plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/price-plans"] });
      setPlanToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-destructive">Error loading price plans: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!pricePlans || pricePlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No price plans found</p>
      </div>
    );
  }

  // Calculate statistics
  const activePlans = pricePlans.filter(plan => plan.isActive).length;
  const trialEligiblePlans = pricePlans.filter(plan => plan.isTrialEligible).length;
  const promotionalPlans = pricePlans.filter(plan => plan.promotionalPrice !== null).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Plans</CardTitle>
            <CardDescription>Currently active price plans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activePlans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trial Eligible</CardTitle>
            <CardDescription>Plans with trial periods</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{trialEligiblePlans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotional Plans</CardTitle>
            <CardDescription>Plans with active promotions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{promotionalPlans}</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Plans List */}
      <div className="grid gap-4">
        {pricePlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {plan.isTrialEligible && (
                      <Badge variant="outline">Trial Available</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Duration: {plan.durationPerSession} minutes | {plan.sessionsPerMonth} sessions/month
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPlanToDelete(plan)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.monthlyFee} {plan.currency}/month
                      {plan.promotionalPrice && (
                        <span className="text-green-600 ml-2">
                          Promo: {plan.promotionalPrice} {plan.currency}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.minimumCommitment 
                        ? `${plan.minimumCommitment} months minimum`
                        : 'No minimum commitment'}
                    </span>
                  </div>
                </div>

                {plan.promotionValidUntil && (
                  <div className="text-sm text-muted-foreground">
                    Promotion ends: {new Date(plan.promotionValidUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <PricePlanDetailsDialog
          plan={selectedPlan}
          open={true}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
        />
      )}

      <AlertDialog 
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the price plan "{planToDelete?.name}" as inactive. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && deleteMutation.mutate(planToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}