-- 043_college_city.sql
-- Adds `city` to colleges (part of expanding the seed list from 5 mock
-- colleges to the full PMDC-recognized list of Pakistani medical colleges,
-- see scripts/seed/data/user-data.ts) and safely renames the one existing
-- seeded college whose canonical name changes as part of that expansion.

alter table public.colleges add column city text;

-- ── Seed rename: "CMH Lahore" -> "CMH Lahore Medical College" ──────────
-- The mock seed's slug is derived from the college name (slugify() in
-- scripts/seed-mcqs.ts), so replacing "CMH Lahore" with its real PMDC name
-- changes the id (cmh-lahore -> cmh-lahore-medical-college). Renaming in
-- place (rather than letting the next `npm run db:seed` insert a new row
-- alongside the old one) avoids orphaning any profile that already points
-- at the old id -- same pattern as the Foundation University typo fix
-- above (20260708000017_ops_hardening.sql), guarded so it's a no-op on a
-- database where "cmh-lahore" was never seeded.
do $$
declare
  v_old_college text := 'cmh-lahore';
  v_new_college text := 'cmh-lahore-medical-college';
  v_old_program text := v_old_college || '-mbbs';
  v_new_program text := v_new_college || '-mbbs';
  v_has_old boolean;
begin
  select exists (select 1 from public.colleges where id = v_old_college)
    into v_has_old;

  if v_has_old then
    insert into public.colleges (id, name, short_name, city, created_at)
    select v_new_college, 'CMH Lahore Medical College', short_name, 'Lahore Cantt', created_at
      from public.colleges where id = v_old_college;

    insert into public.programs (id, college_id, name, created_at)
    select v_new_program, v_new_college, name, created_at
      from public.programs where id = v_old_program;

    insert into public.academic_years (id, program_id, year_number, name, created_at)
    select v_new_program || '-year-' || year_number, v_new_program, year_number, name, created_at
      from public.academic_years where program_id = v_old_program;

    update public.profiles
       set college_id = v_new_college
     where college_id = v_old_college;

    update public.profiles
       set program_id = v_new_program
     where program_id = v_old_program;

    update public.profiles
       set academic_year_id = replace(academic_year_id, v_old_program || '-year-', v_new_program || '-year-')
     where academic_year_id like v_old_program || '-year-%';

    -- Cascade removes the old program + years (programs->academic_years).
    delete from public.colleges where id = v_old_college;
  end if;
end $$;
