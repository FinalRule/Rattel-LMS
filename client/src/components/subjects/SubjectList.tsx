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
import { Edit2, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import EditSubjectDialog from "./EditSubjectDialog";
import { Subject } from "@db/schema";

export default function SubjectList() {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {subjects?.map((subject) => (
        <Card key={subject.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>{subject.category}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingSubject(subject)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div>
                <span className="font-medium">Difficulty Level:</span>{" "}
                {subject.difficultyLevel}
              </div>
              <div>
                <span className="font-medium">Sessions per Month:</span>{" "}
                {subject.sessionsPerMonth}
              </div>
              <div>
                <span className="font-medium">Available Durations:</span>{" "}
                {subject.availableDurations?.join(", ")} minutes
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingSubject && (
        <EditSubjectDialog
          subject={editingSubject}
          open={true}
          onOpenChange={(open) => !open && setEditingSubject(null)}
        />
      )}
    </div>
  );
}
