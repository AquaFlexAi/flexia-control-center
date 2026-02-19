import { DimensionSwapSection } from '@/components/market/DimensionSwapSection';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function MarketSwapPage() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <DimensionSwapSection />
        </Suspense>
    );
}
