-- Emergency rollback only, after reverting the dependent backend.
-- Does not restore revoked roles or change any user data.
begin;
drop function if exists public.vet_public_content_blocks(uuid);
drop function if exists public.vet_revoke_admin_access(uuid,uuid,uuid);
commit;
