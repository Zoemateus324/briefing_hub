
-- Passo 0: remover policies e função antigas que dependem do enum atual
DROP POLICY IF EXISTS "Admins can read all briefings" ON public.briefings;
DROP POLICY IF EXISTS "Admins can delete briefings" ON public.briefings;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 1. Trocar enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'user');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;
DROP TYPE public.app_role_old;

-- 2. Recriar has_role com novo tipo
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 3. Tabela stores
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores publicly readable"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "Admins insert stores"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update stores"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete stores"
  ON public.stores FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. user_roles: store_id + unicidade + consistência + policies admin
ALTER TABLE public.user_roles
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_role_store_key UNIQUE (user_id, role, store_id);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_store_consistency CHECK (
    (role = 'admin' AND store_id IS NULL)
    OR (role IN ('manager', 'staff') AND store_id IS NOT NULL)
    OR (role = 'user')
  );

CREATE POLICY "Admins insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. briefings: coluna store_id + índice
ALTER TABLE public.briefings
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX briefings_store_id_idx ON public.briefings(store_id);

-- 6. helper de acesso por loja
CREATE OR REPLACE FUNCTION public.can_view_store(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role = 'admin'
        OR (ur.role IN ('manager', 'staff') AND ur.store_id = _store_id)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_store(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_store(uuid, uuid) TO authenticated;

-- 7. policies novas de briefings
CREATE POLICY "Read briefings by store access"
  ON public.briefings FOR SELECT
  TO authenticated
  USING (public.can_view_store(auth.uid(), store_id));

CREATE POLICY "Admin or manager delete briefings"
  ON public.briefings FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'manager'
        AND ur.store_id = briefings.store_id
    )
  );

-- 8. trigger primeiro-admin (mantém só admin p/ o 1º usuário)
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role, store_id) VALUES (NEW.id, 'admin', NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_first_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_first_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();
