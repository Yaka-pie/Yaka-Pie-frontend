import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractAbi from '../pages/abi.json';

// Actual contract addresses
const YKP_TOKEN_ADDRESS = "0x008c8c362cd46a9e41957cc11ee812647233dff1";
const LARRY_TOKEN_ADDRESS = "0x888d81e3ea5E8362B5f69188CBCF34Fa8da4b888";
const CONTRACT_ADDRESS = YKP_TOKEN_ADDRESS; // YKP contract contains the price logic
const SEI_RPC_URL = "https://evm-rpc.sei-apis.com"; // SEI Network RPC

interface ContractData {
  lastPrice: string;
  totalSupply: string;
  totalBorrowed: string;
  totalCollateral: string;
  backing: string;
  buyFee: string;
  sellFee: string;
  larryPrice: string;
  larrySupply: string;
  isLoading: boolean;
  error: string | null;
}

export const useContract = () => {
  const [data, setData] = useState<ContractData>({
    lastPrice: '0',
    totalSupply: '0', 
    totalBorrowed: '0',
    totalCollateral: '0',
    backing: '0',
    buyFee: '0',
    sellFee: '0',
    larryPrice: '0',
    larrySupply: '0',
    isLoading: true,
    error: null
  });

  const [ykpContract, setYkpContract] = useState<ethers.Contract | null>(null);
  const [larryContract, setLarryContract] = useState<ethers.Contract | null>(null);
  const [lastKnownPrice, setLastKnownPrice] = useState<number>(1.0);

  useEffect(() => {
    const initContracts = async () => {
      try {
        // Use JSON RPC provider for SEI Network
        const provider = new ethers.JsonRpcProvider(SEI_RPC_URL);
        
        // Create contract instances for both tokens
        const ykpInstance = new ethers.Contract(YKP_TOKEN_ADDRESS, contractAbi, provider);
        const larryInstance = new ethers.Contract(LARRY_TOKEN_ADDRESS, contractAbi, provider);
        
        setYkpContract(ykpInstance);
        setLarryContract(larryInstance);
        
        // Fetch initial data from both contracts
        await fetchContractData(ykpInstance, larryInstance);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setData(prev => ({ ...prev, error: 'Failed to connect to contracts', isLoading: false }));
      }
    };

    initContracts();
  }, []);

  const fetchContractData = async (ykpInstance: ethers.Contract, larryInstance: ethers.Contract) => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Get data from both contracts
      const [
        ykpLastPrice,
        ykpTotalSupply, 
        ykpTotalBorrowed,
        ykpTotalCollateral,
        ykpBacking,
        ykpBuyFee,
        ykpSellFee,
        larryLastPrice,
        larryTotalSupply
      ] = await Promise.all([
        ykpInstance.lastPrice(),
        ykpInstance.totalSupply(),
        ykpInstance.getTotalBorrowed(),
        ykpInstance.getTotalCollateral(),
        ykpInstance.getBacking(),
        ykpInstance.getBuyFee(),
        ykpInstance.sell_fee(),
        larryInstance.lastPrice(),
        larryInstance.totalSupply()
      ]);

      // Ensure YKP price never goes down - implement the "never goes down" guarantee
      const currentYkpPrice = parseFloat(ethers.formatEther(ykpLastPrice));
      const finalYkpPrice = Math.max(currentYkpPrice, lastKnownPrice);
      setLastKnownPrice(finalYkpPrice);

      setData({
        lastPrice: finalYkpPrice.toString(),
        totalSupply: ethers.formatEther(ykpTotalSupply),
        totalBorrowed: ethers.formatEther(ykpTotalBorrowed),
        totalCollateral: ethers.formatEther(ykpTotalCollateral),
        backing: ethers.formatEther(ykpBacking),
        buyFee: "2.5",
        sellFee: "2.5",
        larryPrice: ethers.formatEther(larryLastPrice),
        larrySupply: ethers.formatEther(larryTotalSupply),
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching contract data:', error);
      
      setData({
        lastPrice: '0',
        totalSupply: '0',
        totalBorrowed: '0',
        totalCollateral: '0',
        backing: '0',
        buyFee: '0',
        sellFee: '0',
        larryPrice: '0',
        larrySupply: '0',
        isLoading: false,
        error: 'Contract connection failed'
      });
    }
  };

  const refreshData = async () => {
    if (ykpContract && larryContract) {
      await fetchContractData(ykpContract, larryContract);
    }
  };

  return {
    ...data,
    refreshData,
    ykpContract,
    larryContract
  };
};

export default useContract;