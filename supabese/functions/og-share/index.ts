import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://luzdivina.top";

// Static blog posts data for OG tags
const blogPosts: Record<string, { title: string; excerpt: string; image: string; date: string; tags: string[] }> = {
  "como-orar-todos-os-dias": {
    title: "Como Criar o Hábito de Orar Todos os Dias",
    excerpt: "Descubra passos práticos para transformar a oração numa rotina diária que fortalece a sua fé e traz paz interior.",
    image: "/vida-de-oraçao.png",
    date: "2026-03-03",
    tags: ["oração", "hábitos espirituais", "fé"],
  },
  "versiculos-para-momentos-dificeis": {
    title: "10 Versículos Bíblicos Para Momentos Difíceis",
    excerpt: "Encontre consolo e força na Palavra de Deus com estes versículos poderosos para enfrentar as tempestades da vida.",
    image: "/momentos-dificeis.png",
    date: "2026-03-02",
    tags: ["versículos", "consolo", "força espiritual"],
  },
  "significado-do-perdao-cristao": {
    title: "O Verdadeiro Significado do Perdão Cristão",
    excerpt: "Entenda por que perdoar é um dos atos mais libertadores da fé cristã e como praticá-lo no dia a dia.",
    image: "/perdao-cristao.png",
    date: "2026-03-01",
    tags: ["perdão", "amor cristão", "libertação"],
  },
  "israel-profecias-biblicas-terceira-guerra": {
    title: "Israel Sob Ataque: As Profecias Bíblicas Estão se Cumprindo Antes de Uma Possível Terceira Guerra Mundial?",
    excerpt: "Conflitos em Israel levantam perguntas sobre profecias bíblicas e o risco de uma terceira guerra mundial.",
    image: "/israel-blog.png",
    date: "2026-03-06",
    tags: ["profecias bíblicas", "Israel", "fim dos tempos"],
  },
};

serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug || !blogPosts[slug]) {
    return new Response("Not found", { status: 404 });
  }

  const post = blogPosts[slug];
  const fullUrl = `${SITE_URL}/blog/${slug}`;
  const fullImage = post.image.startsWith("http") ? post.image : `${SITE_URL}${post.image}`;
  const fullTitle = `${post.title} | Luz Divina`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${fullTitle}</title>
  <meta name="description" content="${post.excerpt}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:image" content="${fullImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:site_name" content="Luz Divina">
  <meta property="og:locale" content="pt_BR">
  <meta property="article:published_time" content="${post.date}">
  ${post.tags.map(t => `<meta property="article:tag" content="${t}">`).join("\n  ")}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="${fullImage}">

  <!-- Redirect real users to the actual page -->
  <meta http-equiv="refresh" content="0;url=${fullUrl}">
  <link rel="canonical" href="${fullUrl}">
</head>
<body>
  <p>Redirecionando para <a href="${fullUrl}">${post.title}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
