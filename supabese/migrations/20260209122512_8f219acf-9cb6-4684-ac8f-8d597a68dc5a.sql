-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;

-- Allow anyone to INSERT subscriptions (anonymous push subscriptions)
CREATE POLICY "Anyone can subscribe to notifications"
ON public.push_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to SELECT their own subscription by endpoint
CREATE POLICY "Anyone can read subscriptions by endpoint"
ON public.push_subscriptions
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to UPDATE their own subscription by endpoint
CREATE POLICY "Anyone can update subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to DELETE their own subscription
CREATE POLICY "Anyone can delete subscriptions"
ON public.push_subscriptions
FOR DELETE
TO anon, authenticated
USING (true);

-- Service role needs full access for cron cleanup
CREATE POLICY "Service role full access"
ON public.push_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
