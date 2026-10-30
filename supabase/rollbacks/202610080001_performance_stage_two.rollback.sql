-- Restore the previous backend BEFORE rollback. No historical data is touched.
begin;
drop function if exists public.vet_question_details(uuid[]);
drop function if exists public.vet_browse_questions(jsonb,integer,integer,boolean,uuid);
drop function if exists public.vet_question_suggestions();
drop function if exists public.vet_admin_student_statistics();
drop function if exists public.vet_admin_dashboard();
drop function if exists public.vet_s2_renderable(text,text,text);
drop function if exists public.vet_s2_overlap(text[],jsonb,boolean);
drop function if exists public.vet_s2_list(jsonb,text,boolean);
drop function if exists public.vet_s2_norm(text,boolean);
drop function if exists public.vet_s2_trim(text);
drop index if exists public.vet_s2_resolution_question_idx;
drop index if exists public.vet_s2_latest_attempt_idx;
notify pgrst, 'reload schema';
commit;
