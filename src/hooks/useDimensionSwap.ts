import { useCallback, useMemo, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { CONTRACTS, DIMENSION_BRIDGE_ABI, HYPER_HUB_ABI } from '@/lib/blockchain/contracts';

const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

export type SwapTxStage = 'idle' | 'loading' | 'approving' | 'swapping' | 'syncing' | 'confirmed' | 'failed';

export interface DimensionInfo {
    id: number;
    name: string;
    dimensionAddress: string;
    nativeToken: string;
    isActive: boolean;
    createdAt: number;
}

export interface SwapQuote {
    feeBps: number;
    rate: bigint;
    amountIn: bigint;
    fee: bigint;
    amountOut: bigint;
    toTokenLiquidity: bigint;
    fromTokenSymbol?: string;
    toTokenSymbol?: string;
    fromTokenDecimals?: number;
    toTokenDecimals?: number;
}

export function useDimensionSwap() {
    const { provider, address } = useWallet();
    const [dimensions, setDimensions] = useState<DimensionInfo[]>([]);
    const [quote, setQuote] = useState<SwapQuote | null>(null);
    const [stage, setStage] = useState<SwapTxStage>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hyperHubAddress = CONTRACTS.hyperHub.address;
    const dimensionBridgeAddress = CONTRACTS.dimensionBridge.address as string | undefined;

    const canUseBridge = useMemo(() => {
        return Boolean(provider && address && dimensionBridgeAddress);
    }, [provider, address, dimensionBridgeAddress]);

    const loadDimensions = useCallback(async () => {
        if (!provider || !hyperHubAddress) return;
        setError(null);
        setStage('loading');
        try {
            const hub = new Contract(hyperHubAddress, HYPER_HUB_ABI, provider);
            const countBn: bigint = await hub.dimensionCount();
            const count = Number(countBn);
            const ids = Array.from({ length: count }, (_, i) => i);
            const dims = await Promise.all(
                ids.map(async (id) => {
                    const d = await hub.getDimension(id);
                    return {
                        id,
                        name: d.name as string,
                        dimensionAddress: d.dimensionAddress as string,
                        nativeToken: d.nativeToken as string,
                        isActive: d.isActive as boolean,
                        createdAt: Number(d.createdAt as bigint)
                    } satisfies DimensionInfo;
                })
            );
            setDimensions(dims);
        } catch (e: any) {
            setError(e?.message || 'Failed to load dimensions');
        } finally {
            setStage('idle');
        }
    }, [provider, hyperHubAddress]);

    const getQuote = useCallback(
        async (params: { fromDimId: number; toDimId: number; amountIn: string }) => {
            if (!provider || !dimensionBridgeAddress) return null;
            setError(null);
            setStage('loading');
            setQuote(null);
            try {
                const fromDim = dimensions.find((d) => d.id === params.fromDimId);
                const toDim = dimensions.find((d) => d.id === params.toDimId);
                if (!fromDim || !toDim) throw new Error('Select two dimensions');
                if (!fromDim.isActive || !toDim.isActive) throw new Error('Selected dimensions must be active');
                if (fromDim.nativeToken.toLowerCase() === toDim.nativeToken.toLowerCase()) {
                    throw new Error('From and To token must be different');
                }

                const bridge = new Contract(dimensionBridgeAddress, DIMENSION_BRIDGE_ABI, provider);
                const fromToken = new Contract(fromDim.nativeToken, ERC20_ABI, provider);
                const toToken = new Contract(toDim.nativeToken, ERC20_ABI, provider);

                const [feeBpsBn, rate, fromDecimals, toDecimals, fromSymbol, toSymbol] = await Promise.all([
                    bridge.swapFeeBps() as Promise<bigint>,
                    bridge.exchangeRates(fromDim.nativeToken, toDim.nativeToken) as Promise<bigint>,
                    fromToken.decimals() as Promise<number>,
                    toToken.decimals() as Promise<number>,
                    fromToken.symbol().catch(() => undefined) as Promise<string | undefined>,
                    toToken.symbol().catch(() => undefined) as Promise<string | undefined>
                ]);

                if (!rate || rate === BigInt(0)) throw new Error('Exchange rate not set');

                const amountInWei = ethers.parseUnits(params.amountIn || '0', fromDecimals);
                if (amountInWei <= BigInt(0)) throw new Error('Amount must be greater than 0');

                const fee = (amountInWei * feeBpsBn) / BigInt(10000);
                const netAmountIn = amountInWei - fee;
                const amountOut = (netAmountIn * rate) / BigInt(1e18);

                const toTokenLiquidity = (await toToken.balanceOf(dimensionBridgeAddress)) as bigint;

                const next: SwapQuote = {
                    feeBps: Number(feeBpsBn),
                    rate,
                    amountIn: amountInWei,
                    fee,
                    amountOut,
                    toTokenLiquidity,
                    fromTokenSymbol: fromSymbol,
                    toTokenSymbol: toSymbol,
                    fromTokenDecimals: fromDecimals,
                    toTokenDecimals: toDecimals
                };
                setQuote(next);
                return next;
            } catch (e: any) {
                setError(e?.message || 'Failed to fetch quote');
                return null;
            } finally {
                setStage('idle');
            }
        },
        [provider, dimensionBridgeAddress, dimensions]
    );

    const approveIfNeeded = useCallback(
        async (params: { fromToken: string; amountIn: bigint }) => {
            if (!provider || !address || !dimensionBridgeAddress) throw new Error('Wallet not connected');
            setError(null);
            try {
                const signer = await provider.getSigner();
                const token = new Contract(params.fromToken, ERC20_ABI, signer);
                const allowance = (await token.allowance(address, dimensionBridgeAddress)) as bigint;
                if (allowance >= params.amountIn) return;
                const tx = await token.approve(dimensionBridgeAddress, params.amountIn);
                setTxHash(tx.hash);
                await tx.wait();
            } catch (e: any) {
                setError(e?.message || 'Failed to approve token');
                throw e;
            }
        },
        [provider, address, dimensionBridgeAddress]
    );

    const swap = useCallback(
        async (params: { fromDimId: number; toDimId: number; amountIn: string }) => {
            if (!provider || !address || !dimensionBridgeAddress) throw new Error('Wallet not connected');
            setError(null);
            setStage('approving');
            setTxHash(null);
            try {
                const fromDim = dimensions.find((d) => d.id === params.fromDimId);
                if (!fromDim) throw new Error('Invalid from dimension');
                if (!quote || !quote.fromTokenDecimals) throw new Error('Get a quote first');

                await approveIfNeeded({ fromToken: fromDim.nativeToken, amountIn: quote.amountIn });

                setStage('swapping');
                const signer = await provider.getSigner();
                const bridge = new Contract(dimensionBridgeAddress, DIMENSION_BRIDGE_ABI, signer);
                const tx = await bridge.swap(params.fromDimId, params.toDimId, quote.amountIn);
                setTxHash(tx.hash);
                await tx.wait();
                setStage('syncing');
                const res = await fetch('/api/billing/swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ txHash: tx.hash })
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.error || 'Failed to verify swap');
                }
                setStage('confirmed');
                return tx.hash as string;
            } catch (e: any) {
                setStage('failed');
                setError(e?.message || 'Swap failed');
                return null;
            }
        },
        [provider, address, dimensionBridgeAddress, dimensions, quote, approveIfNeeded]
    );

    const reset = useCallback(() => {
        setQuote(null);
        setStage('idle');
        setTxHash(null);
        setError(null);
    }, []);

    return {
        provider,
        address,
        canUseBridge,
        hyperHubAddress,
        dimensionBridgeAddress,
        dimensions,
        quote,
        stage,
        txHash,
        error,
        loadDimensions,
        getQuote,
        swap,
        reset
    };
}
