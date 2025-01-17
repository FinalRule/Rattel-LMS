import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectClass } from "@db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface ClassDetailsProps {
  classData: SelectClass;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Session {
  id: string;
  dateTime: string;
  status: string;
  plannedDuration: number;
  actualDuration?: number;
}

interface ClassStats {
  totalSessions: number;
  completedSessions: number;
  averageAttendance: number;
  studentProgress?: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    averageScore: number;
  }>;
}

interface ClassFinancials {
  totalRevenue: number;
  teacherPayouts: number;
  profitMargin: number;
  monthlyBreakdown?: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export default function ClassDetailsDialog({
  classData,
  open,
  onOpenChange,
}: ClassDetailsProps) {
  // Fetch sessions for this class
  const { data: sessions, isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/classes/${classData.id}/sessions`],
    enabled: !!classData.id && open,
  });

  const { data: stats, isLoading: loadingStats } = useQuery<ClassStats>({
    queryKey: [`/api/classes/${classData.id}/stats`],
    enabled: !!classData.id && open,
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery<ClassFinancials>({
    queryKey: [`/api/classes/${classData.id}/financials`],
    enabled: !!classData.id && open,
  });

  const formatSessionDate = (dateTimeStr: string) => {
    try {
      const date = parseISO(dateTimeStr);
      const endTime = new Date(date);
      endTime.setMinutes(endTime.getMinutes() + (classData?.defaultDuration || 60));

      return {
        fullDate: format(date, 'EEEE, MMMM d, yyyy'),
        startTime: format(date, 'h:mm a'),
        endTime: format(endTime, 'h:mm a')
      };
    } catch (error) {
      console.error('Error formatting date:', dateTimeStr, error);
      return {
        fullDate: 'Invalid date',
        startTime: 'Invalid time',
        endTime: 'Invalid time'
      };
    }
  };

  const renderSessions = () => {
    if (loadingSessions) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!sessions || sessions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No sessions scheduled
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sessions.map((session) => {
          const { fullDate, startTime, endTime } = formatSessionDate(session.dateTime);
          return (
            <div
              key={session.id}
              className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div>
                <div className="font-medium">{fullDate}</div>
                <div className="text-sm text-muted-foreground">
                  {startTime} to {endTime}
                </div>
              </div>
              <Badge variant={
                session.status === 'completed' ? 'default' :
                session.status === 'scheduled' ? 'secondary' :
                session.status === 'cancelled' ? 'destructive' :
                'outline'
              }>
                {session.status}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFinancialsOverview = () => {
    if (!financials) return null;

    return (
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="font-medium">Total Revenue</dt>
        <dd>{classData.currency} {financials.totalRevenue}</dd>
        <dt className="font-medium">Teacher Payouts</dt>
        <dd>{classData.currency} {financials.teacherPayouts}</dd>
        <dt className="font-medium">Profit Margin</dt>
        <dd>{financials.profitMargin}%</dd>
      </dl>
    );
  };

  const renderMonthlyBreakdown = () => {
    if (!financials?.monthlyBreakdown?.length) return null;

    return (
      <div className="space-y-2">
        {financials.monthlyBreakdown.map((month) => (
          <div key={month.month} className="grid grid-cols-3 text-sm">
            <span>{month.month}</span>
            <span>Revenue: {classData.currency} {month.revenue}</span>
            <span>Expenses: {classData.currency} {month.expenses}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>{classData.name}</DialogTitle>
          <DialogDescription>
            Comprehensive class information and analytics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto pr-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Teacher</dt>
                    <dd>{classData.teacherId || 'Unassigned'}</dd>
                    <dt className="font-medium">Start Date</dt>
                    <dd>{format(parseISO(classData.startDate), 'MMMM d, yyyy')}</dd>
                    <dt className="font-medium">Duration</dt>
                    <dd>{classData.defaultDuration} minutes</dd>
                    <dt className="font-medium">Price</dt>
                    <dd>{classData.monthlyPrice} {classData.currency}/month</dd>
                    <dt className="font-medium">Status</dt>
                    <dd>
                      <Badge variant="default">{classData.status}</Badge>
                    </dd>
                  </dl>
                </CardContent>
              </Card>

              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : stats ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Class Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="font-medium">Total Sessions</dt>
                      <dd>{stats.totalSessions}</dd>
                      <dt className="font-medium">Completed Sessions</dt>
                      <dd>{stats.completedSessions}</dd>
                      <dt className="font-medium">Average Attendance</dt>
                      <dd>{stats.averageAttendance}%</dd>
                    </dl>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Session Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSessions()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : stats?.studentProgress && stats.studentProgress.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Student Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.studentProgress.map((student) => (
                        <div key={student.studentId} className="border-b pb-4">
                          <h4 className="font-medium">{student.studentName}</h4>
                          <dl className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <dt>Attendance Rate</dt>
                            <dd>{student.attendanceRate}%</dd>
                            <dt>Average Score</dt>
                            <dd>{student.averageScore}/100</dd>
                          </dl>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No student progress data available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              {loadingFinancials ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : financials ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderFinancialsOverview()}
                    </CardContent>
                  </Card>

                  {financials.monthlyBreakdown && financials.monthlyBreakdown.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderMonthlyBreakdown()}
                      </CardContent>
                    </Card>
                  )}
                  {!financials.monthlyBreakdown && (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        No monthly breakdown data available
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No financial data available
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