
-- As policies de INSERT/UPDATE/DELETE em user_roles (migration 20260701185233) dependem
-- de GRANT a nível de tabela para o role authenticated, que nunca foi concedido
-- (a migration original só concedeu SELECT). Sem isso, o Postgres nega o comando
-- antes mesmo de avaliar a RLS policy.
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
