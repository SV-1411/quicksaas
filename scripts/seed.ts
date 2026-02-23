import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: 'client' | 'freelancer' | 'admin';
  specialtyTags?: string[];
  skillVector?: Record<string, number>;
  reliabilityScore?: number;
}) {
  const existing = await supabase.auth.admin.listUsers();
  let user = existing.data.users.find((u) => u.email === input.email);

  if (!user) {
    const created = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (created.error || !created.data.user) throw new Error(created.error?.message ?? 'createUser failed');
    user = created.data.user;
  }

  const upsert = await supabase.from('users').upsert(
    {
      auth_user_id: user.id,
      role: input.role,
      full_name: input.fullName,
      email: input.email,
      specialty_tags: input.specialtyTags ?? [],
      skill_vector: input.skillVector ?? {},
      reliability_score: input.reliabilityScore ?? 1,
      availability_score: 1,
    },
    { onConflict: 'email' },
  );

  if (upsert.error) throw new Error(upsert.error.message);

  const profile = await supabase.from('users').select('id').eq('email', input.email).single();
  if (profile.error) throw new Error(profile.error.message);

  await supabase.from('wallets').upsert({ user_id: profile.data.id, balance: 0, currency: 'INR' }, { onConflict: 'user_id' });

  return profile.data.id;
}

async function run() {
  const clientId = await ensureUser({
    email: 'client@gigzs.local',
    password: 'Password123!',
    fullName: 'Sample Client',
    role: 'client',
  });

  await ensureUser({
    email: 'frontend@gigzs.local',
    password: 'Password123!',
    fullName: 'Frontend Freelancer',
    role: 'freelancer',
    specialtyTags: ['frontend'],
    skillVector: { react: 0.9, ui: 0.8, api: 0.3 },
    reliabilityScore: 1.1,
  });

  await ensureUser({
    email: 'backend@gigzs.local',
    password: 'Password123!',
    fullName: 'Backend Freelancer',
    role: 'freelancer',
    specialtyTags: ['backend'],
    skillVector: { node: 0.9, postgres: 0.8, api: 0.9 },
    reliabilityScore: 1.15,
  });

  await ensureUser({
    email: 'integrations@gigzs.local',
    password: 'Password123!',
    fullName: 'Integrations Freelancer',
    role: 'freelancer',
    specialtyTags: ['integrations', 'deployment'],
    skillVector: { webhooks: 0.9, whatsapp: 0.7, ci: 0.8 },
    reliabilityScore: 1.05,
  });

  await ensureUser({
    email: 'admin@gigzs.local',
    password: 'Password123!',
    fullName: 'Platform Admin',
    role: 'admin',
  });

  const projectInsert = await supabase
    .from('projects')
    .insert({
      client_id: clientId,
      title: 'Sample E-commerce Build',
      raw_requirement: 'Build an urgent B2B storefront app with payment and WhatsApp integration',
      structured_requirements: {
        productType: 'web_app',
        integrations: ['payment-gateway', 'whatsapp'],
      },
      complexity_score: 72,
      urgency: 'high',
      total_price: 125000,
      status: 'active',
    })
    .select('id')
    .single();

  if (projectInsert.error) throw new Error(projectInsert.error.message);

  await supabase.from('project_modules').insert([
    { project_id: projectInsert.data.id, module_key: 'frontend', module_name: 'Frontend', module_weight: 0.25, module_status: 'queued' },
    { project_id: projectInsert.data.id, module_key: 'backend', module_name: 'Backend', module_weight: 0.35, module_status: 'queued' },
    { project_id: projectInsert.data.id, module_key: 'integrations', module_name: 'Integrations', module_weight: 0.25, module_status: 'queued' },
    { project_id: projectInsert.data.id, module_key: 'deployment', module_name: 'Deployment', module_weight: 0.15, module_status: 'queued' },
  ]);

  console.log('Seed complete.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
