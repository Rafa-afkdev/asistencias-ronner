import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: AttendanceStatus | "";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  switch (status) {
    case "Presente":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Presente</Badge>;
    case "Tarde":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-black">Tarde</Badge>;
    case "No Justificado":
      return <Badge variant="destructive">No Justificado</Badge>;
    case "Justificada":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Justificada</Badge>;
    default:
      return null;
  }
}
