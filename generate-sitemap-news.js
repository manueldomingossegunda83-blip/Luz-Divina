import fs from 'fs';
import path from 'path';

const generate = () => {
  try {
    const postsPath = path.resolve('.//data/blogPosts.ts');
    const content = fs.readFileSync(postsPath, 'utf8');

    // 1. Mudamos a Regex para procurar "slug" em vez de "id"
    const titles = [...content.matchAll(/title:\s*["'](.+?)["']/g)].map(m => m[1]);
    const slugs = [...content.matchAll(/slug:\s*["'](.+?)["']/g)].map(m => m[1]);
    const dates = [...content.matchAll(/date:\s*["'](.+?)["']/g)].map(m => m[1]);

    const quarentaEOitoHorasAtras = new Date();
    quarentaEOitoHorasAtras.setHours(quarentaEOitoHorasAtras.getHours() - 48);

    let postsXml = '';
    
    titles.forEach((title, index) => {
      const slug = slugs[index];
      const dateStr = dates[index];
      
      if (!slug || !dateStr) return; // Salta se houver erro nos dados

      const postDate = new Date(dateStr);

      if (postDate >= quarentaEOitoHorasAtras) {
        postsXml += `
  <url>
    <loc>https://luzdivina.top/blog/${slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Luz Divina 369</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${dateStr}T10:00:00Z</news:publication_date>
      <news:title>${title.replace(/&/g, '&amp;')}</news:title>
    </news:news>
  </url>`;
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${postsXml}
</urlset>`;

    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap-news.xml'), xml);
    console.log('✅ Sitemap News corrigido e gerado com sucesso!');

  } catch (e) {
    console.log('❌ Erro: ' + e.message);
  }
};

generate();
