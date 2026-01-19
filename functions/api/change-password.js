// Cloudflare Pages Function - 비밀번호 변경 API
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 현재 비밀번호 확인
    const admin = await db.prepare('SELECT password FROM admin WHERE id = 1').first();

    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, error: '관리자 계정을 찾을 수 없습니다.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 현재 비밀번호 확인
    if (admin.password !== currentPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '현재 비밀번호가 일치하지 않습니다.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 새 비밀번호로 업데이트
    const { success } = await db
      .prepare('UPDATE admin SET password = ? WHERE id = 1')
      .bind(newPassword)
      .run();

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: '비밀번호가 변경되었습니다.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: '비밀번호 변경에 실패했습니다.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Change Password Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
