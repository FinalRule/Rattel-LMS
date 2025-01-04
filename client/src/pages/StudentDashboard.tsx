import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

export default function StudentDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ["/api/analytics/student-progress"],
  });

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ["/api/resources"],
  });

  if (loadingSessions || loadingProgress || loadingResources) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Student Dashboard</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Next Session</CardTitle>
                <CardDescription>Upcoming class</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions?.[0] ? (
                  <div className="space-y-2">
                    <p className="font-medium">{sessions[0].subject}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sessions[0].dateTime).toLocaleString()}
                    </p>
                    <Button className="w-full">Join Class</Button>
                  </div>
                ) : (
                  <p>No upcoming sessions</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>Your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress?.overallProgress || 0} className="mb-2" />
                <p className="text-sm text-gray-500">
                  {progress?.overallProgress}% Complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Resources</CardTitle>
                <CardDescription>Latest learning materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resources?.slice(0, 3).map((resource: any) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">{resource.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>Your upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
                <div className="space-y-4">
                  {sessions?.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{session.subject}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(session.dateTime).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline">Join</Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Resources</CardTitle>
              <CardDescription>Access your study materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources?.map((resource: any) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>{resource.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        View Resource
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Track your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progress?.subjects?.map((subject: any) => (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{subject.name}</h3>
                      <span>{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
