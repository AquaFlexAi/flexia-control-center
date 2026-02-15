export const ASSET_CONFIG: Record<string, { color: string, name: string, yield: string }> = {
    'BTC': { color: '#F7931A', name: 'Bitcoin', yield: '5.0%' },
    'ETH': { color: '#627EEA', name: 'Ethereum', yield: '4.0%' },
    'BNB': { color: '#F3BA2F', name: 'BNB', yield: '6.0%' },
    'USDT': { color: '#26A17B', name: 'Tether', yield: '3.0%' },
    'FLX': { color: '#00D1FF', name: 'Flex Coin', yield: '0.0%' }
};

export interface SubscriptionData {
    tier: 'free' | 'pro' | 'enterprise';
    status: string;
    usage: {
        current: number;
        limit: number;
    };
    staking?: {
        credit: number;
        assets: Array<{
            id: string;
            asset_type: string;
            amount: number;
            entry_price_usd: number;
            is_active: boolean;
        }>;
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
    };
}
