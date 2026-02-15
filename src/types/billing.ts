export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUsageQuota {
  id: string;
  user_id: string;
  month_year: string; // Date string YYYY-MM-DD
  token_usage_limit: number; // BIGINT in DB, number in JS (watch out for overflow if very large, but tokens usually fit)
  token_usage_current: number;
  resource_value_limit?: number;
  resource_value_current?: number;
  created_at: string;
}

export interface OrganizationCredit {
  org_id: string;
  balance: number;
  tier: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  org_id?: string;
  type: string; // 'topup', 'usage', 'subscription'
  description: string;
  amount: number;
  status: string; // 'completed'
  created_at: string;
}

export interface StakingAsset {
  id?: string;
  asset: string;
  asset_type: string;
  amount: number;
  valueUsd?: number;
  entry_price_usd?: number;
  stakingPower?: number;
  is_active?: boolean;
}

export interface BillingStatusResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus | string;
  staking: {
    credit: number;
    assets: StakingAsset[] | any[]; // Define specific asset type if available
  };
  usage: {
    current: number;
    limit: number;
  };
  genesis?: {
    eligible: boolean;
    badge: boolean;
    points: number;
  };
  sovereignRewards?: {
    flaBalance: number;
    lifetimeFlaEarned: number;
    tasksCompleted: number;
    aiReputation: number;
  };
  revenueRewards?: {
    claimableEth: number;
    totalLifetimeClaimed: number;
    accruedRewards: number;
  };
  error?: string;
}

export interface CheckoutResponse {
  url?: string;
  error?: string;
}

export interface StakeResponse {
  success?: boolean;
  error?: string;
}

export interface BillingOverviewResponse {
  credits: OrganizationCredit;
  transactions: Transaction[];
  error?: string;
}

export interface QuotaVerifyResponse {
  allowed: boolean;
  userId?: string;
  error?: string;
}
