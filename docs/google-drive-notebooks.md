# Cadernos no Google Drive

O conteúdo dos cadernos (traços, textos, formas, páginas e configuração do papel) é mantido exclusivamente em arquivos do Google Drive do aluno. O Supabase contém apenas a conexão técnica: `user_id`, refresh token criptografado, expiração, e-mail opcional e ID da pasta.

## Google Cloud Console

1. Crie ou selecione um projeto no Google Cloud Console.
2. Ative a **Google Drive API**.
3. Configure a tela de consentimento OAuth.
4. Crie credenciais OAuth 2.0 do tipo **Aplicativo da Web**.
5. Adicione a URI exata do callback, por exemplo `https://seu-dominio.com/api/google-drive/callback`.
6. Use somente o escopo `https://www.googleapis.com/auth/drive.file`.

## Vercel

Configure, somente nos ambientes server-side, as variáveis:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`

A chave de criptografia deve conter 32 bytes aleatórios em Base64. Não use prefixo `VITE_`. Após salvar as variáveis, faça um novo deploy. Aplique também a migration `202607260001_google_drive_connections.sql` antes de liberar a integração.
