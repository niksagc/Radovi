import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = createAdminClient();

  try {
    console.log('Creating storage buckets...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const requiredBuckets = ['orders', 'preorders'];
    
    for (const bucketName of requiredBuckets) {
      const exists = buckets?.find((b: any) => b.name === bucketName);
      if (!exists) {
        const { error: bErr } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10737418240, // 10GB
        });
        if (bErr) {
          console.error(`Error creating bucket ${bucketName}:`, bErr);
          throw bErr;
        } else {
          console.log(`Bucket ${bucketName} created successfully`);
        }
      } else {
        console.log(`Bucket ${bucketName} already exists`);
      }
    }

    return NextResponse.json({ success: true, message: 'Storage buckets created successfully' });
  } catch (error: any) {
    console.error('Setup storage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
