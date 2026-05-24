
-- Table for caching AI-generated images (one per category, forever)
CREATE TABLE public.cached_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  image_data text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cached_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached images" ON public.cached_images FOR SELECT USING (true);
CREATE POLICY "Service role can manage cached images" ON public.cached_images FOR ALL USING (true);

-- Table for AI chat rate limiting and response caching
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  question_hash text,
  question_text text,
  answer_text text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on ai_usage" ON public.ai_usage FOR ALL USING (true);
CREATE INDEX idx_ai_usage_ip_date ON public.ai_usage(ip_address, created_at);
CREATE INDEX idx_ai_usage_hash ON public.ai_usage(question_hash);
