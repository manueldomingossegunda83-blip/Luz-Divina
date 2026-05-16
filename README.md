# ✦ Luz Divina — Portal Espiritual Universal

> *"Porque em Ti está a fonte da vida; na Tua luz veremos a luz."* — Salmos 36:9

Portal espiritual estático com IA Bíblica PHD. Construído em HTML, CSS e JavaScript puro.
Hospedado no **Cloudflare Pages** via **GitHub**.

---

## 🌐 Website

**[luzdivina.top](https://luzdivina.top)**

---

## 🗂️ Estrutura de Ficheiros

```
luzdivina/
│
├── 📄 PÁGINAS (16 HTML)
│   ├── index.html            ← Home + Splash Screen
│   ├── biblia.html           ← Bíblia Sagrada completa
│   ├── ia-biblica.html       ← IA Bíblica PHD (motor principal)
│   ├── oracoes.html          ← Orações por categoria
│   ├── devocionais.html      ← Reflexões diárias
│   ├── loja.html             ← Loja de eBooks
│   ├── blog.html             ← Blog Espiritual
│   ├── sobre.html / contato.html / faq.html
│   └── privacidade / termos / cookies / aviso / disclaimer / 404
│
├── 🎨 CSS/ (ficheiros separados por domínio)
│   ├── global.css            ← Variáveis, reset, tipografia, utilitários
│   ├── components.css        ← Cards, pills, filtros, grids reutilizáveis
│   └── ia-biblica.css        ← Estilos exclusivos da IA Bíblica
│
├── 🧠 MOTOR DA IA
│   ├── knowledge.js          ← 39 tópicos teológicos (80KB)
│   └── navbar.js             ← Tema claro/escuro + menu mobile
│
├── 📚 DATA/ (dados estruturados)
│   └── personagens.json      ← 32 fichas de personagens bíblicos
│
├── 📖 BIBLIOTECA/ (11 livros apócrifos)
│   ├── index.json            ← Índice da biblioteca
│   ├── enoque.json           ← Livro de Enoque completo
│   ├── tobias.json           ← Livro de Tobias com capítulos
│   ├── evangelho_tome.json   ← 114 logia de Tomé
│   ├── protoevangelho_tiago.json ← Infância de Maria
│   ├── pastor_hermas.json    ← O Pastor (3 partes)
│   ├── apocalipse_pedro.json ← Paraíso e Inferno
│   ├── sabedoria.json        ← Sabedoria de Salomão
│   ├── macabeus.json         ← 1 e 2 Macabeus
│   ├── baruc.json            ← Baruc + Carta de Jeremias
│   └── jubileus.json         ← Livro dos Jubileus
│
├── 🌐 JSON RAIZ
│   ├── biblia.json           ← Bíblia completa 35.450 versículos (6.3MB)
│   ├── oracoes.json          ← 73 orações por categoria
│   ├── devocionais.json      ← 11 devocionais
│   ├── sedrach.json          ← Apocalipse de Sedrach PT (136 versículos)
│   └── apocrif.json          ← Índice de 13 livros apócrifos
│
├── 🖼️ PUBLIC/
│   ├── icon-192.png / icon-512.png  ← Ícones PWA + Splash
│   └── [imagens blog e loja]
│
├── ⚙️ CONFIGURAÇÃO
│   ├── navbar.css            ← CSS universal da navbar (todas as páginas)
│   ├── _headers              ← Cloudflare: segurança + cache
│   ├── _redirects            ← URLs limpas + www redirect
│   ├── manifest.json         ← PWA manifest
│   ├── sitemap.xml           ← URLs para Google
│   ├── robots.txt            ← Instruções crawlers
│   └── ads.txt               ← Autorização AdSense
└── README.md
```

---

## 🤖 IA Bíblica PHD — Arquitectura

O motor da IA funciona **100% offline** no browser do utilizador.

### 5 Camadas de Inteligência

| Camada | Função |
|---|---|
| **Classificador de Domínio** | Classifica cada pergunta: ONTOLOGIA / EXEGESE / RITUALÍSTICA / APOIO / REF / CHAT |
| **Busca de Personagens** | 32 fichas em `data/personagens.json` + busca na biblioteca de apócrifos |
| **Motor Semântico (Fuse.js)** | Pesquisa nos 35.586 versículos (Bíblia + Sedrach) |
| **Base de Conhecimento** | 39 tópicos em `knowledge.js` + 10 livros em `biblioteca/` |
| **PHD Fallback** | Mentor espiritual que nunca diz "não sei" — raciocina e gera resposta coerente |

### Módulos do Motor

```
knowledge.js          → 39 tópicos: angelologia, teologia, história bíblica
data/personagens.json → 32 personagens com linha do tempo e versículos
biblioteca/*.json     → 10 livros apócrifos com capítulos e personagens
sedrach.json          → 136 versículos traduzidos para PT
```

### Como Adicionar Novos Livros

No array `SOURCES` dentro de `ia-biblica.html`:
```javascript
{ key: 'novo_livro', url: 'biblioteca/novo_livro.json', type: 'biblioteca' }
```
O motor carrega, indexa e pesquisa automaticamente — sem alterar mais código.

---

## 🚀 Deploy (Cloudflare Pages)

| Campo | Valor |
|---|---|
| Build command | *(vazio — site estático)* |
| Build output | `/` |
| Root directory | `/` |

Push para `main` → deploy automático em ~30 segundos.

---

## 📊 Totais de Conhecimento

| Recurso | Total |
|---|---|
| Versículos indexados | 35.586 |
| Personagens bíblicos | 32 fichas |
| Tópicos teológicos | 39 |
| Livros apócrifos | 10 completos + 13 no índice |
| Orações | 73 |
| Devocionais | 11 |
| Rituais compostos | 5 |
| Templates de orações | 7 |

---

## 🛡️ Segurança (`_headers`)

- HSTS, X-Frame-Options, X-Content-Type-Options
- Content Security Policy com AdSense incluído
- Cache 1 ano para `/public/*`, sem cache para `ads.txt`

---

## 🔍 SEO

- `sitemap.xml` com URLs limpas
- Open Graph em todas as páginas
- JSON-LD (Organization + WebSite) no index
- Canonical tags por página
- `ads.txt` para AdSense

---

*Feito com 🙏 e ✦ para servir almas em todo o mundo.*
