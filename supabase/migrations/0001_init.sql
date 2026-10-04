-- ============================================================================
-- Starvia — initial schema
-- Postgres / Supabase. Every table is protected by Row Level Security.
--
-- Run with the Supabase CLI:   supabase db push
-- Or paste into the SQL editor in the Supabase dashboard.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at honest without trusting the client.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  full_name         text,
  avatar_url        text,
  class_level       text,
  board             text,
  subjects          text[] not null default '{}',
  learning_level    text,
  exam_target       text,
  onboarded         boolean not null default false,
  role              text not null default 'student',
  xp                integer not null default 0,
  level             integer not null default 1,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_active_date  date,
  study_minutes     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_last_active_idx on public.profiles(last_active_date);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references auth.users(id) on delete cascade,
  plan                      text not null default 'free',
  status                    text not null default 'active',
  provider                  text not null default 'razorpay',
  provider_customer_id      text,
  provider_subscription_id  text,
  provider_order_id         text,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  cancelled_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists subscriptions_plan_idx on public.subscriptions(plan);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payments (audit trail — written only by the server)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  plan                  text not null,
  amount                integer not null,          -- paise
  currency              text not null default 'INR',
  status                text not null default 'created',
  mode                  text not null default 'live',   -- live | mock
  provider              text not null default 'razorpay',
  provider_order_id     text,
  provider_payment_id   text,
  provider_signature    text,
  notes                 jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments(user_id, created_at desc);
create unique index if not exists payments_provider_payment_id_idx
  on public.payments(provider_payment_id) where provider_payment_id is not null;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_usage — database-backed daily counters (the anti-bypass source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  feature     text not null,
  usage_date  date not null default (now() at time zone 'Asia/Kolkata')::date,
  count       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, feature, usage_date)
);

create index if not exists ai_usage_user_date_idx on public.ai_usage(user_id, usage_date);

drop trigger if exists ai_usage_set_updated_at on public.ai_usage;
create trigger ai_usage_set_updated_at
  before update on public.ai_usage
  for each row execute function public.set_updated_at();

-- Atomic counter used by the server-side usage recorder.
-- p_amount may be negative to refund a reserved call that failed.
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_date date,
  p_amount integer default 1
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage (user_id, feature, usage_date, count)
  values (p_user_id, p_feature, p_date, greatest(p_amount, 0))
  on conflict (user_id, feature, usage_date)
  do update set count = greatest(public.ai_usage.count + p_amount, 0),
                updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- ai_events — lightweight observability for AI calls
-- ---------------------------------------------------------------------------
create table if not exists public.ai_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  feature     text not null,
  model       text,
  status      text not null,          -- ok | error | blocked | cached
  latency_ms  integer,
  tokens      integer,
  cached      boolean not null default false,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists ai_events_created_idx on public.ai_events(created_at desc);
create index if not exists ai_events_feature_idx on public.ai_events(feature, status);

-- ---------------------------------------------------------------------------
-- content_cache — shared, non-personal generated content (cost optimisation)
-- Written only by the server; readable by any signed-in user. Contains no PII.
-- ---------------------------------------------------------------------------
create table if not exists public.content_cache (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,          -- tutorial | quiz | flashcards
  cache_key   text not null unique,
  payload     jsonb not null,
  hits        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists content_cache_kind_idx on public.content_cache(kind);

drop trigger if exists content_cache_set_updated_at on public.content_cache;
create trigger content_cache_set_updated_at
  before update on public.content_cache
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New conversation',
  subject     text,
  topic       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_idx on public.conversations(user_id, updated_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant', 'system')),
  content          text not null,
  model            text,
  tokens           integer,
  feedback         text,
  created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- tutorials
-- ---------------------------------------------------------------------------
create table if not exists public.tutorials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  class_level  text,
  board        text,
  subject      text not null,
  chapter      text,
  topic        text not null,
  difficulty   text not null default 'medium',
  content      jsonb not null,
  is_complete  boolean not null default false,
  progress     integer not null default 0,
  cache_key    text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists tutorials_user_idx on public.tutorials(user_id, created_at desc);
create index if not exists tutorials_cache_idx on public.tutorials(user_id, cache_key);

drop trigger if exists tutorials_set_updated_at on public.tutorials;
create trigger tutorials_set_updated_at
  before update on public.tutorials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quizzes / quiz_questions / quiz_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default 'Quiz',
  class_level     text,
  board           text,
  subject         text not null,
  chapter         text,
  topic           text,
  difficulty      text not null default 'medium',
  question_count  integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists quizzes_user_idx on public.quizzes(user_id, created_at desc);

create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  order_index     integer not null default 0,
  type            text not null default 'mcq',   -- mcq | true_false | short_answer
  question        text not null,
  options         jsonb,
  correct_answer  text not null,
  explanation     text,
  topic           text,
  created_at      timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id, order_index);

create table if not exists public.quiz_attempts (
  id                uuid primary key default gen_random_uuid(),
  quiz_id           uuid not null references public.quizzes(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  score             integer not null default 0,
  total             integer not null default 0,
  answers           jsonb not null default '[]'::jsonb,
  weak_topics       text[] not null default '{}',
  duration_seconds  integer,
  completed_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- flashcards + flashcard_progress
-- ---------------------------------------------------------------------------
create table if not exists public.flashcards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  deck_name   text not null,
  subject     text,
  topic       text,
  front       text not null,
  back        text not null,
  source      text not null default 'manual',   -- manual | ai
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists flashcards_user_idx on public.flashcards(user_id, deck_name, created_at desc);

drop trigger if exists flashcards_set_updated_at on public.flashcards;
create trigger flashcards_set_updated_at
  before update on public.flashcards
  for each row execute function public.set_updated_at();

create table if not exists public.flashcard_progress (
  id                uuid primary key default gen_random_uuid(),
  flashcard_id      uuid not null references public.flashcards(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'unknown',   -- known | unknown
  review_count      integer not null default 0,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (flashcard_id, user_id)
);

create index if not exists flashcard_progress_user_idx on public.flashcard_progress(user_id, status);

drop trigger if exists flashcard_progress_set_updated_at on public.flashcard_progress;
create trigger flashcard_progress_set_updated_at
  before update on public.flashcard_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- study_progress (topic mastery)
-- ---------------------------------------------------------------------------
create table if not exists public.study_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject     text not null,
  chapter     text not null default 'General',
  topic       text not null,
  status      text not null default 'not_started',
  mastery     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, subject, chapter, topic)
);

create index if not exists study_progress_user_idx on public.study_progress(user_id, subject);

drop trigger if exists study_progress_set_updated_at on public.study_progress;
create trigger study_progress_set_updated_at
  before update on public.study_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- achievements
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  key          text not null,
  title        text not null,
  description  text,
  icon         text,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists achievements_user_idx on public.achievements(user_id, unlocked_at desc);

-- ---------------------------------------------------------------------------
-- feedback (helpful / not helpful on tutor answers, and general feedback)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  -- Nullable: public contact-form messages are not tied to an account.
  user_id     uuid references auth.users(id) on delete cascade,
  message_id  uuid references public.messages(id) on delete set null,
  rating      text,                       -- helpful | not_helpful | 1..5
  comment     text,
  context     text,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_user_idx on public.feedback(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- plan_limits — DB override for the code defaults in src/lib/plans.ts
-- ---------------------------------------------------------------------------
create table if not exists public.plan_limits (
  plan        text primary key,
  limits      jsonb not null,
  updated_at  timestamptz not null default now()
);

drop trigger if exists plan_limits_set_updated_at on public.plan_limits;
create trigger plan_limits_set_updated_at
  before update on public.plan_limits
  for each row execute function public.set_updated_at();

insert into public.plan_limits (plan, limits) values
  ('free',  '{"tutor":5,"tutorial":2,"quiz":3,"image_solve":1,"solve":5,"flashcards":1,"exam_prep":1}'::jsonb),
  ('pro',   '{"tutor":30,"tutorial":5,"quiz":10,"image_solve":5,"solve":30,"flashcards":5,"exam_prep":5}'::jsonb),
  ('ultra', '{"tutor":100,"tutorial":15,"quiz":30,"image_solve":15,"solve":100,"flashcards":15,"exam_prep":15}'::jsonb)
on conflict (plan) do nothing;

-- ============================================================================
-- New-user bootstrap: profile + free subscription
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status, provider)
  values (new.id, 'free', 'active', 'razorpay')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.payments            enable row level security;
alter table public.ai_usage            enable row level security;
alter table public.ai_events           enable row level security;
alter table public.content_cache       enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.tutorials           enable row level security;
alter table public.quizzes             enable row level security;
alter table public.quiz_questions      enable row level security;
alter table public.quiz_attempts       enable row level security;
alter table public.flashcards          enable row level security;
alter table public.flashcard_progress  enable row level security;
alter table public.study_progress      enable row level security;
alter table public.achievements        enable row level security;
alter table public.feedback            enable row level security;
alter table public.plan_limits         enable row level security;

-- profiles: read + update own row only. Insert happens via the auth trigger.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- subscriptions: read own only. Writes happen server-side with the service role.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- payments: read own only. Writes happen server-side.
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- ai_usage: read own only. Writes happen server-side.
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

-- ai_events: read own only. Writes happen server-side.
drop policy if exists "ai_events_select_own" on public.ai_events;
create policy "ai_events_select_own" on public.ai_events
  for select using (auth.uid() = user_id);

-- content_cache: any signed-in user may read shared, non-personal content.
drop policy if exists "content_cache_select_authenticated" on public.content_cache;
create policy "content_cache_select_authenticated" on public.content_cache
  for select to authenticated using (true);

-- plan_limits: readable by signed-in users (no secrets).
drop policy if exists "plan_limits_select_authenticated" on public.plan_limits;
create policy "plan_limits_select_authenticated" on public.plan_limits
  for select to authenticated using (true);

-- Generic "own rows" policies for the remaining per-user tables.
do $$
declare
  t text;
  tables text[] := array[
    'conversations','messages','tutorials','quizzes','quiz_questions',
    'quiz_attempts','flashcards','flashcard_progress','study_progress',
    'achievements','feedback'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_select_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_update_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_delete_own', t
    );
  end loop;
end $$;

-- ============================================================================
-- Privileges
-- ============================================================================
-- increment_ai_usage is SECURITY DEFINER and reserved for the server role so a
-- signed-in user cannot tamper with their own counters.
revoke all on function public.increment_ai_usage(uuid, text, date, integer) from public, anon, authenticated;
grant execute on function public.increment_ai_usage(uuid, text, date, integer) to service_role;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
