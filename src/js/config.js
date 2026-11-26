/* 배포 설정 — 서버(Supabase)를 연결하면 모든 회원의 대화가 관리자 화면에 모입니다.
 * supabase/schema.sql 실행 후 아래 두 값을 채워 다시 배포하세요. 비워두면 기기 단위로 동작합니다. */
window.LM_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
(function () {
  var c = window.LM_CONFIG;
  if (c.supabaseUrl && c.supabaseAnonKey) {
    try {
      var cur = JSON.parse(localStorage.getItem('lm_sync') || '{}');
      if (!cur.url) localStorage.setItem('lm_sync', JSON.stringify({ url: c.supabaseUrl, key: c.supabaseAnonKey }));
    } catch (e) { /* noop */ }
  }
})();
