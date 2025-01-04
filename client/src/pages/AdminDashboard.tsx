import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface AttendanceStats {
  sessionId: string;
  status: string;
  totalStudents: number;
}

interface FinancialStats {
  totalAmount: number;
  currency: string;
  status: string;
  type: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery<AttendanceStats[]>({
    queryKey: ["/api/analytics/attendance"],
  });

  const { data: financialStats, isLoading: loadingFinancial } = useQuery<FinancialStats[]>({
    queryKey: ["/api/analytics/financial"],
  });

  if (loadingAttendance || loadingFinancial) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Transform attendance data for chart
  const attendanceData = attendanceStats?.reduce((acc: any[], curr) => {
    const existingEntry = acc.find(item => item.sessionId === curr.sessionId);
    if (existingEntry) {
      existingEntry[curr.status] = curr.totalStudents;
    } else {
      acc.push({
        sessionId: curr.sessionId,
        [curr.status]: curr.totalStudents
      });
    }
    return acc;
  }, []) || [];

  // Transform financial data for chart
  const financialData = financialStats?.map(stat => ({
    type: stat.type,
    amount: stat.totalAmount,
    currency: stat.currency,
    status: stat.status
  })) || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Students</CardTitle>
                <CardDescription>Active enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">123</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Teachers</CardTitle>
                <CardDescription>Active teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">45</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Classes</CardTitle>
                <CardDescription>Active classes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">67</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Session attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sessionId" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="#4ade80"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke="#f43f5e"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Payment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#0ea5e9"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}