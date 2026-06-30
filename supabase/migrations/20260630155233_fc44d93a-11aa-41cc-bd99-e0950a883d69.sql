
-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Primeiro usuário cadastrado vira admin
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();

-- ===== Briefings =====
CREATE TABLE public.briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  pessoas int NOT NULL DEFAULT 1,
  tipo_refeicao text,
  restricoes text[] NOT NULL DEFAULT '{}',
  nao_gosta text,
  favoritos text,
  bebidas text[] NOT NULL DEFAULT '{}',
  bebida_obs text,
  recepcao text,
  chegada text,
  musicas text[] NOT NULL DEFAULT '{}',
  spotify text,
  artista_fav text,
  obs text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.briefings TO authenticated;
GRANT INSERT ON public.briefings TO anon, authenticated;
GRANT ALL ON public.briefings TO service_role;

ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (inclusive não autenticada) pode enviar briefing
CREATE POLICY "Anyone can submit a briefing"
  ON public.briefings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Só admins podem ler os briefings
CREATE POLICY "Admins can read all briefings"
  ON public.briefings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete briefings"
  ON public.briefings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
