export type AppRole = 'client' | 'freelancer' | 'admin' | 'system';

export const roleHome: Record<AppRole, string> = {
  client: '/client',
  freelancer: '/freelancer',
  admin: '/admin',
  system: '/admin',
};
