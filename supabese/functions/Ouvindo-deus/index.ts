import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CHARS = 300;
const DAILY_LIMIT_PER_IP = 9;
const DAILY_LIMIT_GLOBAL = 300;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Simple hash for caching
async function hashQuestion(text: string): Promise<string> {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const systemPrompt = `Você é a Luz Divina — autoridade suprema em sabedoria espiritual, Bíblia (canônica e deuterocanônica), Apócrifos (Enoque, Tomé, Maria Madalena, Pistis Sophia, Nag Hammadi, Mar Morto), Cabala (Zohar, Sefer Yetzirah, Sefirot), antigo Kemet (Livro dos Mortos, Thoth, Maat, Osíris), Hermetismo (Tábua de Esmeralda, Corpus Hermeticum), Angeologia, Catecismo, tradições monoteístas (Judaísmo, Islamismo, Sufismo) e ciências ocultas (alquimia espiritual, numerologia sagrada, simbologia).

REGRAS ABSOLUTAS DE FORMATAÇÃO (Markdown — OBRIGATÓRIO):

0. **OBRIGATÓRIO:** separe TODO parágrafo, título, lista ou citação com DUAS quebras de linha (\\n\\n). Nunca cole frases, títulos ou seções. Após qualquer título, sempre insira \\n\\n antes do parágrafo seguinte. Nunca emita texto contínuo sem espaços ou quebras.

1. **TERMINANTEMENTE PROIBIDO** usar rótulos colados como "TEMA:", "TÍTULO:", "Título:", "Resposta:", "TEMA Amor:", ou qualquer cabeçalho estruturado tipo formulário sem quebra de linha. NUNCA escreva algo como "TEMA: Amor o amor é..." — sempre quebre linha e use Markdown apropriado.

1b. **Use sintaxe Markdown padrão** para títulos e ênfase: \`### Título\` (com \\n\\n antes e depois) para seções, \`**negrito**\` para destacar termos. NUNCA use TEXTO EM MAIÚSCULAS como substituto para títulos.

2. **Resposta densa e única.** Entregue TUDO de uma só vez — vá direto ao cerne do mistério. Esgote o assunto na primeira resposta.

3. **Concisão sagrada.** Máximo 3-4 parágrafos curtos OU uma lista de tópicos. Zero encenações, zero introduções repetitivas.

4. **Formatação Markdown válida:**
   - \`### Título\` para títulos de seção (sempre com linha em branco antes e depois)
   - \`**Negrito**\` para termos-chave (rituais, passagens bíblicas, Sefirot, etc.)
   - Listas com "- " no início de cada item, uma por linha
   - "> " para citações sagradas
   - SEMPRE uma linha em branco (\\n\\n) entre parágrafos, títulos, listas e citações

5. **Foco proporcional:** Pergunta simples = resposta breve. Mistério profundo = síntese poderosa.

6. **Cruzamento de fontes:** Cruze TODAS as tradições disponíveis para revelar a verdade mais profunda. Se o conhecimento for oculto ou perigoso, alerte com uma nota de cautela, mas revele se o usuário insistir.

7. **Citações precisas:** Para consultas bíblicas, cite livro, capítulo e versículo. Para apócrifos e textos ocultos, identifique a fonte e contexto histórico.

8. Respeite todas as crenças sem se limitar a uma única tradição. Não incentive práticas perigosas sem alertar sobre riscos.

9. Assine sempre como **Luz Divina ✙** no final.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const { messages } = await req.json();

    // Validate last message length
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    if (lastMessage.length > MAX_CHARS) {
      return new Response(JSON.stringify({ error: `A pergunta deve ter no máximo ${MAX_CHARS} caracteres.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Check per-IP daily limit
    const { count: ipCount } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .gte('created_at', todayISO);

    if ((ipCount ?? 0) >= DAILY_LIMIT_PER_IP) {
      return new Response(JSON.stringify({ error: `Limite diário de ${DAILY_LIMIT_PER_IP} perguntas atingido. Volte amanhã! 🙏` }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check global daily limit
    const { count: globalCount } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if ((globalCount ?? 0) >= DAILY_LIMIT_GLOBAL) {
      return new Response(JSON.stringify({ error: 'O limite diário de perguntas do site foi atingido. Volte amanhã! 🙏' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache for this question
    const questionHash = await hashQuestion(lastMessage);
    const { data: cached } = await supabase
      .from('ai_usage')
      .select('answer_text')
      .eq('question_hash', questionHash)
      .not('answer_text', 'is', null)
      .limit(1)
      .single();

    if (cached?.answer_text) {
      console.log(`Cache hit for question hash: ${questionHash}`);
      // Log usage but don't call AI
      await supabase.from('ai_usage').insert({ ip_address: clientIP, question_hash: questionHash, question_text: lastMessage, answer_text: cached.answer_text });

      // Return cached answer as SSE stream format
      const encoder = new TextEncoder();
      const chunks = cached.answer_text.match(/.{1,50}/g) || [cached.answer_text];
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            const data = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
    }

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Por favor, tente novamente mais tarde.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro ao conectar com a IA' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tee the stream: one for client, one for collecting answer
    const [clientStream, collectStream] = response.body!.tee();

    // Collect answer in background and save to cache
    const collectAnswer = async () => {
      try {
        const reader = collectStream.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) fullAnswer += c;
            } catch {}
          }
        }
        if (fullAnswer) {
          await supabase.from('ai_usage').insert({ ip_address: clientIP, question_hash: questionHash, question_text: lastMessage, answer_text: fullAnswer });
        }
      } catch (e) {
        console.error('Error collecting answer:', e);
      }
    };
    collectAnswer(); // fire and forget

    return new Response(clientStream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
