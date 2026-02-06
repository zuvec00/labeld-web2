// lib/firebase/storage/upload.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

// Cloudinary imports
import {
  uploadProfileImageCloudinary,
  uploadBrandImageCloudinary,
  uploadContentImageCloudinary,
} from "./cloudinary";

export async function uploadProfileImageWeb(file: File, userId: string) {
  try {
    // Try Cloudinary First
    return await uploadProfileImageCloudinary(file, userId);
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to Firebase Storage", error);
    // Fallback to Firebase Storage
    const storage = getStorage(getApp());
    const path = `profileImages/${userId}/${Date.now()}`;
    const r = ref(storage, path);

    // Use the browser-provided MIME type; fall back to image/jpeg
    const contentType = file.type || "image/jpeg";
    await uploadBytes(r, file, { contentType });
    const url = await getDownloadURL(r);
    return url as string;
  }
}


export async function uploadBrandImageWeb(file: File, uid: string) {
  try {
    // Try Cloudinary First
    return await uploadBrandImageCloudinary(file, uid);
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to Firebase Storage", error);
    // Fallback to Firebase Storage
    const storage = getStorage(getApp());
    const path = `brandImages/${uid}/${Date.now()}`;
    const r = ref(storage, path);
    const contentType = file.type || "image/jpeg";
    await uploadBytes(r, file, { contentType });
    return await getDownloadURL(r);
  }
}

export async function uploadContentImageWeb(file: File, userId: string) {
  try {
    // Try Cloudinary First
    return await uploadContentImageCloudinary(file, userId);
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to Firebase Storage", error);
    // Fallback to Firebase Storage
    const storage = getStorage();
    const path = `contentImages/${userId}/${Date.now()}_${file.name}`;
    const r = ref(storage, path);
    const meta = { contentType: file.type || "image/jpeg" };
    await uploadBytes(r, file, meta);
    return await getDownloadURL(r);
  }
}


export async function uploadFileGetURL(file: File, path: string) {
  const storage = getStorage();
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
