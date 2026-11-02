-- Emergency rollback only. Restore the previous application code first.
begin;
drop function if exists public.export_question_pdf_data(uuid, jsonb);
drop index if exists public.question_pdf_published_difficulty_idx;
drop index if exists public.question_pdf_published_institution_idx;
drop index if exists public.question_pdf_published_year_idx;
drop index if exists public.question_pdf_latest_attempt_idx;
drop function if exists public.question_pdf_filter_list(jsonb);
drop function if exists public.question_pdf_list(jsonb, text);
drop function if exists public.question_pdf_normalize(text);
notify pgrst, 'reload schema';
commit;
