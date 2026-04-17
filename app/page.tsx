"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProfesores } from "@/lib/profesores";
import { saveAsistencias, getAsistenciasByDate } from "@/lib/asistencias";
import { Profesor, AsistenciaRow, AttendanceStatus, DiaSemana, DIAS_SEMANA } from "@/lib/types";
import { JustifyModal } from "@/components/justify-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fecha, setFecha] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(
    // Try to match current day
    DIAS_SEMANA[new Date().getDay() - 1] || "Lunes"
  );
  
  const [asistencias, setAsistencias] = useState<Record<string, AsistenciaRow>>({});
  
  const [justifyModalOpen, setJustifyModalOpen] = useState(false);
  const [currentProfesorToJustify, setCurrentProfesorToJustify] = useState<{id: string, nombre: string} | null>(null);
  const [profesoresRegistrados, setProfesoresRegistrados] = useState<Set<string>>(new Set());

  // Single effect to load data when `fecha` changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getProfesores();
        const activos = data.filter(p => p.activo !== false);
        setProfesores(activos);
        
        const registrosDate = await getAsistenciasByDate(fecha);
        const registradosIds = new Set(registrosDate.map(r => r.profesorId));
        setProfesoresRegistrados(registradosIds);

        const initialAsistencias: Record<string, AsistenciaRow> = {};
        activos.forEach(p => {
          const registroExistente = registrosDate.find(r => r.profesorId === p.id);
          if (registroExistente) {
            initialAsistencias[p.id] = {
              profesorId: p.id,
              profesorNombre: p.nombre,
              status: registroExistente.status as AttendanceStatus,
              motivo: registroExistente.motivo || ""
            };
          } else {
            initialAsistencias[p.id] = {
              profesorId: p.id,
              profesorNombre: p.nombre,
              status: "",
              motivo: ""
            };
          }
        });
        setAsistencias(initialAsistencias);

      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar la información inicial.");
      } finally {
        setLoading(false);
      }
    };

    if (fecha) {
      loadData();
    }
  }, [fecha]);

  const handleStatusChange = (profesorId: string, nombre: string, value: string) => {
    const newStatus = value as AttendanceStatus;
    
    setAsistencias(prev => ({
      ...prev,
      [profesorId]: {
        ...prev[profesorId],
        status: newStatus,
        // Reset motive if not 'Justificada'
        motivo: newStatus !== "Justificada" ? "" : prev[profesorId].motivo,
      }
    }));

    if (newStatus === "Justificada") {
      setCurrentProfesorToJustify({ id: profesorId, nombre });
      setJustifyModalOpen(true);
    }
  };

  const handleSaveJustification = (motivo: string) => {
    if (currentProfesorToJustify) {
      setAsistencias(prev => ({
        ...prev,
        [currentProfesorToJustify.id]: {
          ...prev[currentProfesorToJustify.id],
          motivo
        }
      }));
    }
  };

  const handleSaveAll = async () => {
    // Collect data to save
    const recordsToSave = Object.values(asistencias)
      .filter(a => a.status !== "" && !profesoresRegistrados.has(a.profesorId))
      .map(a => ({
        profesorId: a.profesorId,
        profesorNombre: a.profesorNombre,
        fecha,
        diaSemana,
        status: a.status as AttendanceStatus,
        motivo: a.motivo
      }));

    if (recordsToSave.length === 0) {
      toast.error("No hay nuevas asistencias marcadas para guardar.");
      return;
    }

    setSaving(true);
    
    try {
      const result = await saveAsistencias(recordsToSave);
      
      if (result.success) {
        // Marcamos los guardados como registrados
        const newSet = new Set(profesoresRegistrados);
        recordsToSave.forEach(r => newSet.add(r.profesorId));
        setProfesoresRegistrados(newSet);
        
        toast.success("Asistencias guardadas exitosamente.");
      } else {
        toast.error("Hubo un error al guardar las asistencias.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const hasMissingStatus = Object.values(asistencias).some(a => a.status === "" && !profesoresRegistrados.has(a.profesorId));

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha</label>
          <Input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            className="w-[200px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Día de Semana</label>
          <Select value={diaSemana} onValueChange={(v) => setDiaSemana(v as DiaSemana)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIAS_SEMANA.map(dia => (
                <SelectItem key={dia} value={dia}>{dia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1" />
      </div>

      {profesores.length > 0 && profesoresRegistrados.size === profesores.length && (
        <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm font-medium">
          Ya se completó el registro de asistencias para todos los profesores en esta fecha. No es posible generar duplicados.
        </div>
      )}
      {profesores.length > 0 && profesoresRegistrados.size > 0 && profesoresRegistrados.size < profesores.length && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-md text-sm font-medium">
          Algunos profesores ya tienen su asistencia registrada en esta fecha. Selecciona el estado de los docentes faltantes.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registro Diario de Profesores</CardTitle>
          <CardDescription>
            Selecciona el estado de asistencia para cada profesor.
            {hasMissingStatus && <span className="text-amber-500 ml-2 font-medium">Faltan profesores por registrar.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesor</TableHead>
                  <TableHead className="w-[250px]">Estado de Asistencia</TableHead>
                  <TableHead>Visualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      No hay profesores registrados. Ve a la sección de Profesores para añadirlos.
                    </TableCell>
                  </TableRow>
                ) : (
                  profesores.map((profesor) => {
                    const rowData = asistencias[profesor.id];
                    return (
                      <TableRow key={profesor.id}>
                        <TableCell className="font-medium">{profesor.nombre}</TableCell>
                        <TableCell>
                          <Select 
                            value={rowData?.status || ""} 
                            onValueChange={(val) => handleStatusChange(profesor.id, profesor.nombre, val)}
                            disabled={profesoresRegistrados.has(profesor.id)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Presente">🟢 Presente</SelectItem>
                              <SelectItem value="Tarde">🟡 Tarde</SelectItem>
                              <SelectItem value="No Justificado">🔴 No Justificado</SelectItem>
                              <SelectItem value="Justificada">🔵 Justificada</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <StatusBadge status={rowData?.status as AttendanceStatus | ""} />
                             {rowData?.status === "Justificada" && rowData.motivo && (
                               <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={rowData.motivo}>
                                 ({rowData.motivo})
                               </span>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSaveAll} 
        disabled={saving || profesores.length === 0 || (profesoresRegistrados.size === profesores.length)}
        className="w-full"
        size="lg"
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Nuevas Asistencias
      </Button>

      <JustifyModal
        open={justifyModalOpen}
        onOpenChange={setJustifyModalOpen}
        profesorNombre={currentProfesorToJustify?.nombre || ""}
        onSave={handleSaveJustification}
        initialMotivo={currentProfesorToJustify ? asistencias[currentProfesorToJustify.id]?.motivo : ""}
      />
    </div>
  );
}
