"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface JustifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesorNombre: string;
  onSave: (motivo: string) => void;
  initialMotivo?: string;
}

export function JustifyModal({ open, onOpenChange, profesorNombre, onSave, initialMotivo = "" }: JustifyModalProps) {
  const [motivo, setMotivo] = useState(initialMotivo);

  useEffect(() => {
    if (open) {
      setMotivo(initialMotivo);
    }
  }, [open, initialMotivo]);

  const handleSave = () => {
    if (motivo.trim().length > 0) {
      onSave(motivo);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Justificar Inasistencia</DialogTitle>
          <DialogDescription>
            Ingrese el motivo de la justificación para {profesorNombre}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Ej: Cita médica, Problemas de transporte, etc."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={motivo.trim().length === 0}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
