// lib/storage/cloudinary.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

// Type definitions matching backend UploadResult
interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  resourceType: string;
}

// Upload options matching backend
interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  transformation?: Record<string, unknown>;
  overwrite?: boolean;
  format?: string;
}

// Type definitions for Firebase Callable responses
interface CloudinaryUploadResult {
  success: boolean;
  data: UploadResult;
  error?: string;
}

interface CloudinaryDeleteResult {
  success: boolean;
  data?: {
    result: string;
  };
  error?: string;
}

interface CloudinarySignatureResult {
  success: boolean;
  data: {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder?: string;
  };
  error?: string;
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Helper function to get Firebase Functions instance
function getFunctionsInstance() {
  try {
    return getFunctions(getApp());
  } catch {
    return getFunctions();
  }
}

/**
 * Upload profile image to Cloudinary
 * @param file - Image file to upload
 * @param userId - User ID for organizing uploads
 * @returns Cloudinary secure URL
 */
export async function uploadProfileImageCloudinary(
  file: File,
  userId: string
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const functions = getFunctionsInstance();
    const uploadFunction = httpsCallable<
      { file: string; folder: string; tags: string[]; format?: string },
      CloudinaryUploadResult
    >(functions, "uploadImageToCloudinary");

    const result = await uploadFunction({
      file: base64,
      folder: `profileImages/${userId}`,
      tags: ["profile", "user", userId],
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Upload failed");
    }

    return result.data.data.secureUrl;
  } catch (error) {
    console.error("Error uploading profile image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload brand image to Cloudinary
 * @param file - Image file to upload
 * @param uid - Brand/User ID for organizing uploads
 * @returns Cloudinary secure URL
 */
export async function uploadBrandImageCloudinary(
  file: File,
  uid: string,
  options?: { format?: string }
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const functions = getFunctionsInstance();
    const uploadFunction = httpsCallable<
      { file: string; folder: string; tags: string[]; format?: string },
      CloudinaryUploadResult
    >(functions, "uploadImageToCloudinary");

    const result = await uploadFunction({
      file: base64,
      folder: `brandImages/${uid}`,
      tags: ["brand", "logo", uid],
      ...(options?.format && { format: options.format }),
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Upload failed");
    }

    return result.data.data.secureUrl;
  } catch (error) {
    console.error("Error uploading brand image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload content image to Cloudinary
 * @param file - Image file to upload
 * @param userId - User ID for organizing uploads
 * @returns Cloudinary secure URL
 */
export async function uploadContentImageCloudinary(
  file: File,
  userId: string
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const functions = getFunctionsInstance();
    const uploadFunction = httpsCallable<
      { file: string; folder: string; tags: string[]; format?: string },
      CloudinaryUploadResult
    >(functions, "uploadImageToCloudinary");

    const result = await uploadFunction({
      file: base64,
      folder: `contentImages/${userId}`,
      tags: ["content", "user-upload", userId],
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Upload failed");
    }

    return result.data.data.secureUrl;
  } catch (error) {
    console.error("Error uploading content image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Generic function to upload image to Cloudinary with custom options
 * @param file - Image file to upload
 * @param options - Upload options (folder, tags, publicId, etc.)
 * @returns Cloudinary secure URL
 */
export async function uploadImageCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const functions = getFunctionsInstance();
    const uploadFunction = httpsCallable<
      { file: string; folder?: string; tags?: string[]; publicId?: string; format?: string },
      CloudinaryUploadResult
    >(functions, "uploadImageToCloudinary");

    const result = await uploadFunction({
      file: base64,
      folder: options.folder,
      tags: options.tags,
      publicId: options.publicId,
      format: options.format,
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Upload failed");
    }

    return result.data.data.secureUrl;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload video to Cloudinary
 * @param file - Video file to upload
 * @param options - Upload options (folder, tags, publicId, etc.)
 * @returns Object containing secure URL and video metadata
 */
export async function uploadVideoCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<{ url: string; duration?: number; publicId: string; bytes: number }> {
  try {
    const base64 = await fileToBase64(file);
    const functions = getFunctionsInstance();
    const uploadFunction = httpsCallable<
      { file: string; folder?: string; tags?: string[]; publicId?: string },
      CloudinaryUploadResult
    >(functions, "uploadVideoToCloudinary");

    const result = await uploadFunction({
      file: base64,
      folder: options.folder,
      tags: options.tags,
      publicId: options.publicId,
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Upload failed");
    }

    return {
      url: result.data.data.secureUrl,
      duration: result.data.data.duration,
      publicId: result.data.data.publicId,
      bytes: result.data.data.bytes,
    };
  } catch (error) {
    console.error("Error uploading video to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload content video to Cloudinary
 * @param file - Video file to upload
 * @param userId - User ID for organizing uploads
 * @returns Object containing secure URL and video metadata
 */
export async function uploadContentVideoCloudinary(
  file: File,
  userId: string
): Promise<{ url: string; duration?: number; publicId: string; bytes: number }> {
  return uploadVideoCloudinary(file, {
    folder: `contentVideos/${userId}`,
    tags: ["content", "video", userId],
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The Cloudinary public ID of the file
 * @param resourceType - Type of resource ('image', 'video', or 'raw')
 * @returns Success boolean
 */
export async function deleteFileCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<boolean> {
  try {
    const functions = getFunctionsInstance();
    const deleteFunction = httpsCallable<
      { publicId: string; resourceType: "image" | "video" | "raw" },
      CloudinaryDeleteResult
    >(functions, "deleteFileFromCloudinary");

    const result = await deleteFunction({
      publicId,
      resourceType,
    });

    return result.data.success;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
}

/**
 * Get signed upload parameters for direct client-side uploads (for large files)
 * @param options - Upload options including folder, tags, resourceType, etc.
 * @returns Signature data for direct upload
 */
export async function getCloudinaryUploadSignature(
  options: UploadOptions & { resourceType?: "image" | "video" | "raw" } = {}
): Promise<CloudinarySignatureResult["data"]> {
  try {
    const functions = getFunctionsInstance();
    const getSignature = httpsCallable<
      { folder?: string; tags?: string[]; publicId?: string; resourceType?: string },
      CloudinarySignatureResult
    >(functions, "getCloudinarySignature");

    const result = await getSignature({
      folder: options.folder,
      tags: options.tags,
      publicId: options.publicId,
      resourceType: options.resourceType,
    });

    if (!result.data.success) {
      throw new Error(result.data.error || "Failed to get signature");
    }

    return result.data.data;
  } catch (error) {
    console.error("Error getting Cloudinary signature:", error);
    throw error;
  }
}

/**
 * Direct upload to Cloudinary (better for large files)
 * Uses signed upload URL to bypass Firebase Functions payload limits
 * @param file - File to upload
 * @param options - Upload options (folder, tags, resourceType, etc.)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Cloudinary secure URL
 */
export async function uploadFileDirectCloudinary(
  file: File,
  options: UploadOptions & { resourceType?: "image" | "video" | "raw" } = {},
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const resourceType = options.resourceType || "image";
    
    // Get signed upload parameters
    const { signature, timestamp, apiKey, cloudName, folder } =
      await getCloudinaryUploadSignature(options);

    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", apiKey);
    
    if (folder) {
      formData.append("folder", folder);
    }
    
    // Add tags if provided
    if (options.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }
    
    // Add public_id if provided
    if (options.publicId) {
      formData.append("public_id", options.publicId);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // Upload with progress tracking if callback provided
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve(result.secure_url);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Upload failed"))
        );

        xhr.open("POST", uploadUrl);
        xhr.send(formData);
      });
    } else {
      // Simple fetch upload without progress tracking
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.secure_url;
    }
  } catch (error) {
    console.error("Error uploading file directly to Cloudinary:", error);
    throw error;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * Useful for deleting files
 * @param url - Cloudinary secure URL
 * @returns Public ID
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/file.jpg
    const matches = url.match(/\/v\d+\/(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

