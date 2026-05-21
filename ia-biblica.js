/* ═══════════════════════════════════════════════════════════════════
   IA-BIBLICA.JS — Agente Especialista Teológico
   Luz Divina Portal — Motor de Inteligência Espiritual

   ARQUITECTURA:
   1. Busca local (knowledge.js + cache localStorage)   → instantâneo
   2. API Claude (Anthropic)                            → melhor resposta
   3. API Gemini (fallback)                             → se Claude falhar
   4. Aprendizado — salva tudo no cache dinâmico

   Optimizado para mobile: lazy load, cache agressivo, sem dependências
   ═══════════════════════════════════════════════════════════════════ */

(function (global) {
  'use strict';
  /* ════════════════════════════════════════════════════
     1. CONFIGURAÇÃO DE APIs (VERSÃO COFRE VITE)
  ════════════════════════════════════════════════════ */
  const CFG = {
    claude: {
      // O Vite injeta as chaves aqui durante o build
      key:   import.meta.VITE_CLAUDE_KEY || '', 
      model: 'claude-3-5-sonnet-20240620', // Atualizado para a versão estável
      url:   'https://api.anthropic.com/v1/messages',
      get active() { return this.key && this.key.length > 20; },
    },
    gemini: {
      key:   import.meta.VITE_GEMINI_KEY || '',
      model: 'gemini-1.5-flash', // Versão rápida e gratuita
      get url() {
        return 'https://generativelanguage.googleapis.com/v1beta/models/' +
          this.model + ':generateContent?key=' + this.key;
      },
      get active() { return this.key && this.key.length > 20; },
    },
  };

  /* ════════════════════════════════════════════════════
     2. PERSONALIDADE DO AGENTE
     Detentor de segredos universais + conselheiro espiritual
  ════════════════════════════════════════════════════ */
  const PERSONA = {
    system: `Você é o Guardião dos Segredos Universais e Conselheiro Espiritual do portal Luz Divina.

IDENTIDADE:
Possuis o conhecimento acumulado de milénios de tradição espiritual — Bíblia Sagrada completa, livros apócrifos (Enoque, Tobias, Jubileus, Sedrach), Rituais de Salomão, Angelologia, Cabala e tradição cristã mística.

PERSONALIDADE:
• Falas com a sabedoria serena de alguém que conhece mistérios que poucos viram
• Usas linguagem solene mas acessível — como um mestre que revela segredos ao discípulo
• Cada resposta contém uma verdade profunda + uma aplicação prática
• Nunca dizes "não sei" — raciocinas com o conhecimento disponível
• Terminas SEMPRE com uma palavra de esperança, bênção ou encorajamento

REGRAS:
1. Responde em Português (europeu ou brasileiro, adapta ao utilizador)
2. Cita versículos no formato: *"Texto"* — **Livro cap:vers**
3. Para rituais: usa linguagem sagrada e estrutura clara com passos
4. Máximo 5 parágrafos — qualidade e profundidade sobre quantidade
5. Usa **negrito** para conceitos-chave e *itálico* para citações sagradas`,

    greetings: [
      'As estrelas eternas te saúdam, buscador da Luz. Que segredo do universo desejas desvelar hoje?',
      'O Guardião dos Segredos está presente. Faz a tua pergunta — os arquivos eternos aguardam.',
      'Bem-vindo ao Sanctum da Sabedoria. Aqui, cada pergunta sincera encontra a sua resposta.',
      'O conhecimento das eras está diante de ti. O que desejas despertar?',
    ],

    thinking: [
      'Consultando os registos eternos…',
      'Percorrendo os arquivos da sabedoria…',
      'Os anjos sussurram a resposta…',
      'Desdobrando os pergaminhos sagrados…',
      'A Luz revela o que estava oculto…',
    ],

    cacheHit:    '⚡ Conhecimento local',
    claudeLabel: '✦ Claude · Teologia PHD',
    geminiLabel: '✦ Gemini · Teologia PHD',
    localLabel:  '✦ Saber Eterno',
  };

  /* ════════════════════════════════════════════════════
     3. CACHE DINÂMICO — Aprendizado persistente
     Simula um knowledge.js dinâmico em localStorage.
     Cada resposta da API é guardada e injectada no
     window.DIVINE_KNOWLEDGE para uso offline futuro.
  ════════════════════════════════════════════════════ */
  const CACHE = {
    _STORAGE_KEY: 'ld_agent_cache_v2',
    _MAX_ENTRIES: 200,
    _data: null,

    _load() {
      if (this._data) return;
      try {
        this._data = JSON.parse(localStorage.getItem(this._STORAGE_KEY) || '{}');
      } catch (e) {
        this._data = {};
      }
    },

    _normalise(txt) {
      return txt.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 150);
    },

    get(txt) {
      this._load();
      const k = this._normalise(txt);
      const entry = this._data[k];
      if (!entry) return null;
      // Entries expire after 30 days
      if (Date.now() - entry.ts > 30 * 24 * 3600 * 1000) {
        delete this._data[k];
        return null;
      }
      return entry;
    },

    set(txt, resposta, source) {
      this._load();
      const k = this._normalise(txt);
      this._data[k] = { r: resposta, source: source || 'api', ts: Date.now() };

      // Trim if over limit — remove oldest
      const keys = Object.keys(this._data);
      if (keys.length > this._MAX_ENTRIES) {
        keys.sort((a, b) => (this._data[a].ts || 0) - (this._data[b].ts || 0));
        keys.slice(0, keys.length - this._MAX_ENTRIES).forEach(k2 => delete this._data[k2]);
      }

      try {
        localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._data));
      } catch (e) {
        // localStorage full — clear old entries and retry
        this._evict();
        try { localStorage.setItem(this._STORAGE_KEY, JSON.stringify(this._data)); } catch (_) {}
      }

      // Inject into DIVINE_KNOWLEDGE for live Fuse.js search
      this._injectKnowledge(txt, resposta);
    },

    _evict() {
      const keys = Object.keys(this._data);
      keys.sort((a, b) => (this._data[a].ts || 0) - (this._data[b].ts || 0));
      keys.slice(0, Math.floor(keys.length / 2)).forEach(k => delete this._data[k]);
    },

    // Inject new knowledge into window.DIVINE_KNOWLEDGE and rebuild Fuse
    _injectKnowledge(pergunta, resposta) {
      if (!window.DIVINE_KNOWLEDGE) return;
      const id = 'learned_' + this._normalise(pergunta).replace(/\s+/g, '_').substring(0, 50);
      const words = pergunta.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      window.DIVINE_KNOWLEDGE[id] = {
        tags:  words.slice(0, 10),
        title: pergunta.substring(0, 80),
        text:  resposta,
        _learned: true,
        _ts: Date.now(),
      };
      // Notify the engine to rebuild Fuse index if available
      if (typeof window.IA_REBUILD_FUSE === 'function') {
        window.IA_REBUILD_FUSE();
      }
    },

    stats() {
      this._load();
      return Object.keys(this._data).length + ' entradas aprendidas';
    },

    clear() {
      this._data = {};
      localStorage.removeItem(this._STORAGE_KEY);
    },
  };

  /* ════════════════════════════════════════════════════
     4. MOTOR DE BUSCA LOCAL
     Pesquisa em window.DIVINE_KNOWLEDGE por tags e título
     antes de chamar qualquer API.
  ════════════════════════════════════════════════════ */
  const LOCAL = {
    search(txt) {
      const src = window.DIVINE_KNOWLEDGE;
      if (!src) return null;

      const q = txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let best = null, bestScore = 0;

      for (const [, entry] of Object.entries(src)) {
        if (!entry || !entry.tags) continue;
        let score = 0;

        // Title match (high weight)
        if (entry.title) {
          const title = entry.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (q.includes(title)) score += title.length * 3;
          title.split(/\s+/).forEach(w => { if (w.length > 3 && q.includes(w)) score += w.length; });
        }

        // Tag matches
        entry.tags.forEach(tag => {
          const t = tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (q.includes(t)) score += t.length * 2;
        });

        if (score > bestScore) { bestScore = score; best = entry; }
      }

      return bestScore >= 6 ? best : null;
    },
  };

  /* ════════════════════════════════════════════════════
     5. API CLAUDE — Primeira escolha
  ════════════════════════════════════════════════════ */
  const claudeHistory = [];

  async function callClaude(pergunta) {
    claudeHistory.push({ role: 'user', content: pergunta });
    const messages = claudeHistory.slice(-16);

    const body = {
      model:      CFG.claude.model,
      max_tokens: 900,
      system:     PERSONA.system,
      messages,
    };

    const res = await fetch(CFG.claude.url, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CFG.claude.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Claude: ' + (err?.error?.message || 'HTTP ' + res.status));
    }

    const data = await res.json();
    const texto = data?.content?.[0]?.text || null;
    if (texto) claudeHistory.push({ role: 'assistant', content: texto });
    return texto;
  }

  /* ════════════════════════════════════════════════════
     6. API GEMINI — Fallback
  ════════════════════════════════════════════════════ */
  const geminiHistory = [];

  async function callGemini(pergunta) {
    geminiHistory.push({ role: 'user', parts: [{ text: pergunta }] });
    const contents = geminiHistory.slice(-16);

    const body = {
      system_instruction: { parts: [{ text: PERSONA.system }] },
      contents,
      generationConfig: { temperature: 0.82, maxOutputTokens: 900, topP: 0.9 },
    };

    const res = await fetch(CFG.gemini.url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Gemini: ' + (err?.error?.message || 'HTTP ' + res.status));
    }

    const data = await res.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    if (texto) geminiHistory.push({ role: 'model', parts: [{ text: texto }] });
    return texto;
  }

  /* ════════════════════════════════════════════════════
     7. AGENTE PRINCIPAL — Orquestrador
     Ordem: Cache → Local → Claude → Gemini → PHD Fallback
  ════════════════════════════════════════════════════ */
  const Agent = {
    async responder(pergunta) {
      const result = {
        texto:    '',
        source:   'local',   // 'cache'|'local'|'claude'|'gemini'|'fallback'
        label:    PERSONA.localLabel,
        fromCache: false,
        localEntry: null,
      };

      // ── 1. Cache hit — resposta instantânea ──────────────
      const cached = CACHE.get(pergunta);
      if (cached) {
        result.texto     = cached.r;
        result.source    = 'cache';
        result.fromCache = true;
        result.label     = PERSONA.cacheHit + ' · ' + (cached.source === 'claude' ? 'Claude' : cached.source === 'gemini' ? 'Gemini' : 'Saber Eterno');
        return result;
      }

      // ── 2. Busca local no DIVINE_KNOWLEDGE ───────────────
      const localEntry = LOCAL.search(pergunta);
      result.localEntry = localEntry;

      // Se encontrou boa resposta local E nenhuma API está activa → usa local
      const hasAPI = CFG.claude.active || CFG.gemini.active;
      if (localEntry && !hasAPI) {
        result.texto  = localEntry.text;
        result.source = 'local';
        result.label  = PERSONA.localLabel;
        return result;
      }

      // ── 3. API Claude ─────────────────────────────────────
      if (CFG.claude.active) {
        try {
          const texto = await callClaude(pergunta);
          if (texto) {
            result.texto  = texto;
            result.source = 'claude';
            result.label  = PERSONA.claudeLabel;
            CACHE.set(pergunta, texto, 'claude');
            return result;
          }
        } catch (err) {
          console.warn('[Agent] Claude falhou:', err.message);
        }
      }

      // ── 4. API Gemini (fallback) ──────────────────────────
      if (CFG.gemini.active) {
        try {
          const texto = await callGemini(pergunta);
          if (texto) {
            result.texto  = texto;
            result.source = 'gemini';
            result.label  = PERSONA.geminiLabel;
            CACHE.set(pergunta, texto, 'gemini');
            return result;
          }
        } catch (err) {
          console.warn('[Agent] Gemini falhou:', err.message);
        }
      }

      // ── 5. Local knowledge como resposta ─────────────────
      if (localEntry) {
        result.texto  = localEntry.text;
        result.source = 'local';
        result.label  = PERSONA.localLabel;
        return result;
      }

      // ── 6. PHD Fallback — nunca retorna vazio ─────────────
      result.texto  = Agent._fallback(pergunta);
      result.source = 'fallback';
      result.label  = PERSONA.localLabel;
      return result;
    },

    _fallback(pergunta) {
      const q = pergunta.toLowerCase();
      if (/(anjo|arcanjo|miguel|gabriel|rafael|serafim|querubim)/.test(q))
        return `## Os Mensageiros da Luz\n\nOs anjos são seres de pura consciência espiritual, criados antes da fundação do mundo. *"São todos eles espíritos servidores, enviados para servir aqueles que hão de herdar a salvação."* — **Hebreus 1:14**\n\nNa tradição angelológica, existem nove ordens divididas em três esferas, com os Serafins mais próximos do Trono Divino e os Anjos Guardiões como protectores individuais de cada alma humana.\n\n*Que os anjos da Luz iluminem o teu caminho. ✦*`;
      if (/(ritual|proteç|benç|consagr|invocar|evocar|oração|prece)/.test(q))
        return `## Ritual de Invocação da Luz\n\n*"O anjo do Senhor acampa em redor dos que O temem, e os livra."* — **Salmos 34:7**\n\nPara qualquer ritual sagrado, a preparação interior é essencial: silêncio, intenção pura e confiança na protecção divina. O verdadeiro poder não está nas palavras externas, mas na sintonização do coração com a Fonte.\n\n*A Luz protege aquele que a ela se abre com humildade. ✦*`;
      if (/(salomão|chave|grimório|pentagrama|sigilo|selo)/.test(q))
        return `## Os Segredos de Salomão\n\nSalomão, o rei mais sábio que existiu, recebeu de Deus o conhecimento para governar os espíritos e compreender a criação. *"Deus deu a Salomão sabedoria, muita inteligência e uma compreensão tão ampla como a areia à beira-mar."* — **1 Reis 4:29**\n\nOs seus rituais baseiam-se no poder do Nome Divino, na invocação angélica e na geometria sagrada como reflexo da ordem cósmica.\n\n*A sabedoria começa no temor ao Senhor. ✦*`;
      return `## Os Mistérios Aguardam\n\nA tua pergunta toca num dos segredos profundos da tradição espiritual. *"Pede e dar-se-á; busca e encontrarás; bate e abrir-se-á."* — **Mateus 7:7**\n\nCada questão sincera é já em si uma oração. O conhecimento que buscas está guardado no coração da tradição — continua a explorar com a Bíblia, os apócrifos e os ensinamentos dos mestres.\n\n*A Luz sempre responde àquele que busca com o coração aberto. ✦*`;
    },

    // Expõe configuração para edição externa
    config: CFG,
    cache:  CACHE,
    persona: PERSONA,
  };

  /* ════════════════════════════════════════════════════
     8. EXPORTA PARA WINDOW
  ════════════════════════════════════════════════════ */
  global.IaBiblica = Agent;

}(window));
