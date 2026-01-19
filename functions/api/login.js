// Cloudflare Pages Function - 로그인 API
export async function onRequest(context) {
  const { request, env } = context;
  const db = env['milkt-db'];
  
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호를 입력해주세요.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 관리자 비밀번호 조회
    const result = await db.prepare('SELECT password FROM admin WHERE id = 1').first();

    if (!result) {
      // 관리자 계정이 없으면 생성 (초기 비밀번호: admin123)
      const defaultPassword = 'admin123';
      await db.prepare('INSERT INTO admin (id, password) VALUES (1, ?)').bind(defaultPassword).run();
      
      if (password === defaultPassword) {
        return new Response(
          JSON.stringify({ success: true, message: '로그인 성공' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // 비밀번호 비교
      if (password === result.password) {
        return new Response(
          JSON.stringify({ success: true, message: '로그인 성공' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: '비밀번호가 일치하지 않습니다.' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
