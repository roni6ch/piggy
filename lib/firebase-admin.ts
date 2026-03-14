import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;

function getAdminFirestore(): admin.firestore.Firestore {
  if (firestore) return firestore;

  if (!admin.apps.length) {
    const credential = getCredential();
    admin.initializeApp({ credential });
  }

  firestore = admin.firestore();
  return firestore;
}

function getCredential(): admin.credential.Credential {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      const parsed = JSON.parse(key) as admin.ServiceAccount;
      return admin.credential.cert(parsed);
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path) {
    try {
      const fs = require('fs');
      const pathModule = require('path');
      const resolved = pathModule.isAbsolute(path) ? path : pathModule.resolve(process.cwd(), path);
      if (!fs.existsSync(resolved)) {
        throw new Error(`File not found: ${resolved}. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid path or use FIREBASE_SERVICE_ACCOUNT_KEY with the JSON content.`);
      }
      const content = fs.readFileSync(resolved, 'utf8');
      const parsed = JSON.parse(content) as admin.ServiceAccount;
      return admin.credential.cert(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH: ${msg}`);
    }
  }
  return admin.credential.applicationDefault();
}

export { getAdminFirestore as getFirestore };

let storage: admin.storage.Storage | null = null;

export function getStorageBucket(): admin.storage.Storage | null {
  if (storage) return storage;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;
  if (!admin.apps.length) {
    const credential = getCredential();
    admin.initializeApp({ credential });
  }
  storage = admin.storage();
  return storage;
}
