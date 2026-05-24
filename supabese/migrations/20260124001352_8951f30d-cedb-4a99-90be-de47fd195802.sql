-- Add preferences column to push_subscriptions
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"versiculos": true, "oracoes": true, "devocionais": true}'::jsonb;
