import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SelectPricePlan } from "@db/schema";

interface PricePlanDetailsProps {
  plan: SelectPricePlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanStats {
  activeStudents: number;
  totalRevenue: number;
  averageStudentRetention: number;
  studentHistory: {
    studentId: string;
    studentName: string;
    enrollmentDate: string;
    status: string;
  }[];
}

interface FinancialStats {
  monthlyBreakdown: {
    month: string;
    revenue: number;
    studentCount: number;
  }[];
}

export default function PricePlanDetailsDialog({
  plan,
  open,
  onOpenChange,
}: PricePlanDetailsProps) {
  const { data: stats, isLoading: loadingStats } = useQuery<PlanStats>({
    queryKey: ["/api/price-plans", plan.id, "stats"],
    enabled: open, // Only fetch when dialog is open
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery<FinancialStats>({
    queryKey: ["/api/price-plans", plan.id, "financials"],
    enabled: open, // Only fetch when dialog is open
  });

  const renderStudentHistory = () => {
    if (!stats?.studentHistory?.length) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No student history available
        </div>
      );
    }

    return stats.studentHistory.map((student) => (
      <div key={student.studentId} className="border-b pb-4">
        <h4 className="font-medium">{student.studentName}</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm mt-2">
          <dt>Enrollment Date</dt>
          <dd>{new Date(student.enrollmentDate).toLocaleDateString()}</dd>
          <dt>Status</dt>
          <dd>{student.status}</dd>
        </dl>
      </div>
    ));
  };

  const renderFinancialBreakdown = () => {
    if (!financials?.monthlyBreakdown?.length) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No financial data available
        </div>
      );
    }

    return financials.monthlyBreakdown.map((month) => (
      <div key={month.month} className="grid grid-cols-3 text-sm">
        <span>{month.month}</span>
        <span>Revenue: {month.revenue} {plan.currency}</span>
        <span>Students: {month.studentCount}</span>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
          <DialogDescription>
            Comprehensive plan information and analytics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto pr-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Duration</dt>
                    <dd>{plan.durationPerSession} minutes</dd>
                    <dt className="font-medium">Sessions/Month</dt>
                    <dd>{plan.sessionsPerMonth}</dd>
                    <dt className="font-medium">Monthly Fee</dt>
                    <dd>{plan.monthlyFee} {plan.currency}</dd>
                    <dt className="font-medium">Status</dt>
                    <dd>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </dd>
                    {plan.promotionalPrice && (
                      <>
                        <dt className="font-medium">Promotional Price</dt>
                        <dd>{plan.promotionalPrice} {plan.currency}</dd>
                      </>
                    )}
                    {plan.minimumCommitment && (
                      <>
                        <dt className="font-medium">Minimum Commitment</dt>
                        <dd>{plan.minimumCommitment} months</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="font-medium">Active Students</dt>
                      <dd>{stats?.activeStudents ?? 0}</dd>
                      <dt className="font-medium">Total Revenue</dt>
                      <dd>{stats?.totalRevenue ?? 0} {plan.currency}</dd>
                      <dt className="font-medium">Average Retention</dt>
                      <dd>{stats?.averageStudentRetention ?? 0}%</dd>
                    </dl>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Student History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {renderStudentHistory()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              {loadingFinancials ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {renderFinancialBreakdown()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}