import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `És a IA Luz Divina, um agente teológico de nível PHD especializado em:
- Teologia Bíblica (Antigo e Novo Testamento)
- Angelologia e Demonologia bíblica
- Rituais e Chaves de Salomão
- Livros Apócrifos e Deuterocanônicos (Enoque, Tobias, Sabedoria, Macabeus, Esdras, Sedrach)
- Exegese e Hermenêutica
- Orações e Salmos com explicação profunda
- Cabala e Misticismo judaico-cristão
- Personagens bíblicos e sua história

INSTRUÇÕES:
- Responde SEMPRE em português europeu (Portugal)
- Usa linguagem erudita mas acessível
- Cita versículos no formato: "texto do versículo" — Livro capítulo:versículo
- Usa **negrito** para termos importantes
- Usa ## para títulos e ### para subtítulos
- Fornece contexto histórico e teológico profundo
- Sê completo e detalhado como um verdadeiro guardião do conhecimento sagrado`;

const HINTS = [
  "Consultando os registos eternos…",
  "Os anjos sussurram a resposta…",
  "Desdobrando os pergaminhos sagrados…",
  "Invocando o conhecimento de Salomão…",
  "Consultando os Livros Apócrifos…",
];

const QUICK = [
  { i: "✝️", t: "Quem é Deus?",         q: "Quem é Deus segundo a Bíblia?" },
  { i: "⚔️", t: "Ritual Salomão",        q: "Ritual de proteção de Salomão" },
  { i: "👼", t: "Hierarquia Angelical",  q: "Hierarquia completa dos anjos" },
  { i: "📖", t: "Salmo 91",              q: "Explica o Salmo 91" },
  { i: "🔑", t: "Chaves de Salomão",    q: "O que são as Chaves de Salomão?" },
  { i: "📜", t: "Livro de Enoque",       q: "Fala sobre o Livro de Enoque" },
  { i: "🛡️", t: "Oração de Protecção",  q: "Quero uma oração de proteção poderosa" },
  { i: "💙", t: "Jesus chorou",          q: "Onde está escrito que Jesus chorou?" },
];

function fmt(txt) {
  if (!txt) return "";
  const parts = [];
  let remaining = txt;

  // Extrai versículos
  remaining = remaining.replace(/"([^"]{5,300})"\s*[—–-]\s*([^\n<]{3,80})/g, (_, verse, ref) => {
    return `\x00VERSE:${verse}|REF:${ref}\x00`;
  });

  return remaining
    .replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong style="color:#f0d27a;font-weight:600">${t}</strong>`)
    .replace(/\*(.*?)\*/g, (_, t) => `<em style="color:#94a3b8">${t}</em>`)
    .replace(/^## (.+)$/gm, (_, t) => `<div style="font-family:'Georgia',serif;color:#c9a84c;font-size:1.15rem;margin:1rem 0 .4rem;font-weight:700;border-bottom:1px solid rgba(201,168,76,.2);padding-bottom:.2rem">${t}</div>`)
    .replace(/^### (.+)$/gm, (_, t) => `<div style="font-family:'Georgia',serif;color:#c9a84c;font-size:1rem;margin:.7rem 0 .3rem;font-weight:700">${t}</div>`)
    .replace(/^[-•] (.+)$/gm, (_, t) => `<div style="color:#94a3b8;font-size:.87rem;margin:.2rem 0;padding-left:.8rem">• ${t}</div>`)
    .replace(/\x00VERSE:(.+?)\|REF:(.+?)\x00/g, (_, v, r) =>
      `<div style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.22);border-left:3px solid #c9a84c;border-radius:0 10px 10px 0;padding:.7rem 1rem;margin:.5rem 0">` +
      `<div style="font-family:'Georgia',serif;font-style:italic;font-size:1rem;color:#e2eaf8;line-height:1.65">"${v}"</div>` +
      `<div style="font-size:.68rem;font-weight:700;color:#c9a84c;margin-top:.3rem;letter-spacing:.8px">— ${r}</div></div>`)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export default function IaBiblica() {
  const [messages, setMessages]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [input, setInput]         = useState("");
  const [busy, setBusy]           = useState(false);
  const [streaming, setStreaming] = useState("");
  const [hintIdx, setHintIdx]     = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, streaming]);

  async function send(text) {
    const txt = (text || input).trim();
    if (!txt || busy) return;
    setBusy(true);
    setInput("");
    setHintIdx(h => (h + 1) % HINTS.length);

    const newHistory = [...history, { role: "user", content: txt }];
    setHistory(newHistory);
    setMessages(m => [...m, { role: "user", content: txt }]);

    let fullText = "";
    setStreaming("…");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: newHistory,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "Erro HTTP " + response.status);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
              fullText += json.delta.text || "";
              setStreaming(fullText);
            }
          } catch (_) {}
        }
      }

      setStreaming("");
      const finalHistory = [...newHistory, { role: "assistant", content: fullText }];
      setHistory(finalHistory.slice(-30));
      setMessages(m => [...m, { role: "assistant", content: fullText }]);

    } catch (err) {
      setStreaming("");
      setMessages(m => [...m, { role: "error", content: err.message }]);
      console.error("[IA Luz Divina]", err);
    }

    setTurnCount(t => t + 1);
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function limpar() {
    setMessages([]); setHistory([]);
    setStreaming(""); setBusy(false); setTurnCount(0);
  }

  const s = {
    wrap: {
      background: "#080d18", minHeight: "100vh", display: "flex",
      flexDirection: "column", fontFamily: "'Jost', 'Segoe UI', sans-serif",
      color: "#e2eaf8",
    },
    topBar: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#0f1b2d", border: "1px solid rgba(79,156,249,.13)",
      borderRadius: "14px", padding: ".5rem .9rem", margin: ".6rem",
      gap: ".6rem", flexShrink: 0,
    },
    orb: {
      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
      background: "linear-gradient(135deg,#2563eb,#a78bfa)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.1rem", boxShadow: "0 0 14px rgba(79,156,249,.3)",
    },
    chatWin: {
      flex: 1, background: "#0f1b2d", border: "1px solid rgba(79,156,249,.13)",
      borderRadius: "18px", display: "flex", flexDirection: "column",
      overflow: "hidden", margin: "0 .6rem", minHeight: 0,
    },
    msgs: {
      flex: 1, padding: "1rem .9rem", overflowY: "auto",
      display: "flex", flexDirection: "column", gap: ".8rem",
      scrollbarWidth: "thin",
    },
    msgUser: {
      alignSelf: "flex-end", maxWidth: "88%",
      background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
      color: "#fff", borderRadius: "14px 14px 3px 14px",
      padding: ".75rem 1rem", fontSize: ".91rem", lineHeight: 1.65,
      animation: "pop .2s ease",
    },
    msgBot: {
      alignSelf: "flex-start", maxWidth: "95%",
      background: "#152238", border: "1px solid rgba(79,156,249,.13)",
      borderRadius: "14px 14px 14px 3px",
      padding: ".85rem 1rem", fontSize: ".9rem", lineHeight: 1.8,
    },
    msgErr: {
      alignSelf: "flex-start", maxWidth: "90%",
      background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)",
      borderRadius: "14px", padding: ".75rem 1rem", color: "#f87171", fontSize: ".87rem",
    },
    inputBar: {
      background: "#0d1525", borderTop: "1px solid rgba(79,156,249,.13)",
      padding: ".65rem .75rem", display: "flex", gap: ".5rem", alignItems: "flex-end",
    },
    textarea: {
      flex: 1, background: "#111e33", border: "1px solid rgba(79,156,249,.13)",
      borderRadius: 13, padding: ".72rem 1rem", color: "#e2eaf8",
      fontSize: ".92rem", fontFamily: "inherit",
      outline: "none", resize: "none", minHeight: 44, maxHeight: 120,
      lineHeight: 1.5,
    },
    btnSend: {
      background: "#c9a84c", color: "#0f1b2d", border: "none",
      padding: ".72rem 1.1rem", borderRadius: 13, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem",
      letterSpacing: ".3px", height: 44, display: "flex", alignItems: "center", gap: ".3rem",
      flexShrink: 0,
    },
    btnClear: {
      background: "none", border: "1px solid rgba(79,156,249,.13)", color: "#94a3b8",
      padding: ".3rem .65rem", borderRadius: 8, fontSize: ".72rem",
      fontWeight: 600, cursor: "pointer",
    },
    modeBadge: {
      fontSize: ".58rem", fontWeight: 700, padding: ".18rem .5rem",
      borderRadius: 6, letterSpacing: ".5px", textTransform: "uppercase",
      background: "rgba(167,139,250,.12)", color: "#a78bfa",
      border: "1px solid rgba(167,139,250,.3)",
    },
    phdBadge: {
      fontSize: ".56rem", fontWeight: 700, letterSpacing: "1px",
      color: "#a78bfa", background: "rgba(167,139,250,.1)",
      border: "1px solid rgba(167,139,250,.25)",
      padding: ".1rem .5rem", borderRadius: 6, textTransform: "uppercase",
      marginLeft: ".4rem",
    },
    botLabel: {
      fontSize: ".58rem", fontWeight: 700, letterSpacing: "2px",
      textTransform: "uppercase", color: "#c9a84c",
      marginBottom: ".4rem", display: "flex", alignItems: "center", gap: ".35rem",
    },
    srcTag: {
      fontSize: ".52rem", padding: ".06rem .4rem", borderRadius: 5,
      letterSpacing: ".3px", textTransform: "uppercase",
      background: "rgba(167,139,250,.1)", color: "#a78bfa",
      border: "1px solid rgba(167,139,250,.25)",
    },
    quickGrid: {
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem",
      width: "100%", maxWidth: 400, marginTop: ".6rem",
    },
    qBtn: {
      background: "#152238", border: "1px solid rgba(79,156,249,.13)", color: "#94a3b8",
      padding: ".5rem .7rem", borderRadius: 11, fontSize: ".74rem", fontWeight: 500,
      cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center",
      gap: ".35rem", lineHeight: 1.3,
    },
    typingWrap: {
      display: "flex", alignItems: "center", gap: ".5rem",
      padding: ".65rem .9rem", background: "#152238",
      border: "1px solid rgba(79,156,249,.13)",
      borderRadius: "14px 14px 14px 3px", alignSelf: "flex-start",
      animation: "pop .2s ease",
    },
    dot: (i) => ({
      width: 6, height: 6, borderRadius: "50%", background: "#c9a84c", opacity: .4,
      animation: `bounce 1.3s ${i * 0.18}s infinite`,
    }),
  };

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <div style={s.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap');
        @keyframes pop    { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes glow   { 0%,100%{filter:drop-shadow(0 0 5px rgba(201,168,76,.3))} 50%{filter:drop-shadow(0 0 14px rgba(201,168,76,.75))} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes cur    { 0%,100%{opacity:1} 50%{opacity:0} }
        .stream-cur::after { content:'▋'; animation:cur .7s infinite; color:#c9a84c; margin-left:2px; }
        .dot-live { animation:blink 2s infinite; }
        .qbtn:hover { border-color:#c9a84c !important; color:#c9a84c !important; }
      `}</style>

      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={{ display:"flex", alignItems:"center", gap:".65rem" }}>
          <div style={s.orb}>✦</div>
          <div>
            <div style={{ fontSize:".86rem", fontWeight:700 }}>
              IA Luz Divina <span style={s.phdBadge}>PHD</span>
            </div>
            <div style={{ fontSize:".63rem", color:"#4ade80", display:"flex", alignItems:"center", gap:".3rem", marginTop:1 }}>
              <span className="dot-live" style={{ width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block" }}/>
              Motor Claude · {turnCount > 0 ? `${turnCount} turn${turnCount>1?"os":"o"}` : "Pronto"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
          <span style={s.modeBadge}>✦ CLAUDE</span>
          <button style={s.btnClear} onClick={limpar}>↺ Limpar</button>
        </div>
      </div>

      {/* CHAT */}
      <div style={s.chatWin}>
        <div ref={msgsRef} style={s.msgs}>

          {/* Ecrã vazio */}
          {isEmpty && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"1.5rem", gap:".8rem" }}>
              <div style={{ fontSize:"2.4rem", animation:"glow 3s infinite" }}>✦</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:"1.5rem", color:"#c9a84c", fontWeight:700 }}>Guardião dos Segredos</div>
              <div style={{ fontSize:".8rem", color:"#94a3b8", maxWidth:280, lineHeight:1.6 }}>
                Angelologia · Rituais de Salomão · Exegese · Orações · Apócrifos
              </div>
              <div style={s.quickGrid}>
                {QUICK.map(q => (
                  <button key={q.q} className="qbtn" style={s.qBtn} onClick={() => send(q.q)}>
                    <span style={{ fontSize:"1rem" }}>{q.i}</span>{q.t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          {messages.map((m, i) => (
            <div key={i}>
              {m.role === "user" && (
                <div style={s.msgUser}>
                  <div style={{ fontSize:".57rem", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,.5)", marginBottom:".3rem" }}>Tu</div>
                  {m.content}
                </div>
              )}
              {m.role === "assistant" && (
                <div style={s.msgBot}>
                  <div style={s.botLabel}>✦ LUZ DIVINA <span style={s.srcTag}>✦ CLAUDE</span></div>
                  <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                </div>
              )}
              {m.role === "error" && (
                <div style={s.msgErr}>
                  ⚠️ <strong>Erro:</strong> {m.content}
                </div>
              )}
            </div>
          ))}

          {/* Streaming */}
          {busy && streaming && (
            <div style={s.msgBot}>
              <div style={s.botLabel}>✦ LUZ DIVINA <span style={s.srcTag}>✦ CLAUDE</span></div>
              <div className="stream-cur" style={{ whiteSpace:"pre-wrap", color:"#e2eaf8", fontSize:".9rem", lineHeight:1.8 }}>
                {streaming}
              </div>
            </div>
          )}

          {/* Typing dots */}
          {busy && !streaming && (
            <div style={s.typingWrap}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={s.dot(i)} />)}
              </div>
              <span style={{ fontSize:".72rem", color:"#94a3b8", fontStyle:"italic" }}>
                {HINTS[hintIdx]}
              </span>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={s.inputBar}>
          <textarea
            ref={inputRef}
            style={s.textarea}
            placeholder="Pergunta bíblica, ritual, anjos, oração…"
            value={input}
            disabled={busy}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            rows={1}
          />
          <button style={{ ...s.btnSend, opacity: busy ? .5 : 1 }} disabled={busy} onClick={() => send()}>
            ✦ ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
}
