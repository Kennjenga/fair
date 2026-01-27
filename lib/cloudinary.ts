/**
 * Cloudinary integration utilities for file uploads
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Allowed file types for uploads
 */
const ALLOWED_FILE_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'txt', 'md'],
  archive: ['zip', 'tar', 'gz'],
  video: ['mp4', 'webm', 'mov'],
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Upload options interface
 */
export interface UploadOptions {
  allowedFormats?: string[];
  maxFileSize?: number;
  folder?: string;
  transformation?: any;
  tags?: string[];
}

/**
 * Upload result interface
 */
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  resourceType: string;
}

/**
 * Upload a file to Cloudinary with organized folder structure
 * 
 * @param fileBuffer - File buffer or base64 string
 * @param fileName - Original file name
 * @param hackathonId - Hackathon ID for folder organization
 * @param submissionId - Submission ID for subfolder organization (optional)
 * @param options - Upload options
 * @returns Upload result with URLs and metadata
 */
export async function uploadFile(
  fileBuffer: Buffer | string,
  fileName: string,
  hackathonId: string,
  submissionId?: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Extract file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Validate file type
    const allowedFormats = options.allowedFormats || getAllAllowedFormats();
    if (!allowedFormats.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedFormats.join(', ')}`);
    }

    // Validate file size
    const maxSize = options.maxFileSize || MAX_FILE_SIZE;
    const fileSize = Buffer.isBuffer(fileBuffer) ? fileBuffer.length : Buffer.from(fileBuffer, 'base64').length;
    if (fileSize > maxSize) {
      throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(fileName);
    
    // Determine file category for organization
    const fileCategory = getFileCategory(fileExtension);
    
    // Build organized folder structure:
    // fair/hackathons/{hackathonId}/submissions/{submissionId}/{fileCategory}
    // Example: fair/hackathons/abc123/submissions/sub456/images/project_screenshot.jpg
    let folder: string;
    if (options.folder) {
      folder = options.folder;
    } else if (submissionId) {
      folder = `fair/hackathons/${hackathonId}/submissions/${submissionId}/${fileCategory}`;
    } else {
      folder = `fair/hackathons/${hackathonId}/submissions/${fileCategory}`;
    }

    // Determine resource type
    const resourceType = getResourceType(fileExtension);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      Buffer.isBuffer(fileBuffer) ? `data:application/octet-stream;base64,${fileBuffer.toString('base64')}` : fileBuffer,
      {
        folder,
        public_id: uniqueFileName,
        resource_type: resourceType,
        allowed_formats: allowedFormats,
        tags: options.tags || [hackathonId, 'submission'],
        transformation: options.transformation,
      }
    );

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from Cloudinary
 * 
 * @param publicId - Cloudinary public ID
 * @param resourceType - Resource type (image, video, raw)
 */
export async function deleteFile(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a signed URL for secure file access
 * 
 * @param publicId - Cloudinary public ID
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export function getSignedUrl(publicId: string, expiresIn: number = 3600): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    expires_at: timestamp,
  });
}

/**
 * Get all allowed file formats
 */
function getAllAllowedFormats(): string[] {
  return Object.values(ALLOWED_FILE_TYPES).flat();
}

/**
 * Determine resource type based on file extension
 */
function getResourceType(extension: string): 'image' | 'video' | 'raw' {
  if (ALLOWED_FILE_TYPES.image.includes(extension)) {
    return 'image';
  }
  if (ALLOWED_FILE_TYPES.video.includes(extension)) {
    return 'video';
  }
  return 'raw';
}

/**
 * Get file category for folder organization
 */
function getFileCategory(extension: string): string {
  if (ALLOWED_FILE_TYPES.image.includes(extension)) {
    return 'images';
  }
  if (ALLOWED_FILE_TYPES.video.includes(extension)) {
    return 'videos';
  }
  if (ALLOWED_FILE_TYPES.document.includes(extension)) {
    return 'documents';
  }
  if (ALLOWED_FILE_TYPES.archive.includes(extension)) {
    return 'archives';
  }
  return 'other';
}

/**
 * Generate a unique file name
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(`.${extension}`, '').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${baseName}_${timestamp}_${randomString}`;
}

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): boolean {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.error('Cloudinary configuration is incomplete. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    return false;
  }
  
  return true;
}

/**
 * Get upload signature for client-side uploads
 */
export function getUploadSignature(folder: string, tags: string[]): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
} {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    tags: tags.join(','),
  };

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}
