-- 언어의 마술사: 회원 대화 동기화용 테이블 (Supabase SQL Editor에서 실행)
create table if not exists public.lm_kv (
  key text primary key,          -- user:<서비스ID> / shared:reports / shared:audit / shared:quality / ban:<서비스ID>
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.lm_kv enable row level security;

-- 시제품 단계 정책: 앱(anon)에서 읽기·쓰기 허용
-- 정식 출시 전에는 Supabase Auth(익명 로그인)로 바꾸고, 회원은 자기 user:<id> 행만,
-- 관리자 역할만 전체 조회가 가능하도록 정책을 좁혀야 합니다.
drop policy if exists lm_kv_rw on public.lm_kv;
create policy lm_kv_rw on public.lm_kv for all using (true) with check (true);

-- 2026-11 테스트 서버(sangdam-magic) 적용분: 변경 시각 자동 기록 + 증분 동기화용 인덱스
create index if not exists lm_kv_upd on public.lm_kv (updated_at);
grant select, insert, update, delete on public.lm_kv to anon, authenticated;
create or replace function public.lm_touch() returns trigger language plpgsql as $$ begin new.updated_at = clock_timestamp(); return new; end $$;
drop trigger if exists lm_kv_touch on public.lm_kv;
create trigger lm_kv_touch before insert or update on public.lm_kv for each row execute function public.lm_touch();
-- 키 종류: org:/team:/staff:/notice:/user:/del:<id>

-- AI 키 금고 (anon은 읽기 불가, 저장은 lm_set_secret RPC로만, AI 함수는 service_role로 읽음)
create table if not exists public.lm_secret (name text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.lm_secret enable row level security;
revoke all on public.lm_secret from anon, authenticated;
grant select, insert, update, delete on public.lm_secret to service_role;
-- lm_set_secret(p_name, p_value), lm_secret_status() : security definer 함수 (적용됨)
