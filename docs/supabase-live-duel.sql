-- Live-Duell Räume (Supabase PostgREST)
-- Tabelle anlegen, dann in der App: Einstellungen → Supabase wie Cloud-Backup konfigurieren.

create table if not exists public.nexus_live_duel_rooms (
  code text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.nexus_live_duel_rooms enable row level security;

-- MVP: öffentlicher Lese-/Schreibzugriff mit Anon-Key (für Klassenraum; später einschränken)
create policy "nexus_live_duel_anon_all"
  on public.nexus_live_duel_rooms
  for all
  using (true)
  with check (true);
