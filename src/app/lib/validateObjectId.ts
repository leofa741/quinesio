// app/lib/validateObjectId.ts
export const isValidObjectId = (id: string): boolean => {
  // ObjectId de MongoDB: 24 caracteres hexadecimales
  return /^[0-9a-fA-F]{24}$/.test(id);
};