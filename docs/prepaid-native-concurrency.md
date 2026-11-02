# Validação ainda pendente: PostgreSQL com conexões independentes

Não executar em produção. Usar PostgreSQL/Supabase LOCAL descartável com o schema atual e as migrations 001/002 desta entrega, conta sintética U, plano sintético P e email sintético E. O usuário deve existir em profiles/auth.users. Habilitar seis meses para P via função administrativa. Substituir os UUIDs/textos abaixo pelos dados desse ambiente. Não usar credenciais reais.

1. Conexão A: `BEGIN; SELECT prepare_prepaid_checkout('U','K1','slug-P',6,'pix','E');` Guardar id da tentativa T, payment_id e snapshot. Manter transação aberta.
2. Conexão B: `BEGIN; SELECT prepare_prepaid_checkout('U','K2','slug-P',6,'pix','E');` Deve bloquear, não inserir segundo pagamento. Fazer COMMIT em A; B deve retornar T. COMMIT em B.
3. A: `BEGIN; SELECT claim_prepaid_submission('U','T');` Deve retornar true. Manter aberta. B: `BEGIN; SELECT claim_prepaid_submission('U','T');` deve aguardar. COMMIT em A; B deve retornar false. COMMIT em B.
4. Simular interrupção após claim, sem POST: chamar claim novamente retorna false. O backend deve apenas consultar o provedor; um GET vazio não pode habilitar POST nem trocar payment_id.
5. Simular dois retornos concorrentes idênticos de `complete_prepaid_submission`, usando JSON válido com paymentId original e URL sintética. Reter transação A antes do COMMIT; B deve esperar e devolver o mesmo resultado. Não alterar state manualmente.
6. Aplicar aprovação sintética pelo RPC oficial duas vezes, em sessões diferentes. Comparar período e `already_applied`; executar reconciliação de indicação duas vezes e contar reward único. Repetir disputa aprovação/estorno. Verificar rollback de toda a transação em falha, sem soma dupla de meses.
7. Após aprovação, chamar prepare com K2: continua T, pois o alias de K2 foi persistido. K3 novo representa intenção nova e pode criar nova compra somente quando a anterior não estiver pendente/incerta; a configuração atual vale apenas para K3.
8. Testar compra simultânea por usuários diferentes no mesmo plano de vagas limitadas, edição de duração concorrente e expiração de reservas. Observar pg_locks/log de deadlock e repetir com timeouts de teste; não concluir ausência de deadlocks só pelo teste serializado.

Os testes `prepaidCheckout.test.ts` usam concorrência controlada em JavaScript, com fronteiras de falha simuladas. `prepaidRecoverySql.test.ts` executa SQL real no PGlite, que serializa chamadas. Nenhum deles substitui este roteiro de MVCC nativo.
