import * as admin from 'firebase-admin';

export function timestampToDate(value: admin.firestore.Timestamp | Date | unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value)
    return (value as admin.firestore.Timestamp).toDate();
  if (typeof value === 'string') return new Date(value);
  return new Date();
}

export function dateToFirestore(value: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(value instanceof Date ? value : new Date(value));
}

export function mapDocToObject<T extends Record<string, unknown>>(
  data: Record<string, unknown> | undefined,
  id: string
): T & { _id: string } {
  if (!data) return { _id: id } as T & { _id: string };
  const out: Record<string, unknown> = { _id: id, ...data };
  return out as T & { _id: string };
}
