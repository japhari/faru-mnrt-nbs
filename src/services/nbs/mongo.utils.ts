import { ObjectId } from 'mongodb';

export function parseIdValue(idRaw: string, idField: string): any {
  if (idField === '_id' && ObjectId.isValid(idRaw)) {
    return new ObjectId(idRaw);
  }
  if (/^\d+$/.test(idRaw)) {
    return Number(idRaw);
  }
  return idRaw;
}

export function extractDbName(mongoUrl: string): string {
  const withoutParams = mongoUrl.split('?')[0];
  const idx = withoutParams.lastIndexOf('/');
  if (idx !== -1 && idx < withoutParams.length - 1) {
    return withoutParams.slice(idx + 1);
  }
  return 'faru-mnrt';
}
