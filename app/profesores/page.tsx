"use client";

import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { getProfesores, createProfesor, updateProfesor, disableProfesor } from "@/lib/profesores";
import { Profesor } from "@/lib/types";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProfesor, setCurrentProfesor] = useState<Partial<Profesor>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfesores();
  }, []);

  const loadProfesores = async () => {
    setLoading(true);
    try {
      const data = await getProfesores();
      // Solo mostrar los activos
      setProfesores(data.filter(p => p.activo !== false));
    } catch (error) {
      console.error("Error al cargar profesores", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentProfesor({ nombre: "", activo: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profesor: Profesor) => {
    setCurrentProfesor({ ...profesor });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar a este profesor?")) {
      // Optimistic delete
      setProfesores(prev => prev.filter(p => p.id !== id));
      try {
        await disableProfesor(id);
        toast.success("Profesor eliminado correctamente.");
      } catch (error) {
        console.error("Error eliminando", error);
        toast.error("Error al eliminar el profesor.");
        loadProfesores(); // Revert
      }
    }
  };

  const handleSave = async () => {
    if (!currentProfesor.nombre) {
      toast.error("Por favor complete el nombre.");
      return;
    }

    // Optimistic UI Update
    const tempId = isEditing && currentProfesor.id ? currentProfesor.id : "temp-" + Date.now();
    const isNew = !isEditing;
    const optimicticProfesor: Profesor = {
      id: tempId,
      nombre: currentProfesor.nombre,
      activo: true
    };
    
    if (isNew) {
      setProfesores(prev => [...prev, optimicticProfesor]);
    } else {
      setProfesores(prev => prev.map(p => p.id === tempId ? optimicticProfesor : p));
    }
    setIsModalOpen(false); // Close instantly

    setSaving(true);
    try {
      if (isEditing && currentProfesor.id) {
        await updateProfesor(currentProfesor.id, currentProfesor);
        toast.success("Profesor actualizado exitosamente.");
      } else {
        await createProfesor({
          nombre: currentProfesor.nombre!,
          activo: true
        });
        toast.success("Profesor registrado exitosamente.");
        // Reload to get actual ID for new creations
        loadProfesores();
      }
    } catch (error) {
      console.error("Error guardando", error);
      toast.error("Hubo un error al guardar el profesor.");
      loadProfesores(); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Profesores</h2>
          <p className="text-muted-foreground">Administra el personal docente de la institución.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Profesor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : profesores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                    No hay profesores registrados.
                  </TableCell>
                </TableRow>
              ) : (
                profesores.map((profesor) => (
                  <TableRow key={profesor.id}>
                    <TableCell className="font-medium">{profesor.nombre}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEdit(profesor)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(profesor.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Profesor" : "Nuevo Profesor"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica los datos del profesor." : "Ingresa los datos para registrar un nuevo docente."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input 
                value={currentProfesor.nombre || ""} 
                onChange={e => setCurrentProfesor({...currentProfesor, nombre: e.target.value})} 
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
