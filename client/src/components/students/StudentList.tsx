import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SelectStudent } from "@db/schema";
import StudentDetailsDialog from "./StudentDetailsDialog";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StudentList() {
  const [selectedStudent, setSelectedStudent] = useState<SelectStudent | null>(null);

  const { data: students, isLoading, error } = useQuery<SelectStudent[]>({
    queryKey: ["/api/students"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load students. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!students?.length) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No students found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.userId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedStudent(student)}
              >
                <TableCell className="font-medium">
                  {student.user?.fullName || 'N/A'}
                </TableCell>
                <TableCell>{student.user?.email || 'N/A'}</TableCell>
                <TableCell>{student.user?.phone || 'N/A'}</TableCell>
                <TableCell>{student.countryOfResidence || 'N/A'}</TableCell>
                <TableCell>{student.parentName || 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.user?.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.user?.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StudentDetailsDialog
        student={selectedStudent}
        open={!!selectedStudent}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
      />
    </>
  );
}