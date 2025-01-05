import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectTeacher } from "@db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface TeacherDetailsProps {
  teacher: SelectTeacher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeacherStats {
  totalClasses: number;
  activeClasses: number;
  averageRating: number;
  totalTeachingHours: number;
  attendanceRate: number;
}

interface TeacherFinancials {
  currentMonthEarnings: number;
  pendingPayouts: number;
  lastPayout: {
    amount: number;
    date: string;
  };
}

export default function TeacherDetailsDialog({
  teacher,
  open,
  onOpenChange,
}: TeacherDetailsProps) {
  const { data: teacherStats, isLoading: loadingStats } = useQuery<TeacherStats>({
    queryKey: ["/api/teachers", teacher.userId, "stats"],
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery<TeacherFinancials>({
    queryKey: ["/api/teachers", teacher.userId, "financials"],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{teacher.user.fullName}</DialogTitle>
          <DialogDescription>
            Comprehensive teacher profile and performance metrics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Email</dt>
                    <dd>{teacher.user.email}</dd>
                    <dt className="font-medium">Phone</dt>
                    <dd>{teacher.user.phone || 'Not provided'}</dd>
                    <dt className="font-medium">WhatsApp</dt>
                    <dd>{teacher.user.whatsapp || 'Not provided'}</dd>
                    <dt className="font-medium">City</dt>
                    <dd>{teacher.residenceCity}</dd>
                    <dt className="font-medium">Timezone</dt>
                    <dd>{teacher.user.timezone}</dd>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teaching Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 text-sm">
                    <dt className="font-medium">Bio</dt>
                    <dd>{teacher.bio || 'No bio provided'}</dd>
                    <dt className="font-medium">Base Rate</dt>
                    <dd>${teacher.baseSalaryPerHour}/hour</dd>
                    <dt className="font-medium">Rating</dt>
                    <dd>{teacher.rating ? `${teacher.rating}/5` : 'No ratings yet'}</dd>
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
                      <dd>{teacherStats?.totalClasses}</dd>
                      <dt className="font-medium">Active Classes</dt>
                      <dd>{teacherStats?.activeClasses}</dd>
                      <dt className="font-medium">Teaching Hours</dt>
                      <dd>{teacherStats?.totalTeachingHours}</dd>
                      <dt className="font-medium">Attendance Rate</dt>
                      <dd>{teacherStats?.attendanceRate}%</dd>
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
                      <dt className="font-medium">Current Month Earnings</dt>
                      <dd>${financials?.currentMonthEarnings}</dd>
                      <dt className="font-medium">Pending Payouts</dt>
                      <dd>${financials?.pendingPayouts}</dd>
                      <dt className="font-medium">Last Payout</dt>
                      <dd>
                        {financials?.lastPayout ? (
                          <>
                            ${financials.lastPayout.amount} on{" "}
                            {new Date(financials.lastPayout.date).toLocaleDateString()}
                          </>
                        ) : (
                          'No previous payouts'
                        )}
                      </dd>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
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
                      <dt className="font-medium">Average Rating</dt>
                      <dd>{teacherStats?.averageRating}/5</dd>
                      <dt className="font-medium">Attendance Rate</dt>
                      <dd>{teacherStats?.attendanceRate}%</dd>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
