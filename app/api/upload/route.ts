import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filePath = formData.get('filePath') as string;
    const bucket = formData.get('bucket') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file || !filePath || !bucket) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    
    // Check if bucket exists, if not create it
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.find((b: any) => b.name === bucket);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucket, {
        public: isPublic,
        fileSizeLimit: 10737418240, // 10GB
      });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
