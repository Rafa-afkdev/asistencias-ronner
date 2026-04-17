import { addDocument, deleteDocument, getCollection, getDocument, updateDocument } from "./firebase";
import { Profesor } from "./types";

const COLLECTION_NAME = "profesores";

export const getProfesores = async (): Promise<Profesor[]> => {
  const data = await getCollection(COLLECTION_NAME);
  return data as Profesor[];
};

export const getProfesor = async (id: string): Promise<Profesor | undefined> => {
  const data = await getDocument(`${COLLECTION_NAME}/${id}`);
  if (data) {
    return { id, ...data } as Profesor;
  }
  return undefined;
};

export const createProfesor = async (profesor: Omit<Profesor, "id">) => {
  return await addDocument(COLLECTION_NAME, profesor);
};

export const updateProfesor = async (id: string, profesor: Partial<Profesor>) => {
  return await updateDocument(`${COLLECTION_NAME}/${id}`, profesor);
};

export const disableProfesor = async (id: string) => {
  return await updateDocument(`${COLLECTION_NAME}/${id}`, { activo: false });
};

export const deleteProfesorInfo = async (id: string) => {
  return await deleteDocument(`${COLLECTION_NAME}/${id}`);
};
