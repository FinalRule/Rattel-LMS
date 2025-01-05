import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectStudent } from "@db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface StudentDetailsProps {
  student: SelectStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentStats {
  totalClasses: number;
  activeClasses: number;
  averageAttendance: number;
  totalLearningHours: number;
  averagePerformance: number;
}

interface StudentFinancials {
  currentMonthPayments: number;
  outstandingBalance: number;
  lastPayment: {
    amount: number;
    date: string;
  } | null;
}

export default function StudentDetailsDialog({
  student,
  open,
  onOpenChange,
}: StudentDetailsProps) {
  const { data: studentStats, isLoading: loadingStats } = useQuery<StudentStats>({
    queryKey: ["/api/students", student?.userId, "stats"],
    enabled: !!student,
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery<StudentFinancials>({
    queryKey: ["/api/students", student?.userId, "financials"],
    enabled: !!student,
  });

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{student.user.fullName}</DialogTitle>
          <DialogDescription>
            Comprehensive student profile and progress metrics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-6 mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="font-medium">Email</dt>
                      <dd>{student.user.email}</dd>
                      <dt className="font-medium">Phone</dt>
                      <dd>{student.user.phone || 'Not provided'}</dd>
                      <dt className="font-medium">WhatsApp</dt>
                      <dd>{student.user.whatsapp || 'Not provided'}</dd>
                      <dt className="font-medium">Nationality</dt>
                      <dd>{student.nationality}</dd>
                      <dt className="font-medium">Country of Residence</dt>
                      <dd>{student.countryOfResidence}</dd>
                      <dt className="font-medium">Parent Name</dt>
                      <dd>{student.parentName || 'Not provided'}</dd>
                      <dt className="font-medium">Timezone</dt>
                      <dd>{student.user.timezone}</dd>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-2 text-sm">
                      <dt className="font-medium">Learning Goals</dt>
                      <dd>{student.learningGoals || 'No goals specified'}</dd>
                      <dt className="font-medium">Notes</dt>
                      <dd>{student.notes || 'No notes available'}</dd>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="classes" className="space-y-4">
              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Class Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="font-medium">Total Classes</dt>
                        <dd>{studentStats?.totalClasses}</dd>
                        <dt className="font-medium">Active Classes</dt>
                        <dd>{studentStats?.activeClasses}</dd>
                        <dt className="font-medium">Learning Hours</dt>
                        <dd>{studentStats?.totalLearningHours}</dd>
                        <dt className="font-medium">Attendance Rate</dt>
                        <dd>{studentStats?.averageAttendance}%</dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              {loadingFinancials ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="font-medium">Current Month Payments</dt>
                        <dd>${financials?.currentMonthPayments}</dd>
                        <dt className="font-medium">Outstanding Balance</dt>
                        <dd>${financials?.outstandingBalance}</dd>
                        <dt className="font-medium">Last Payment</dt>
                        <dd>
                          {financials?.lastPayment ? (
                            <>
                              ${financials.lastPayment.amount} on{" "}
                              {new Date(financials.lastPayment.date).toLocaleDateString()}
                            </>
                          ) : (
                            'No previous payments'
                          )}
                        </dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="font-medium">Average Performance</dt>
                        <dd>{studentStats?.averagePerformance}/10</dd>
                        <dt className="font-medium">Attendance Rate</dt>
                        <dd>{studentStats?.averageAttendance}%</dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}