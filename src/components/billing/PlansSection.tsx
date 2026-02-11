'use client';

import { PlanCard } from './PlanCard';

export const PLANS = [
    {
        id: 'free',
        label: 'Starter',
        price: '$0',
        period: '/mo',
        description: 'Essential resources for hobbyists.',
        cta: 'Downgrade',
        features: ['10k Compute Tokens', 'Shared Infrastructure', 'Community Support', 'Standard Network']
    },
    {
        id: 'pro',
        label: 'Pro',
        price: '$20',
        period: '/mo',
        description: 'For power users and scaling apps.',
        cta: 'Upgrade to Pro',
        features: ['1M Compute Tokens', 'Priority Routing', 'Dedicated Workers', 'Email Support', 'Staking Enabled']
    },
    {
        id: 'enterprise',
        label: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'Maximum performance and security.',
        cta: 'Contact Sales',
        features: ['Unlimited Tokens', 'Private Instances', 'Custom SLA', '24/7 Phone Support', 'White-glove Onboarding']
    }
];

interface PlansSectionProps {
    currentTier: string;
    onUpgrade: (tier: string) => void;
}

export function PlansSection({ currentTier, onUpgrade }: PlansSectionProps) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-200">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        currentTier={currentTier}
                        onUpgrade={onUpgrade}
                    />
                ))}
            </div>
        </div>
    );
}
