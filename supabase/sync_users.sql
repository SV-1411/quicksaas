-- 1. Create a function to handle new user sync
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User'),
    case 
      when new.email like 'client%' then 'client'::public.user_role
      else 'freelancer'::public.user_role
    end
  );
  return new;
end;
$$;

-- 2. Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- 3. Sync EXISTING auth users (manual fix)
insert into public.users (auth_user_id, email, full_name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User'),
  case 
    when au.email like 'client%' then 'client'::public.user_role
    else 'freelancer'::public.user_role
  end
from auth.users au
where not exists (
  select 1 from public.users u where u.auth_user_id = au.id
);

-- 4. Final verification: ensures all roles are set correctly
update public.users set role = 'client' where email like 'client%';
update public.users set role = 'freelancer' where email not like 'client%' and role != 'admin';
