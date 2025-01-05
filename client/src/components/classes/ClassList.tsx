import { useQuery } from "@tanstack/react-query";
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
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Edit2,
  BookOpen
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SelectClass } from "@db/schema";
import ClassDetailsDialog from "./ClassDetailsDialog";

export default function ClassList() {
  const [selectedClass, setSelectedClass] = useState<SelectClass | null>(null);

  const { data: classes, isLoading, error } = useQuery<SelectClass[]>({
    queryKey: ["/api/classes"],
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
        <p className="text-destructive">Error loading classes: {error.message}</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No classes found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {classes.map((classItem) => (
        <Card key={classItem.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {classItem.name}
                  <Badge variant="default" className="ml-2">
                    {classItem.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Teacher: {classItem.teacher?.user?.fullName || 'Unassigned'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedClass(classItem)}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Starts: {new Date(classItem.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.defaultDuration} minutes/session</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Students: {classItem.enrollments?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{classItem.monthlyPrice} {classItem.currency}/month</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Schedule</h4>
                <div className="text-sm text-muted-foreground">
                  {JSON.stringify(classItem.schedule)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedClass && (
        <ClassDetailsDialog
          classData={selectedClass}
          open={true}
          onOpenChange={(open) => !open && setSelectedClass(null)}
        />
      )}
    </div>
  );
}
