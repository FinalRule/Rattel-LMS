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
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubjectList from "@/components/subjects/SubjectList";
import TeacherList from "@/components/teachers/TeacherList";
import StudentList from "@/components/students/StudentList";
import CreateSubjectDialog from "@/components/subjects/CreateSubjectDialog";
import CreateTeacherDialog from "@/components/teachers/CreateTeacherDialog";
import CreateStudentDialog from "@/components/students/CreateStudentDialog";
import ClassList from "@/components/classes/ClassList";
import CreateClassDialog from "@/components/classes/CreateClassDialog";

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
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
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

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Subject Management</h2>
            <Button onClick={() => setIsCreateSubjectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
          <SubjectList />
          <CreateSubjectDialog 
            open={isCreateSubjectOpen} 
            onOpenChange={setIsCreateSubjectOpen} 
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Student Management</h2>
            <Button onClick={() => setIsCreateStudentOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
          <StudentList />
          <CreateStudentDialog 
            open={isCreateStudentOpen} 
            onOpenChange={setIsCreateStudentOpen} 
          />
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
                  <LineChart data={attendanceStats?.reduce((acc: any[], curr) => {
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
                  }, []) || []}>
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
                  <LineChart data={financialStats?.map(stat => ({
                    type: stat.type,
                    amount: stat.totalAmount,
                    currency: stat.currency,
                    status: stat.status
                  })) || []}>
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

        <TabsContent value="teachers" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Teacher Management</h2>
            <Button onClick={() => setIsCreateTeacherOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </div>
          <TeacherList />
          <CreateTeacherDialog 
            open={isCreateTeacherOpen}
            onOpenChange={setIsCreateTeacherOpen}
          />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Class Management</h2>
            <Button onClick={() => setIsCreateClassOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </div>
          <ClassList />
          <CreateClassDialog 
            open={isCreateClassOpen}
            onOpenChange={setIsCreateClassOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}