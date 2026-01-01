import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base-64';

const SUPABASE_URL = 'https://jetyqazmgbucawylpvq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZtgCAEJ1OvcXOYzJhpzs1w_ysRPDrGf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AVATAR_BUCKET = 'avatars';

// Helper: Convert base64 to ArrayBuffer for React Native
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = decode(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Upload image to Supabase Storage using React Native compatible method
export async function uploadAvatar(
  userId: string,
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    console.log('Starting avatar upload for user:', userId);
    
    // Remove data URI prefix if present
    let cleanBase64 = base64Image;
    if (base64Image.includes('base64,')) {
      cleanBase64 = base64Image.split('base64,')[1];
    }
    
    // Generate unique filename
    const fileExt = mimeType === 'image/png' ? 'png' : 'jpeg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    console.log('Uploading file:', fileName);
    
    // Convert base64 to ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(cleanBase64);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    console.log('Upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName);
    
    console.log('Public URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('uploadAvatar error:', error);
    throw new Error(error.message || 'Failed to upload avatar');
  }
}

// Upload from file URI (alternative method)
export async function uploadAvatarFromUri(
  userId: string,
  fileUri: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    console.log('Starting avatar upload from URI for user:', userId);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Generate unique filename
    const fileExt = mimeType === 'image/png' ? 'png' : 'jpeg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    console.log('Uploading file:', fileName);
    
    // Convert base64 to ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(base64);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    console.log('Upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName);
    
    console.log('Public URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('uploadAvatarFromUri error:', error);
    throw new Error(error.message || 'Failed to upload avatar');
  }
}

// Delete avatar from Supabase Storage
export async function deleteAvatar(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (fileName && fileName.includes('_')) {
      console.log('Deleting avatar:', fileName);
      
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([fileName]);
      
      if (error) {
        console.error('Delete error:', error);
      } else {
        console.log('Avatar deleted successfully');
      }
    }
  } catch (error) {
    console.error('deleteAvatar error:', error);
  }
}
