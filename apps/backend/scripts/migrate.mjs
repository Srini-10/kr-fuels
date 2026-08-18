import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

function initFirebase() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_ADMIN_* env vars. Run with:  node --env-file=.env.local scripts/migrate.mjs",
    );
  }
  
  const app =
    getApps().find((a) => a.name === "migrate") ??
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket }, "migrate");
    
  return {
    db: getFirestore(app, process.env.FIREBASE_DB ?? "(default)"),
    storage: getStorage(app)
  };
}

export function toCustomSentenceCase(text) {
  if (typeof text !== 'string') return text;
  if (!text) return text;

  const parts = text.split(/(auto\s+lpg)/i);

  let result = '';
  let capitalizeNext = true;

  for (const part of parts) {
    if (part.toLowerCase() === 'auto lpg') {
      result += 'Auto LPG';
      capitalizeNext = false;
      continue;
    }

    for (let i = 0; i < part.length; i++) {
      const char = part[i];
      
      if (/[a-zA-Z]/.test(char)) {
        if (capitalizeNext) {
          result += char.toUpperCase();
          capitalizeNext = false;
        } else {
          result += char.toLowerCase();
        }
      } else {
        result += char;
        if (char === '.' || char === '?' || char === '!' || char === ',' || char === '\n') {
          capitalizeNext = true;
        }
      }
    }
  }

  return result;
}

// Function to recursively process object fields
function processObject(obj, skipKeys = ['url', 'id', 'slug', 'email', 'phone', 'link', 'image', 'video', 'src', 'href']) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'string' ? toCustomSentenceCase(item) : processObject(item, skipKeys));
  }
  
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldSkip = skipKeys.some(skip => lowerKey.includes(skip)) || key === 'id' || key.endsWith('Id') || key === 'createdAt' || key === 'updatedAt';
    
    if (typeof value === 'string' && !shouldSkip) {
      newObj[key] = toCustomSentenceCase(value);
    } else if (typeof value === 'object' && value !== null && !value.toDate) { // skip firebase timestamps
      newObj[key] = processObject(value, skipKeys);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}

async function uploadVideo(storage) {
  const videoPath = "/Users/srinivasanp/Downloads/new video.mp4";
  if (!fs.existsSync(videoPath)) {
    console.error("Video file not found at", videoPath);
    return null;
  }
  
  console.log("Uploading video...");
  const bucket = storage.bucket();
  const destPath = `home-video/new-video-${Date.now()}.mp4`;
  
  await bucket.upload(videoPath, {
    destination: destPath,
    metadata: {
      contentType: 'video/mp4'
    }
  });
  
  await bucket.file(destPath).makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  console.log("Video uploaded:", publicUrl);
  return publicUrl;
}

async function migrateCollection(db, collectionName) {
  const col = db.collection(collectionName);
  const snap = await col.get();
  
  console.log(`Processing collection ${collectionName} (${snap.size} docs)...`);
  let updated = 0;
  
  for (const doc of snap.docs) {
    const data = doc.data();
    const newData = processObject(data);
    
    // Check if anything changed
    let changed = false;
    for (const key of Object.keys(newData)) {
      if (JSON.stringify(data[key]) !== JSON.stringify(newData[key])) {
        changed = true;
        break;
      }
    }
    
    if (changed) {
      newData.updatedAt = FieldValue.serverTimestamp();
      await doc.ref.update(newData);
      updated++;
    }
  }
  console.log(`Updated ${updated} docs in ${collectionName}.`);
}

async function main() {
  const { db, storage } = initFirebase();
  
  // 1. Upload Video
  const videoUrl = await uploadVideo(storage);
  
  if (videoUrl) {
    // Update settings/site
    console.log("Updating settings/site with new video URL...");
    const siteRef = db.collection('settings').doc('site');
    await siteRef.set({ homeVideoUrl: videoUrl, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    
    // Update about/content
    console.log("Updating about/content with new video URL...");
    const aboutRef = db.collection('about').doc('content');
    await aboutRef.set({ videoUrl: videoUrl, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  
  // 2. Migrate Text Formatting for Collections
  const collectionsToMigrate = ['products', 'stations', 'faqKrfuels', 'testimonials', 'heroImages', 'seoSettings'];
  for (const col of collectionsToMigrate) {
    await migrateCollection(db, col);
  }
  
  // Also migrate singletons
  console.log("Migrating singleton settings/site...");
  const siteRef = db.collection('settings').doc('site');
  const siteSnap = await siteRef.get();
  if (siteSnap.exists) {
    const newData = processObject(siteSnap.data());
    let changed = false;
    for (const key of Object.keys(newData)) {
      if (JSON.stringify(siteSnap.data()[key]) !== JSON.stringify(newData[key])) {
        changed = true; break;
      }
    }
    if (changed) {
      await siteRef.update(newData);
      console.log("Updated settings/site text.");
    }
  }
  
  console.log("Migrating singleton about/content...");
  const aboutRef = db.collection('about').doc('content');
  const aboutSnap = await aboutRef.get();
  if (aboutSnap.exists) {
    const newData = processObject(aboutSnap.data());
    let changed = false;
    for (const key of Object.keys(newData)) {
      if (JSON.stringify(aboutSnap.data()[key]) !== JSON.stringify(newData[key])) {
        changed = true; break;
      }
    }
    if (changed) {
      await aboutRef.update(newData);
      console.log("Updated about/content text.");
    }
  }
  
  console.log("Migration complete.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
