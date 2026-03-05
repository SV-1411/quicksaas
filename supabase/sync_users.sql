-- Drop and recreate the function so it reads role + full_name from user_metadata
-- This is set by the signup route: user_metadata: { full_name, role }
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _role public.user_role;
  _full_name text;
begin
  -- Read role from metadata; fallback to 'client'
  _role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'client'::public.user_role
  );

  -- Read full_name from metadata; fallback to email prefix
  _full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Attempt to update an existing user first (if they exist by email but lost their auth link)
  update public.users 
  set auth_user_id = new.id, full_name = _full_name, role = _role, updated_at = now()
  where email = new.email;

  -- If no row was updated, insert a new one
  if not found then
    insert into public.users (auth_user_id, email, full_name, role)
    values (new.id, new.email, _full_name, _role)
    on conflict (auth_user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Recreate the trigger (drop first to avoid duplicates)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
