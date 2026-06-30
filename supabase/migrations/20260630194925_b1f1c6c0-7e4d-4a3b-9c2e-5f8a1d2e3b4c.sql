
-- ===== Lojas =====
CREATE TABLE public.lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lojas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lojas TO authenticated;
GRANT ALL ON public.lojas TO service_role;

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

-- Necessário para a página pública do formulário (por slug) e para o seletor de loja no cadastro
CREATE POLICY "Anyone can view lojas"
  ON public.lojas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Global admins can create lojas"
  ON public.lojas FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND public.user_loja_id(auth.uid()) IS NULL
  );

CREATE POLICY "Global admins can update lojas"
  ON public.lojas FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND public.user_loja_id(auth.uid()) IS NULL
  );

CREATE POLICY "Global admins can delete lojas"
  ON public.lojas FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND public.user_loja_id(auth.uid()) IS NULL
  );

-- ===== user_roles: vincular cada conta da equipe a uma loja =====
-- loja_id NULL = administrador global (enxerga todas as lojas)
-- loja_id definido = administrador da loja (enxerga só a própria loja)
ALTER TABLE public.user_roles
  ADD COLUMN loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.user_loja_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT loja_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.user_loja_id(uuid) FROM PUBLIC, anon;

-- Cadastro agora pode informar a loja (via raw_user_meta_data->>'loja_id').
-- O primeiro usuário do sistema continua virando admin global.
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _loja_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role, loja_id) VALUES (NEW.id, 'admin', NULL);
  ELSE
    _loja_id := NULLIF(NEW.raw_user_meta_data ->> 'loja_id', '')::uuid;
    INSERT INTO public.user_roles (user_id, role, loja_id) VALUES (NEW.id, 'admin', _loja_id);
  END IF;
  RETURN NEW;
END;
$$;

-- ===== briefings: vincular cada resposta a uma loja =====
ALTER TABLE public.briefings
  ADD COLUMN loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE;

DROP POLICY "Anyone can submit a briefing" ON public.briefings;
DROP POLICY "Admins can read all briefings" ON public.briefings;
DROP POLICY "Admins can delete briefings" ON public.briefings;

CREATE POLICY "Anyone can submit a briefing for a loja"
  ON public.briefings FOR INSERT
  TO anon, authenticated
  WITH CHECK (loja_id IS NOT NULL);

CREATE POLICY "Admins can read briefings of their loja"
  ON public.briefings FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND (
      public.user_loja_id(auth.uid()) IS NULL
      OR public.user_loja_id(auth.uid()) = loja_id
    )
  );

CREATE POLICY "Admins can delete briefings of their loja"
  ON public.briefings FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND (
      public.user_loja_id(auth.uid()) IS NULL
      OR public.user_loja_id(auth.uid()) = loja_id
    )
  );
