-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text) from 1 for 10)),
  referred_by UUID REFERENCES public.profiles(id),
  balance DECIMAL(12,2) DEFAULT 0.00,
  accumulated_balance DECIMAL(12,2) DEFAULT 0.00,
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Investment plans table
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_amount DECIMAL(12,2) NOT NULL,
  max_amount DECIMAL(12,2) NOT NULL,
  daily_return_percentage DECIMAL(5,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view plans
CREATE POLICY "Anyone can view plans" ON public.investment_plans FOR SELECT USING (true);

-- User investments table
CREATE TABLE public.user_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
  amount DECIMAL(12,2) NOT NULL,
  daily_return DECIMAL(12,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

-- User investments policies
CREATE POLICY "Users can view own investments" ON public.user_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create investments" ON public.user_investments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions table (deposits and withdrawals)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'return', 'commission', 'checkin')),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  pix_key TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Affiliates commission table (tracking commissions from referrals)
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount DECIMAL(12,2) NOT NULL,
  investment_id UUID REFERENCES public.user_investments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Commission policies
CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions FOR SELECT USING (auth.uid() = beneficiary_id);

-- Daily checkins table
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reward_amount DECIMAL(12,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Checkin policies
CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default investment plans
INSERT INTO public.investment_plans (name, min_amount, max_amount, daily_return_percentage, duration_days) VALUES
('Iniciante', 50.00, 500.00, 1.50, 30),
('Básico', 500.00, 2000.00, 2.00, 30),
('Intermediário', 2000.00, 10000.00, 2.50, 30),
('Avançado', 10000.00, 50000.00, 3.00, 30),
('VIP', 50000.00, 200000.00, 3.50, 30);