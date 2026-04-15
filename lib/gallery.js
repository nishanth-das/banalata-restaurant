import { supabase } from './supabaseClient';
import { ADMIN_EMAILS } from './admins';

/**
 * Optimizes an image: 
 * 1. Converts to WebP
 * 2. Compresses to keep size < 1MB
 * 3. Resizes if dimensions are extreme
 */
export const optimizeImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions (e.g., 1920px width/height)
        const MAX_DIM = 1920;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Quality starts at 0.8 and drops until < 1MB if needed
        let quality = 0.8;
        const convert = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Canvas conversion failed'));
              
              // If still > 1MB and quality is high, try compressing more
              if (blob.size > 1024 * 1024 && q > 0.3) {
                convert(q - 0.1);
              } else {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
              }
            },
            'image/webp',
            q
          );
        };
        convert(quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Uploads an image to gallery
 */
export const uploadGalleryImage = async (file, description, userId, isAdmin = false) => {
  try {
    // 1. Optimize
    const optimizedFile = await optimizeImage(file);

    // 2. Upload to Storage
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, optimizedFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    // 3. Save to Database
    const { data: dbEntry, error: dbError } = await supabase
      .from('gallery')
      .insert([{
        image_url: publicUrl,
        description: description,
        user_id: userId,
        is_approved: isAdmin, // Admins are auto-approved
        is_admin_upload: isAdmin
      }])
      .select();

    if (dbError) throw dbError;
    return dbEntry[0];
  } catch (error) {
    console.error('[Gallery] Upload error:', error);
    throw error;
  }
};

/**
 * Fetch approved gallery images (Public)
 */
export const fetchApprovedImages = async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('[Gallery] Fetch error:', error.message);
      throw error;
    }
    return data;
};

/**
 * Fetch pending gallery images (Admin Only)
 */
export const fetchPendingImages = async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error('[Gallery] Fetch pending error:', error.message);
      throw error;
    }
    return data;
};

/**
 * Moderate image (Approve/Delete)
 */
export const moderateImage = async (id, action) => {
    if (action === 'approve') {
        const { error } = await supabase
            .from('gallery')
            .update({ is_approved: true })
            .eq('id', id);
        if (error) throw error;
    } else if (action === 'delete') {
        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
