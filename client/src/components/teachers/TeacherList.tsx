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
import { Edit2, BookOpen, DollarSign } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SelectTeacher } from "@db/schema";
import TeacherDetailsDialog from "./TeacherDetailsDialog";

export default function TeacherList() {
  const [selectedTeacher, setSelectedTeacher] = useState<SelectTeacher | null>(null);

  const { data: teachers, isLoading, error } = useQuery<SelectTeacher[]>({
    queryKey: ["/api/teachers"],
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
        <p className="text-destructive">Error loading teachers: {error.message}</p>
      </div>
    );
  }

  if (!teachers || teachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No teachers found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {teachers.map((teacher) => (
        <Card key={teacher.userId}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {teacher.user?.fullName || 'Unknown Teacher'}
                    {teacher.user?.isActive ? (
                      <Badge variant="default" className="ml-2">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{teacher.residenceCity || 'Location not specified'}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedTeacher(teacher)}
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
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Hourly Rate:</span>
                <span>${teacher.baseSalaryPerHour || '0'}/hr</span>
              </div>

              {teacher.bio && (
                <div>
                  <span className="font-medium">Bio:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{teacher.bio}</p>
                </div>
              )}

              <div>
                <span className="font-medium">Rating:</span>
                <span className="ml-2">{teacher.rating ? `${teacher.rating}/5` : 'No ratings yet'}</span>
              </div>

              <div>
                <span className="font-medium">Contact:</span>
                <div className="mt-1 text-sm">
                  <p>{teacher.user?.email || 'No email provided'}</p>
                  {teacher.user?.phone && <p>Phone: {teacher.user.phone}</p>}
                  {teacher.user?.whatsapp && <p>WhatsApp: {teacher.user.whatsapp}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedTeacher && (
        <TeacherDetailsDialog
          teacher={selectedTeacher}
          open={true}
          onOpenChange={(open) => !open && setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}