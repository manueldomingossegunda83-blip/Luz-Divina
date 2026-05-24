import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // No auth required — content generation is public

    const body = await req.json();
    const { type, date } = body;

    if (!type || !['devocional', 'oracao'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Tipo inválido. Use "devocional" ou "oracao".' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!date || isNaN(Date.parse(date))) {
      return new Response(JSON.stringify({ error: 'Data inválida.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check cache: same date+type in ai_usage
    const serviceSupabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const cacheKey = `generate-content:${type}:${date}`;
    
    const { data: cached } = await serviceSupabase
      .from('ai_usage')
      .select('answer_text')
      .eq('question_hash', cacheKey)
      .not('answer_text', 'is', null)
      .limit(1)
      .single();

    if (cached?.answer_text) {
      console.log(`Cache hit for ${cacheKey}`);
      const parsed = JSON.parse(cached.answer_text);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompts: Record<string, string> = {
      devocional: `Crie um devocional cristão profundo e original para o dia ${date}. 
      O devocional deve:
      - Ter um título inspirador e único
      - Incluir uma reflexão espiritual profunda (200-300 palavras)
      - Relacionar-se com desafios da vida moderna
      - Ter uma mensagem prática e aplicável
      - Incluir uma sugestão de prática diária
      - Terminar com uma oração curta
      Formato em Markdown com:
      # Título
      ## Reflexão
      [conteúdo]
      ## Mensagem
      [mensagem]
      ## Prática Diária
      [prática]
      ## Oração
      [oração]
      Seja original, profundo e relevante. Não use clichês.`,
      oracao: `Crie uma oração cristã original e poderosa para o dia ${date}.
      A oração deve:
      - Ter um título que indique o propósito
      - Ser autêntica e tocante (150-200 palavras)
      - Abordar necessidades reais das pessoas
      - Ter linguagem acessível mas reverente
      - Terminar com uma mensagem de esperança
      Formato em Markdown com:
      # Título da Oração
      ## Prece
      [oração completa]
      ## Palavra Final
      [mensagem de esperança]
      Seja original e tocante. Evite frases genéricas.`
    };

    const systemPrompt = type === 'devocional' 
      ? 'Você é um teólogo e escritor cristão experiente que cria devocionais profundos, originais e relevantes para o dia a dia das pessoas.'
      : 'Você é um líder espiritual que escreve orações poderosas e autênticas.';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompts[type] }],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Limite atingido. Tente novamente em alguns minutos.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `${type === 'devocional' ? 'Devocional' : 'Oração'} do Dia`;
    const lines = content.split('\n').filter((line: string) => line.trim() && !line.startsWith('#'));
    const excerpt = lines[0]?.substring(0, 150) + '...' || '';

    const result = {
      title, content, excerpt,
      date: date,
      category: type === 'devocional' ? 'Reflexão Diária' : 'Oração Diária',
      tags: [type === 'devocional' ? 'Devocional' : 'Oração', 'Espiritualidade', 'Fé'],
    };

    // Cache the result
    await serviceSupabase.from('ai_usage').insert({
      ip_address: 'system',
      question_hash: cacheKey,
      question_text: `${type}:${date}`,
      answer_text: JSON.stringify(result),
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
