# Cadernos no Google Drive

O conteúdo editável dos cadernos (traços, textos, formas, páginas e configuração do papel) é mantido exclusivamente no `appDataFolder` do Google Drive do aluno. Essa área é privada do aplicativo e não aparece na listagem normal do Drive. PDFs são arquivos separados e visíveis na pasta **Projeto Vetor - Cadernos**. O Supabase contém apenas a conexão técnica: `user_id`, refresh token criptografado, expiração, e-mail opcional, ID da pasta e a data de consentimento do escopo privado.

## Google Cloud Console

1. Crie ou selecione um projeto no Google Cloud Console.
2. Ative a **Google Drive API**.
3. Configure a tela de consentimento OAuth.
4. Crie credenciais OAuth 2.0 do tipo **Aplicativo da Web**.
5. Adicione a URI exata do callback, por exemplo `https://seu-dominio.com/api/google-drive/callback`.
6. Configure os escopos `https://www.googleapis.com/auth/drive.file` e `https://www.googleapis.com/auth/drive.appdata`. O primeiro permite criar e atualizar os PDFs visíveis; o segundo permite guardar os editáveis na área privada do aplicativo.

## Vercel

Configure, somente nos ambientes server-side, as variáveis:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`

A chave de criptografia deve conter 32 bytes aleatórios em Base64. Não use prefixo `VITE_`. Após salvar as variáveis, faça um novo deploy. Aplique as migrations `202607260001_google_drive_connections.sql` e `202608160001_google_drive_appdata_scope.sql` antes de liberar a integração.

## Reconexão e cadernos antigos

Conexões anteriores ao suporte a `drive.appdata` aparecem com a solicitação **Reconectar Google Drive**. O usuário precisa consentir novamente uma única vez.

Arquivos `.projeto-vetor` antigos permanecem visíveis e podem ser abertos normalmente. No primeiro salvamento ou renomeação, o backend cria uma cópia editável no `appDataFolder`, registra a associação nos `appProperties` dos dois arquivos e passa a usar o novo ID. O arquivo antigo não é apagado. A listagem do Projeto Vetor omite o legado já migrado para não mostrar o mesmo caderno duas vezes.

O PDF nunca é criado pelo autosave. Ele é criado ou atualizado somente quando o aluno escolhe **Salvar PDF no Google Drive**, sempre dentro da pasta visível do Projeto Vetor. O `pdfFileId` armazenado nos metadados do arquivo editável garante que exportações futuras atualizem o mesmo PDF.
