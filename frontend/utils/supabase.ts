import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jetyqazmgbucawylpvq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZtgCAEJ1OvcXOYzJhpzs1w_ysRPDrGf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AVATAR_BUCKET = 'avatars';

// Upload image to Supabase Storage
export async function uploadAvatar(
  userId: string,
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  // Convert base64 to blob
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  // Generate unique filename
  const fileExt = mimeType.split('/')[1] || 'jpeg';
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, blob, {
      contentType: mimeType,
      upsert: true,
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

// Delete avatar from Supabase Storage
export async function deleteAvatar(photoUrl: string): Promise<void> {
  // Extract filename from URL
  const urlParts = photoUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  if (fileName) {
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([fileName]);
    
    if (error) {
      console.error('Delete error:', error);
    }
  }
}
