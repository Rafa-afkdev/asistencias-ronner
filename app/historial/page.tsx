"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllAsistencias } from "@/lib/asistencias";
import { Asistencia } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PDFDocument, StandardFonts } from "pdf-lib";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

export default function HistorialPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroProfesor, setFiltroProfesor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const data = await getAllAsistencias();
      // Ordenar por fecha descendente
      data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAsistencias(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
      toast.error("Error al cargar el historial de asistencias.");
    } finally {
      setLoading(false);
    }
  };

  const asistenciasFiltradas = useMemo(() => {
    return asistencias.filter(a => {
      const matchFecha = filtroFecha ? a.fecha === filtroFecha : true;
      const matchProfesor = filtroProfesor ? a.profesorNombre.toLowerCase().includes(filtroProfesor.toLowerCase()) : true;
      const matchStatus = filtroStatus !== "Todos" ? a.status === filtroStatus : true;
      
      return matchFecha && matchProfesor && matchStatus;
    });
  }, [asistencias, filtroFecha, filtroProfesor, filtroStatus]);

  const handleDownloadPdf = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { height } = page.getSize();
      let cursorY = height - 50;

      page.drawText('Reporte de Asistencias', { x: 50, y: cursorY, size: 20, font: fontBold });
      cursorY -= 20;

      const fechaGeneracion = new Date().toLocaleDateString('es-VE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
      page.drawText(`Fecha de emision: ${fechaGeneracion}`, { x: 50, y: cursorY, size: 10, font });
      
      if (filtroFecha) {
         cursorY -= 15;
         page.drawText(`Filtro aplicado: ${formatDate(filtroFecha)}`, { x: 50, y: cursorY, size: 10, font });
      }

      cursorY -= 30;

      // Header table
      page.drawText('Fecha', { x: 50, y: cursorY, size: 10, font: fontBold });
      page.drawText('Día', { x: 120, y: cursorY, size: 10, font: fontBold });
      page.drawText('Profesor', { x: 180, y: cursorY, size: 10, font: fontBold });
      page.drawText('Estado', { x: 350, y: cursorY, size: 10, font: fontBold });
      page.drawText('Motivo', { x: 450, y: cursorY, size: 10, font: fontBold });
      cursorY -= 20;

      // Rows
      asistenciasFiltradas.forEach((asistencia) => {
        if (cursorY < 50) {
          page = pdfDoc.addPage([600, 800]);
          cursorY = 750;
        }

        const formattedDate = formatDate(asistencia.fecha);
        page.drawText(formattedDate, { x: 50, y: cursorY, size: 9, font });
        page.drawText(asistencia.diaSemana || '-', { x: 120, y: cursorY, size: 9, font });
        const nombre = asistencia.profesorNombre || '-';
        page.drawText(nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre, { x: 180, y: cursorY, size: 9, font });
        page.drawText(asistencia.status || '-', { x: 350, y: cursorY, size: 9, font });
        const motivo = asistencia.motivo || '-';
        page.drawText(motivo.length > 20 ? motivo.substring(0, 17) + '...' : motivo, { x: 450, y: cursorY, size: 9, font });

        cursorY -= 15;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF generado exitosamente.");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el reporte en PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historial de Asistencias</h2>
          <p className="text-muted-foreground">Consulta los registros de asistencia pasados.</p>
        </div>
        <Button onClick={handleDownloadPdf} disabled={asistenciasFiltradas.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar a PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por Fecha</label>
          <Input 
            type="date" 
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por Profesor</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Nombre del profesor..." 
              className="pl-8"
              value={filtroProfesor}
              onChange={(e) => setFiltroProfesor(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por Estado</label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Presente">Presente</SelectItem>
              <SelectItem value="Tarde">Tarde</SelectItem>
              <SelectItem value="No Justificado">No Justificado</SelectItem>
              <SelectItem value="Justificada">Justificada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Motivo (Si aplica)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : asistenciasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No se encontraron registros de asistencia con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                asistenciasFiltradas.map((asistencia, index) => (
                  <TableRow key={asistencia.id || index}>
                    <TableCell className="font-medium">{formatDate(asistencia.fecha)}</TableCell>
                    <TableCell>{asistencia.diaSemana}</TableCell>
                    <TableCell>{asistencia.profesorNombre}</TableCell>
                    <TableCell>
                      <StatusBadge status={asistencia.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {asistencia.motivo || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
