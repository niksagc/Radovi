'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function deleteInquiryAction(id: string, filePaths: string[] = []) {
  const supabase = createAdminClient();

  // 1. Delete files from storage
  if (filePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('preorders')
      .remove(filePaths);
    
    if (storageError) {
      console.error('Error deleting files from storage:', storageError);
    }
  }

  // 2. Delete the record
  const { error } = await supabase
    .from('preorder_contacts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inquiry record:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/zatrazeni-upiti');
  revalidatePath('/admin');
  return { success: true };
}

export async function markAsRepliedAction(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('preorder_contacts')
    .update({ status: 'replied' })
    .eq('id', id);

  if (error) {
    console.error('Error updating inquiry status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/zatrazeni-upiti');
  return { success: true };
}
