import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Versículos bíblicos
const versiculos = [
  { texto: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { texto: "Confia no Senhor de todo o teu coração.", ref: "Provérbios 3:5" },
  { texto: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { texto: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito.", ref: "João 3:16" },
  { texto: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
  { texto: "Buscai primeiro o Reino de Deus e a sua justiça.", ref: "Mateus 6:33" },
  { texto: "Eu sou o caminho, a verdade e a vida.", ref: "João 14:6" },
  { texto: "Não temas, porque eu sou contigo.", ref: "Isaías 41:10" },
  { texto: "O amor é paciente, o amor é bondoso.", ref: "1 Coríntios 13:4" },
  { texto: "Lança o teu cuidado sobre o Senhor.", ref: "Salmos 55:22" },
];

const oracoes = [
  "🙏 Senhor, guia os meus passos neste dia.",
  "🙏 Entrego a minha vida nas Tuas mãos.",
  "🙏 Dá-me paz e sabedoria, Senhor.",
  "🙏 Senhor, renova as minhas forças hoje.",
  "🙏 Pai celestial, abençoa a minha família.",
  "🙏 Deus, ajuda-me a ser luz para os outros.",
  "🙏 Senhor, que a Tua vontade seja feita em mim.",
  "🙏 Obrigado Senhor por mais um dia de vida.",
  "🙏 Senhor, fortalece a minha fé.",
  "🙏 Deus, dá-me coragem para enfrentar os desafios.",
];

const devocionais = [
  "✨ Deus trabalha mesmo quando não O vemos.",
  "✨ A fé transforma a espera em esperança.",
  "✨ Confia: Deus está no controlo.",
  "✨ Cada novo dia é uma bênção de Deus.",
  "✨ O amor de Deus não tem limites.",
  "✨ Na quietude encontramos a voz de Deus.",
  "✨ A gratidão abre portas para mais bênçãos.",
  "✨ Deus transforma lágrimas em vitórias.",
  "✨ A oração é o caminho para o coração de Deus.",
  "✨ Nunca estamos sozinhos quando temos Deus.",
];

function escolherAleatorio<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Get or generate cached image for a category
async function getCachedImage(supabase: any, category: string): Promise<string | undefined> {
  // Check cache first
  const { data: cached } = await supabase
    .from('cached_images')
    .select('image_data')
    .eq('category', category)
    .single();

  if (cached?.image_data) {
    console.log(`Using cached image for category: ${category}`);
    return cached.image_data;
  }

  // Generate once and cache forever
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return undefined;

  const prompts: Record<string, string> = {
    versiculo: 'A breathtaking divine landscape with golden sunlight rays breaking through clouds, spiritual peaceful atmosphere. 1024x1024, optimized for web. No text.',
    oracao: 'Beautiful sacred scene with soft divine light, praying hands silhouette against majestic sunset, warm golden purple tones. 1024x1024, optimized for web. No text.',
    devocional: 'Magnificent celestial scene with radiant cross of light, gentle dawn over peaceful waters, divine hope. 1024x1024, optimized for web. No text.',
    destaque: 'Heavenly scene with brilliant golden light rays breaking through dramatic clouds, divine presence. 1024x1024, optimized for web. No text.',
  };

  try {
    console.log(`Generating and caching image for category: ${category}`);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompts[category] || prompts['destaque'] }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) return undefined;
    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageData) {
      // Save to cache - never generate again
      await supabase.from('cached_images').upsert({ category, image_data: imageData }, { onConflict: 'category' });
      console.log(`Cached image for category: ${category}`);
    }
    return imageData || undefined;
  } catch {
    return undefined;
  }
}

const categoryMap: Record<string, string> = { v: 'versiculo', o: 'oracao', d: 'devocional' };

function gerarMensagem(preferences: { versiculos: boolean; oracoes: boolean; devocionais: boolean }) {
  const tipos: string[] = [];
  if (preferences.versiculos) tipos.push("v");
  if (preferences.oracoes) tipos.push("o");
  if (preferences.devocionais) tipos.push("d");
  if (tipos.length === 0) return null;
  const tipo = escolherAleatorio(tipos);
  
  if (tipo === "v") {
    const item = escolherAleatorio(versiculos);
    return { title: "📖 Versículo do Dia", body: `${item.texto} (${item.ref})`, icon: '/icon-192.png', url: 'https://luzdivina.top/biblia', tipo: 'v' };
  }
  if (tipo === "o") {
    const item = escolherAleatorio(oracoes);
    return { title: "🙏 Oração do Dia", body: item, icon: '/icon-192.png', url: 'https://luzdivina.top/oracoes-hoje', tipo: 'o' };
  }
  const item = escolherAleatorio(devocionais);
  return { title: "✨ Devocional do Dia", body: item, icon: '/icon-192.png', url: 'https://luzdivina.top/devocional-hoje', tipo: 'd' };
}

function base64UrlDecode(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const decoded = atob(base64 + padding);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer;
}

async function createVapidAuthHeader(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string, vapidSubject: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp: expiry, sub: vapidSubject };
  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)).buffer);
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)).buffer);
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const jwk = { kty: 'EC', crv: 'P-256', d: vapidPrivateKey, x: vapidPublicKey.substring(0, 43), y: vapidPublicKey.substring(43) };
  const privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(unsignedToken));
  const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`;
  return `vapid t=${jwt}, k=${vapidPublicKey}`;
}

async function sendWebPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string, vapidPublicKey: string, vapidPrivateKey: string, vapidSubject: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
    const localKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const p256dhBuffer = base64UrlDecode(subscription.keys.p256dh);
    const subscriberPublicKey = await crypto.subtle.importKey('raw', p256dhBuffer, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: subscriberPublicKey }, localKeyPair.privateKey, 256);
    const authSecret = base64UrlDecode(subscription.keys.auth);
    const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
    const keyInfo = concatBuffers(encoder.encode('WebPush: info\0').buffer, p256dhBuffer, localPublicKeyRaw);
    const authKey = await crypto.subtle.importKey('raw', authSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const ikm = await crypto.subtle.sign('HMAC', authKey, sharedSecret);
    const prkKey = await crypto.subtle.importKey('raw', ikm, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const cekInfo = concatBuffers(encoder.encode('Content-Encoding: aes128gcm\0').buffer, keyInfo, new Uint8Array([1]).buffer);
    const cekFull = await crypto.subtle.sign('HMAC', prkKey, cekInfo);
    const cek = cekFull.slice(0, 16);
    const nonceInfo = concatBuffers(encoder.encode('Content-Encoding: nonce\0').buffer, keyInfo, new Uint8Array([1]).buffer);
    const nonceFull = await crypto.subtle.sign('HMAC', prkKey, nonceInfo);
    const nonce = nonceFull.slice(0, 12);
    const payloadBytes = encoder.encode(payload);
    const paddedPayload = concatBuffers(payloadBytes.buffer, new Uint8Array([2]).buffer);
    const encryptKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, encryptKey, paddedPayload);
    const recordSize = new Uint8Array([0, 0, 16, 0]).buffer;
    const idLen = new Uint8Array([65]).buffer;
    const body = concatBuffers(salt, recordSize, idLen, localPublicKeyRaw, encrypted);
    const authHeader = await createVapidAuthHeader(subscription.endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject);
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', 'TTL': '86400', 'Authorization': authHeader },
      body: body,
    });
    if (response.ok || response.status === 201) return { success: true, status: response.status };
    const errorText = await response.text();
    return { success: false, status: response.status, error: errorText };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@luzdivina.top';
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey);

    // Pre-load cached images for all categories (generate once if missing)
    const imageCache: Record<string, string | undefined> = {};
    for (const cat of ['versiculo', 'oracao', 'devocional']) {
      imageCache[cat] = await getCachedImage(supabase, cat);
    }

    const { data: subscriptions, error: fetchError } = await supabase.from('push_subscriptions').select('*');
    if (fetchError) throw fetchError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    console.log(`Found ${subscriptions.length} subscriptions`);
    let successCount = 0, failCount = 0;
    const results = [];

    for (const sub of subscriptions) {
      const prefs = sub.preferences || { versiculos: true, oracoes: true, devocionais: true };
      const notification = gerarMensagem(prefs);
      if (!notification) { results.push({ status: 'skipped' }); continue; }

      // Use cached image by category
      const image = imageCache[categoryMap[notification.tipo]];
      const notifPayload = { ...notification, image };

      const pushResult = await sendWebPushNotification(
        { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
        JSON.stringify(notifPayload), vapidPublicKey, vapidPrivateKey, vapidSubject
      );

      if (pushResult.success) {
        successCount++;
        results.push({ status: 'sent' });
      } else {
        failCount++;
        if (pushResult.status === 410 || pushResult.status === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          results.push({ status: 'removed' });
        } else {
          results.push({ status: 'failed', error: pushResult.error });
        }
      }
    }

    console.log(`Sent ${successCount}, failed ${failCount}`);
    return new Response(JSON.stringify({ sent: successCount, failed: failCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
