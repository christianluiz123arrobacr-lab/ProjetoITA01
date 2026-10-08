drop table if exists public.question_import_image_slots;
drop table if exists public.question_import_batches;
alter table public.questoes drop column if exists image_metadata;
notify pgrst, 'reload schema';
