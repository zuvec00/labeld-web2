// lib/storage/imagekit.ts
//
// Direct browser -> ImageKit uploads, the web counterpart of the mobile app's
// MediaUploadService._uploadFileDirectImageKit.
//
// Studio Mobile moved product media to ImageKit and the backend's
// MEDIA_UPLOAD_ORDER now defaults to "imagekit,firebase" — Cloudinary is out of
// the chain entirely. Web was still POSTing straight to api.cloudinary.com,
// which bypasses that routing and has no fallback, so uploads failed on web
// while mobile kept working. This module replaces that path.
//
// Cloudinary is deliberately NOT a fallback here (same call as mobile made): on
// ImageKit failure we go straight to Firebase Storage.
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

export interface ImageKitUploadOptions {
  folder?: string;
  tags?: string[];
  /** File name to store under. Defaults to the browser-provided name. */
  publicId?: string;
  /**
   * Accepted for signature-compatibility with the Cloudinary helper this
   * replaces. ImageKit uses a single upload endpoint for every media type, so
   * this only informs the Firebase Storage fallback's content type.
   */
  resourceType?: "image" | "video" | "raw";
}

interface ImageKitUploadAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
  uploadUrl: string;
  folder?: string;
}

interface ImageKitAuthResult {
  success: boolean;
  data: ImageKitUploadAuth;
  error?: string;
}

function getFunctionsInstance() {
  try {
    return getFunctions(getApp());
  } catch {
    return getFunctions();
  }
}

/** ImageKit rejects file names containing whitespace. */
function safeFileName(file: File, publicId?: string): string {
  const name = publicId || file.name || `labeld-${Date.now()}.jpg`;
  return name.replace(/\s+/g, "-");
}

/**
 * Fetch short-lived signed upload parameters from the backend.
 * Mirrors MediaUploadService._getImageKitUploadAuth.
 */
export async function getImageKitUploadAuth(
  folder?: string
): Promise<ImageKitUploadAuth> {
  const functions = getFunctionsInstance();
  const getAuth = httpsCallable<{ folder?: string }, ImageKitAuthResult>(
    functions,
    "getImageKitUploadAuth"
  );

  const result = await getAuth(folder ? { folder } : {});

  if (!result.data?.success) {
    throw new Error(
      result.data?.error || "Failed to get ImageKit upload auth"
    );
  }

  return result.data.data;
}

/**
 * Upload straight to Firebase Storage. Used as the fallback when ImageKit is
 * unreachable, so a brand can still save their work.
 */
async function uploadToFirebaseStorage(
  file: File,
  folder: string,
  options: ImageKitUploadOptions,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storage = getStorage(getApp());
  const path = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${safeFileName(
    file,
    options.publicId
  )}`;
  const storageRef = ref(storage, path);

  const contentType =
    file.type || (options.resourceType === "video" ? "video/mp4" : "image/jpeg");

  const task = uploadBytesResumable(storageRef, file, { contentType });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        }
      },
      reject,
      () => resolve()
    );
  });

  return getDownloadURL(task.snapshot.ref);
}

/**
 * Direct upload to ImageKit with optional progress reporting.
 *
 * Drop-in replacement for uploadFileDirectCloudinary — same signature, same
 * return value (the hosted URL).
 *
 * @param file File to upload
 * @param options Upload options (folder, tags, publicId, resourceType)
 * @param onProgress Optional progress callback (0-100)
 * @returns The hosted media URL
 */
export async function uploadFileDirectImageKit(
  file: File,
  options: ImageKitUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<string> {
  const folder = options.folder || "images";

  try {
    const auth = await getImageKitUploadAuth(folder);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("publicKey", auth.publicKey);
    formData.append("signature", auth.signature);
    formData.append("expire", auth.expire.toString());
    formData.append("token", auth.token);
    formData.append("fileName", safeFileName(file, options.publicId));

    // The backend normalizes and returns the folder; prefer its value so web
    // and mobile land in the same place.
    const resolvedFolder = auth.folder || folder;
    if (resolvedFolder) {
      formData.append("folder", resolvedFolder);
    }
    if (options.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    if (onProgress) {
      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (!e.lengthComputable) return;
          try {
            onProgress((e.loaded / e.total) * 100);
          } catch (progressError) {
            // Call sites use a throw from the progress callback to signal
            // cancellation. Abort the request and surface it as a rejection
            // rather than letting it die inside the event handler.
            xhr.abort();
            reject(progressError);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result.url as string);
            } catch {
              reject(new Error("Malformed ImageKit upload response"));
            }
          } else {
            reject(
              new Error(
                `ImageKit direct upload failed with status ${xhr.status}: ${xhr.responseText}`
              )
            );
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("ImageKit direct upload failed"))
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload cancelled"))
        );

        xhr.open("POST", auth.uploadUrl);
        xhr.send(formData);
      });
    }

    const response = await fetch(auth.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `ImageKit direct upload failed with status ${response.status}: ${body}`
      );
    }

    const result = await response.json();
    return result.url as string;
  } catch (error) {
    // An explicit cancellation is not a provider failure — don't retry it
    // against Firebase, just propagate.
    if (error instanceof Error && /cancel/i.test(error.message)) {
      throw error;
    }

    // Log unconditionally (not just in dev) so ImageKit failures stay visible
    // in production, matching the mobile client's behaviour.
    console.error(
      "ImageKit direct upload failed — falling back to Firebase Storage",
      error
    );
    return uploadToFirebaseStorage(file, folder, options, onProgress);
  }
}
