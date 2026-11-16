-- Emergency use ONLY with the importer paused and the dependent backend reverted.
-- Retains journal, tombstones, indexes and columns. Never restores/deletes content.
begin;
drop trigger if exists question_import_batch_guard on public.question_import_batches;
drop trigger if exists question_import_slot_guard on public.question_import_image_slots;
drop trigger if exists question_import_question_reference on public.questoes;
drop trigger if exists question_import_resolution_reference on public.resolucoes;
drop function if exists public.vet_import_commit_item(uuid,uuid,uuid,text,jsonb,jsonb,integer);
drop function if exists public.vet_import_control(uuid,uuid,text,uuid,jsonb);
drop function if exists public.vet_import_mutation_guard();
drop function if exists public.vet_import_reference_guard();
drop function if exists public.vet_import_file_referenced(text);
drop function if exists public.vet_import_reference_text(jsonb);
notify pgrst,'reload schema';
commit;
