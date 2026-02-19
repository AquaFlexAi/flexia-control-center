import { useState, useEffect, useCallback } from 'react';
import { ethers, Contract } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACTS, MUDARABAH_STAKING_ABI, FLEXIA_TOKEN_ABI } from '@/lib/blockchain/contracts';
import { ASSET_CONFIG } from '@/components/market/constants';

export interface StakingData {
    stakedBalance: string;
    earned: string;
    rewardRate: string;
    totalSupply: string;
    apy: string;
    allowance: string;
}

export function useStaking() {
    const { provider, address, chainId } = useWallet();
    const [data, setData] = useState<StakingData>({
        stakedBalance: '0',
        earned: '0',
        rewardRate: '0',
        totalSupply: '0',
        apy: '0',
        allowance: '0'
    });
    const [loading, setLoading] = useState(false);

    const STAKING_CONTRACT_ADDRESS = CONTRACTS.rewards.address;
    const FLX_TOKEN_ADDRESS = CONTRACTS.token.address;

    const fetchData = useCallback(async () => {
        if (!provider || !address || !STAKING_CONTRACT_ADDRESS) return;

        try {
            const signer = await provider.getSigner();
            const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, MUDARABAH_STAKING_ABI, provider);
            const flxContract = new Contract(FLX_TOKEN_ADDRESS, FLEXIA_TOKEN_ABI, provider);

            // Fetch Data in Parallel
            const [
                stakedBalance,
                earned,
                rewardRate,
                totalSupply,
                allowance
            ] = await Promise.all([
                stakingContract.balanceOf(address).catch(() => BigInt(0)),
                stakingContract.earned(address).catch(() => BigInt(0)),
                stakingContract.rewardRate().catch(() => BigInt(0)),
                stakingContract.totalSupply().catch(() => BigInt(0)),
                flxContract.allowance ? flxContract.allowance(address, STAKING_CONTRACT_ADDRESS) : BigInt(0) // Handle missing allowance func in minimal ABI
            ]);

            // Calculate APY (Standard DeFi Formula)
            // APY = (RewardRate * 31536000 * Price) / (TotalStaked * Price)
            // Assuming Price cancels out if Reward Token == Staked Token (FLX)
            // APY = (RewardRate * 31536000) / TotalSupply

            let apy = '0';
            if (totalSupply > BigInt(0)) {
                const SECONDS_PER_YEAR = BigInt(31536000);
                const annualRewards = rewardRate * SECONDS_PER_YEAR;
                // Multiply by 100 for percentage, handle decimals (18)
                // (annual * 100 * 1e18) / total
                // heavy math, simplify for display
                const rate = (Number(ethers.formatEther(annualRewards)) / Number(ethers.formatEther(totalSupply))) * 100;
                apy = rate.toFixed(2);
            }

            setData({
                stakedBalance: ethers.formatEther(stakedBalance),
                earned: ethers.formatEther(earned),
                rewardRate: ethers.formatEther(rewardRate),
                totalSupply: ethers.formatEther(totalSupply),
                apy: apy === '0' && ASSET_CONFIG.FLX.yield !== 'Dynamic' ? ASSET_CONFIG.FLX.yield : apy + '%',
                allowance: ethers.formatEther(allowance)
            });

        } catch (error) {
            console.error("Error fetching staking data:", error);
        }
    }, [provider, address, STAKING_CONTRACT_ADDRESS, FLX_TOKEN_ADDRESS]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, [fetchData]);

    // Actions
    const approve = async (amount: string) => {
        if (!provider) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            // We need the Full ERC20 ABI for allowance/approve if not in minimal
            // Constructing on the fly for safety
            const flx = new Contract(FLX_TOKEN_ADDRESS, [
                "function approve(address spender, uint256 amount) public returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ], signer);

            const amountWei = ethers.parseEther(amount);
            const tx = await flx.approve(STAKING_CONTRACT_ADDRESS, amountWei);
            await tx.wait();
            await fetchData();
            return tx.hash as string;
        } catch (err) {
            console.error("Approve failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const stake = async (amount: string) => {
        if (!provider) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, MUDARABAH_STAKING_ABI, signer);

            const amountWei = ethers.parseEther(amount);
            const tx = await stakingContract.stake(amountWei);
            await tx.wait();
            await fetchData();
            return tx.hash as string;
        } catch (err) {
            console.error("Stake failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const withdraw = async (amount: string) => {
        if (!provider) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, MUDARABAH_STAKING_ABI, signer);

            const amountWei = ethers.parseEther(amount);
            const tx = await stakingContract.withdraw(amountWei);
            await tx.wait();
            await fetchData();
            return tx.hash as string;
        } catch (err) {
            console.error("Withdraw failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const claim = async () => {
        if (!provider) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, MUDARABAH_STAKING_ABI, signer);

            const tx = await stakingContract.getReward();
            await tx.wait();
            await fetchData();
            return tx.hash as string;
        } catch (err) {
            console.error("Claim failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        ...data,
        loading,
        approve,
        stake,
        withdraw,
        claim,
        refresh: fetchData
    };
}
