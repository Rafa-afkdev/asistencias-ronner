import { writeBatch, doc, collection, serverTimestamp, where } from "firebase/firestore";
import { db, getCollection } from "./firebase";
import { Asistencia } from "./types";

const COLLECTION_NAME = "asistencias";

export const saveAsistencias = async (asistencias: Omit<Asistencia, "id">[]) => {
  try {
    const batch = writeBatch(db);
    const asistenciasRef = collection(db, COLLECTION_NAME);
    
    asistencias.forEach((asistencia) => {
      const newDocRef = doc(asistenciasRef);
      batch.set(newDocRef, {
        ...asistencia,
        createAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error saving asistencias:", error);
    return { success: false, error };
  }
};

export const getAsistenciasByDate = async (fecha: string): Promise<Asistencia[]> => {
  const data = await getCollection(COLLECTION_NAME, [where("fecha", "==", fecha)]);
  return data as Asistencia[];
};

export const getAllAsistencias = async (): Promise<Asistencia[]> => {
  const data = await getCollection(COLLECTION_NAME);
  return data.map((doc: any) => {
      // Manejar el createAt timestamp si viene de firestore
      return doc;
  }) as Asistencia[];
};
