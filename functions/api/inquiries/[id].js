// Cloudflare Pages Function - 문의 상세/수정/삭제 API
export async function onRequest(context) {
  const { request, env, params } = context;
  const db = env['milkt-db'];
  const id = params.id;
  
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/inquiries/:id - 특정 문의 조회
    if (request.method === 'GET') {
      const result = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();

      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: '문의를 찾을 수 없습니다.' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PUT /api/inquiries/:id - 문의 수정
    if (request.method === 'PUT') {
      const body = await request.json();
      const { status, notes } = body;

      const updateFields = [];
      const updateValues = [];

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      if (updateFields.length === 1) {
        return new Response(
          JSON.stringify({ success: false, error: '수정할 항목이 없습니다.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const query = `UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`;
      const { success } = await db.prepare(query).bind(...updateValues).run();

      if (success) {
        const result = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
        return new Response(
          JSON.stringify({ success: true, data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: '문의 수정에 실패했습니다.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // DELETE /api/inquiries/:id - 문의 삭제
    if (request.method === 'DELETE') {
      const { success } = await db.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();

      if (success) {
        return new Response(
          JSON.stringify({ success: true, message: '문의가 삭제되었습니다.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: '문의 삭제에 실패했습니다.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
