import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pathParam = searchParams.get('path');

  if (!id && !pathParam) {
    return NextResponse.json({ error: 'Missing id or path' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let filePath = pathParam;
  let filename = 'download';

  if (id) {
    const { data: file, error } = await supabase
      .from('files')
      .select('*, orders(student_id)')
      .eq('id', id)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && file.orders?.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (file.is_locked && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'File is locked pending payment' }, { status: 403 });
    }

    filePath = file.path;
    filename = file.filename;
  }

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  // Generate signed URL
  const { data, error: signedUrlError } = await supabase.storage
    .from('orders')
    .createSignedUrl(filePath, 60, { download: filename });

  if (signedUrlError || !data) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
