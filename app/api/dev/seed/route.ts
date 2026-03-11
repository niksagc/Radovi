import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // TEMPORARILY DISABLED FOR EASY SEEDING
  // if (process.env.NODE_ENV !== 'development' && request.headers.get('x-seed-secret') !== process.env.SEED_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const supabase = createAdminClient();

  try {
    // 1. Get or Create Admin User
    const adminEmail = 'nikola.duric2@skole.hr';
    let adminId: string | undefined;

    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingAdmin = usersData?.users?.find((u: any) => u.email === adminEmail);

    if (existingAdmin) {
      adminId = existingAdmin.id;
      console.log('Admin user already exists:', adminId);
    } else {
      const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: 'yupu8Ev4',
        email_confirm: true,
      });
      if (adminErr) throw adminErr;
      adminId = adminData?.user?.id;
      console.log('Admin user created:', adminId);
    }

    // 2. Get or Create Student User
    const studentEmail = 'ukupac1@studyworks.hr';
    let studentId: string | undefined;

    const existingStudent = usersData?.users?.find((u: any) => u.email === studentEmail);

    if (existingStudent) {
      studentId = existingStudent.id;
      console.log('Student user already exists:', studentId);
    } else {
      const { data: studentData, error: studentErr } = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: 'yupu8Ev4',
        email_confirm: true,
      });
      if (studentErr) throw studentErr;
      studentId = studentData?.user?.id;
      console.log('Student user created:', studentId);
    }

    // 3. Update profiles
    console.log('Seeding profiles for IDs:', { adminId, studentId });
    if (adminId) {
      // First, check if username 'admin' is taken by someone else
      const { data: existingWithUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', 'admin')
        .single();

      const profileData: any = {
        id: adminId,
        email: adminEmail,
        role: 'admin',
        first_name: 'Nikola',
        last_name: 'Đurić'
      };

      // Only set username if it's not taken or taken by the same user
      if (!existingWithUsername || existingWithUsername.id === adminId) {
        profileData.username = 'admin';
      }

      const { error: pErr } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
      if (pErr) {
        console.error('Admin profile upsert error:', pErr);
        // If it still fails, try a simple update
        await supabase.from('profiles').update(profileData).eq('id', adminId);
      } else {
        console.log('Admin profile upserted successfully');
      }
    }

    if (studentId) {
      const { data: existingWithUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', 'ukupac1')
        .single();

      const profileData: any = {
        id: studentId,
        email: studentEmail,
        role: 'student',
        first_name: 'Student',
        last_name: 'Kupac'
      };

      if (!existingWithUsername || existingWithUsername.id === studentId) {
        profileData.username = 'ukupac1';
      }

      const { error: pErr } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
      if (pErr) {
        console.error('Student profile upsert error:', pErr);
        await supabase.from('profiles').update(profileData).eq('id', studentId);
      } else {
        console.log('Student profile upserted successfully');
      }
    }

    // 4. Create App Settings
    await supabase.from('app_settings').upsert({
      id: 1,
      notification_emails: ['nikola.duric2@skole.hr'],
      iban_recipient: 'StudyWorks d.o.o.',
      iban_number: 'HR1234567890123456789',
      iban_bank: 'Zagrebačka banka',
      final_payment_deadline_hours: 48,
      cancellation_days: 14,
      preview_mode: 'watermark'
    });

    // 4b. Create Storage Buckets
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
        if (bErr) console.error(`Error creating bucket ${bucketName}:`, bErr);
        else console.log(`Bucket ${bucketName} created successfully`);
      } else {
        console.log(`Bucket ${bucketName} already exists`);
      }
    }

    // 5. Create Categories
    const categories = [
      { name: 'Lektura', description: 'Jezična i stilska obrada teksta', sort_order: 1 },
      { name: 'Formatiranje', description: 'Tehničko uređenje rada', sort_order: 2 },
      { name: 'Prezentacije', description: 'Izrada i dorada PPT', sort_order: 3 }
    ];

    const { data: cats } = await supabase.from('categories').upsert(categories, { onConflict: 'name' }).select();

    // 6. Create Items
    if (cats && cats.length > 0) {
      const lekturaId = cats.find((c: any) => c.name === 'Lektura')?.id;
      const formId = cats.find((c: any) => c.name === 'Formatiranje')?.id;

      const items = [
        {
          category_id: lekturaId,
          name: 'Lektura – do 5 stranica',
          description: 'Provjera i ispravak gramatičkih pogrešaka do 5 stranica',
          price_cents: 7500,
          type: 'base',
          max_pages: 5,
          included_revisions: 1,
          delivery_days: 3
        },
        {
          category_id: formId,
          name: 'Formatiranje – do 10 stranica',
          description: 'Raspored sadržaja, margine, fonta i izvora do 10 stranica',
          price_cents: 10000,
          type: 'base',
          max_pages: 10,
          included_revisions: 1,
          delivery_days: 2
        },
        {
          category_id: lekturaId,
          name: 'Express opcija',
          description: 'Brza isporuka u roku od 24 sata',
          price_cents: 2500,
          type: 'addon',
          included_revisions: 0
        },
        {
          category_id: lekturaId,
          name: 'Extra izmjena',
          description: 'Dodatna revizija rada',
          price_cents: 3000,
          type: 'addon',
          included_revisions: 1
        }
      ];

      await supabase.from('items').upsert(items, { onConflict: 'name' });
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('Seed error:', error);
    
    // Check for missing tables
    const { data: tables } = await supabase.rpc('get_tables'); // This might not work if rpc not defined
    // Alternative: check if a simple query fails
    const { error: pagesCheck } = await supabase.from('pages').select('id').limit(1);
    const { error: profilesCheck } = await supabase.from('profiles').select('id').limit(1);
    
    if (pagesCheck?.code === 'PGRST204' || pagesCheck?.message?.includes('pages') ||
        profilesCheck?.code === 'PGRST204' || profilesCheck?.message?.includes('profiles')) {
      return NextResponse.json({ 
        error: 'Neke tablice nedostaju u bazi podataka. Molimo kopirajte sljedeći SQL i pokrenite ga u Supabase SQL Editoru:',
        sql: `
-- Tablica za stranice (CMS)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS za stranice
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins have full access to pages" ON pages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
        `,
        code: 'TABLES_MISSING'
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
