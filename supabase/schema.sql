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
