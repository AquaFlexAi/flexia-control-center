import { BillingStatusResponse } from '@/types/billing';

export const ASSET_CONFIG: Record<string, { color: string, name: string, yield: string }> = {
    'BTC': { color: '#F7931A', name: 'Bitcoin', yield: '5.0%' },
    'ETH': { color: '#627EEA', name: 'Ethereum', yield: '4.0%' },
    'BNB': { color: '#F3BA2F', name: 'BNB', yield: '6.0%' },
    'USDT': { color: '#26A17B', name: 'Tether', yield: '3.0%' },
    'FLX': { color: '#00D1FF', name: 'Flex Coin', yield: 'Dynamic' }
};

export type SubscriptionData = BillingStatusResponse;
