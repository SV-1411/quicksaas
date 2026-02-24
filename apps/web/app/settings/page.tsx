'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { getFontScale, getTheme, setFontScale, setTheme, type ThemeName } from '../../lib/ui-prefs';
import { useToast } from '../../lib/hooks/use-toast';

const THEMES: Array<{ key: ThemeName; label: string }> = [
  { key: 'starbucks', label: 'Starbucks (Green/White)' },
  { key: 'ocean', label: 'Ocean' },
  { key: 'purple', label: 'Purple' },
];

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();

  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('client');
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [theme, setThemeState] = useState<ThemeName>('starbucks');
  const [fontScale, setFontScaleState] = useState(1);

  const title = useMemo(() => 'Settings', []);

  useEffect(() => {
    setThemeState(getTheme());
    setFontScaleState(getFontScale());

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: actor } = await supabase
        .from('users')
        .select('id, role, full_name, bio, avatar_url')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (actor?.role) setRole(actor.role);
      if (actor?.full_name) setFullName(actor.full_name);
      if (actor?.bio) setBio(actor.bio);
      if (actor?.avatar_url) setAvatarUrl(actor.avatar_url);

      setLoading(false);
    })();
  }, []);

  const onSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return show('Error', 'Not authenticated');

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, bio })
      .eq('auth_user_id', session.user.id);

    if (error) return show('Error', error.message);
    show('Saved', 'Profile updated');
  };

  const onAvatarUpload = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return show('Error', 'Not authenticated');

    const ext = file.name.split('.').pop() || 'png';
    const path = `${session.user.id}/${Date.now()}.${ext}`;

    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upload.error) return show('Error', upload.error.message);

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('auth_user_id', session.user.id);

    if (error) return show('Error', error.message);

    setAvatarUrl(publicUrl);
    show('Saved', 'Profile photo updated');
  };

  const onThemeChange = (t: ThemeName) => {
    setThemeState(t);
    setTheme(t);
  };

  const onFontScaleChange = (v: number) => {
    setFontScaleState(v);
    setFontScale(v);
  };

  return (
    <AppShell role={role} title={title}>
      {loading ? (
        <Card className="p-6">Loading…</Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <p className="text-lg font-semibold">Appearance</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Theme</p>
                <Select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value as ThemeName)}
                >
                  {THEMES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Font scale</p>
                  <p className="text-sm font-medium">{Math.round(fontScale * 100)}%</p>
                </div>
                <Slider
                  min={85}
                  max={125}
                  step={1}
                  value={[Math.round(fontScale * 100)]}
                  onValueChange={(val) => onFontScaleChange(val[0] / 100)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <p className="text-lg font-semibold">Profile</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Full name</p>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Profile photo</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onAvatarUpload(f);
                  }}
                />
                {avatarUrl ? (
                  <a className="text-xs text-primary underline" href={avatarUrl} target="_blank" rel="noreferrer">View current photo</a>
                ) : (
                  <p className="text-xs text-muted-foreground">No photo yet</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Bio</p>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void onSaveProfile()}>Save profile</Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
