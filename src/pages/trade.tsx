import { useState, useEffect } from "react";
import Link from "next/link";
import { Geist, Inter } from "next/font/google";
// Import the real YAKA PIE Contract ABI
import YAKA_PIE_ABI from './abi.json';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const YKP_TOKEN_ADDRESS = "0x008c8c362cd46a9e41957cc11ee812647233dff1";
const LARRY_TOKEN_ADDRESS = "0x888d81e3ea5E8362B5f69188CBCF34Fa8da4b888";
const SEI_CHAIN_ID = 1329; // SEI EVM Mainnet

// Centralized selector map keyed by function signature (no hardcoded hex scattered around)
const SELECTOR_MAP: Record<string, string> = {
  // ERC20 common
  'name()': '0x06fdde03',
  'symbol()': '0x95d89b41',
  'decimals()': '0x313ce567',
  'totalSupply()': '0x18160ddd',
  'balanceOf(address)': '0x70a08231',
  'allowance(address,address)': '0xdd62ed3e',
  'approve(address,uint256)': '0x095ea7b3',

  // YKP contract custom
  'buy(address,uint256)': '0xcce7ec13',
  'sell(uint256)': '0xe4849b32',
  // Updated to match on-chain selector for leverage
  'leverage(uint256,uint256)': '0x5e96263c',
  'borrow(uint256,uint256)': '0x0ecbcdab',
  'borrowMore(uint256)': '0x9d0bf2e9',
  'Loans(address)': '0xa925e4a4',
  'getBacking()': '0xc94220ab',
  'getBuyFee()': '0x8f818b90',
  'sell_fee()': '0xabd545bf',
  'buy_fee_leverage()': '0x36189d43',
  'getBuyTokens(uint256)': '0x7545823b',
  'acceptOwnership()': '0x79ba5097',
  'burn(uint256)': '0x42966c68',
  'burnFrom(address,uint256)': '0x79cc6790',
  'closePosition()': '0xc393d0e3',
  'extendLoan(uint256)': '0x7ace2ac9',
  'flashClosePosition()': '0x9d41ac3a',
  'liquidate()': '0x28a07025',
  'removeCollateral(uint256)': '0x3237c158',
  'renounceOwnership()': '0x715018a6',
  'repay(uint256)': '0x371fd8e6',
  'setBuyFee(uint16)': '0x70c47671',
  'setBuyFeeLeverage(uint16)': '0x17a5a97e',
  'setFeeAddress(address)': '0x8705fcd4',
  'setSellFee(uint16)': '0xe064648a',
  'setStart(uint256,uint256)': '0x4286fa4e',
  'transfer(address,uint256)': '0xa9059cbb',
  'transferFrom(address,address,uint256)': '0x23b872dd',
  'transferOwnership(address)': '0xf2fde38b',
  // Additional read-only selectors per provided list
  'BorrowedByDate(uint256)': '0x4fbf3ab0',
  'CollateralByDate(uint256)': '0xc962a4b5',
  'FEE_ADDRESS()': '0xeb1edd61',
  'LARRYtoTOKENS(uint256)': '0x2b50aeb2',
  'LARRYtoTOKENSCeil(uint256)': '0xbe96f7ca',
  'TOKENStoLARRY(uint256)': '0xf61bc497',
  'backingToken()': '0x47e621b7',
  'getBuyAmount(uint256)': '0x1fb87f39',
  'getInterestFee(uint256,uint256)': '0x035b7c4b',
  'getLoanByAddress(address)': '0x95ced06f',
  'getLoansExpiringByDate(uint256)': '0x024cad3b',
  'getMidnightTimestamp(uint256)': '0xe3eb5ed3',
  'getTotalBorrowed()': '0x0307c4a1',
  'getTotalCollateral()': '0xd6eb5910',
  'isLoanExpired(address)': '0x70f84ba9',
  'lastLiquidationDate()': '0x3421f750',
  'lastPrice()': '0x053f14da',
  'leverageFee(uint256,uint256)': '0x3be4e598',
  'owner()': '0x8da5cb5b',
  'pendingOwner()': '0xe30c3978',
  'start()': '0xbe9a6555',
};

const getSelectorForSignature = (signature: string): string => {
  const sel = SELECTOR_MAP[signature];
  if (!sel) throw new Error(`Missing selector for signature: ${signature}`);
  return sel;
};

interface EthereumError {
  code: number;
  message: string;
}

// Removed unused ABIFunction interface

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export default function TradePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [activeTab, setActiveTab] = useState("buy");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [larryBalance, setLarryBalance] = useState("0");
  const [ykpBalance, setYkpBalance] = useState("0");

  // Fetch contract state on component mount
  useEffect(() => {
    const initializeContract = async () => {
      const isContractAvailable = await testContractConnection();
      if (isContractAvailable) {
        await fetchContractState();
      } else {
        console.warn("Contract not available, using fallback values");
      }
    };
    
    initializeContract();
  }, []);

  // Refresh user loan when account connects/changes or when Manage tab is opened
  useEffect(() => {
    if (isConnected && account) {
      if (activeTab === 'manage') {
        fetchUserLoan(account);
      }
    }
  }, [isConnected, account, activeTab]);

  // Buy/Sell states
  const [buyLarryAmount, setBuyLarryAmount] = useState("");
  const [buyYkpAmount, setBuyYkpAmount] = useState("");
  const [sellYkpAmount, setSellYkpAmount] = useState("");
  const [sellLarryAmount, setSellLarryAmount] = useState("");

  // Leverage states
  const [leverageLarryAmount, setLeverageLarryAmount] = useState("");
  const [leverageDays, setLeverageDays] = useState("365");
  const [leverageFee, setLeverageFee] = useState("");

  // Borrow states
  const [borrowLarryAmount, setBorrowLarryAmount] = useState("");
  const [borrowDays, setBorrowDays] = useState("365");
  const [borrowCollateral, setBorrowCollateral] = useState("");

  // Borrow More states
  const [borrowMoreAmount, setBorrowMoreAmount] = useState("");
  const [borrowMoreCollateral, setBorrowMoreCollateral] = useState("");

  // Position Management states
  const [removeCollateralAmount, setRemoveCollateralAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [extendDays, setExtendDays] = useState("30");

  // Flash Close states removed
  
  // Real arbitrage data state
  const [realArbitrageData, setRealArbitrageData] = useState<{
    realYkpFromOneLarry: number;
    realLarryFromYkp: number;
    timestamp: number;
  } | null>(null);
  
  // Contract state for leverage calculations
  const [contractBacking, setContractBacking] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [buyFee, setBuyFee] = useState("975");
  const [sellFee, setSellFee] = useState("975");
  const [leverageFeeRate, setLeverageFeeRate] = useState("10");
  const [userLoan, setUserLoan] = useState({ collateral: "0", borrowed: "0", endDate: "0", numberOfDays: "0" });
  
  // OpenOcean price data
  const [openOceanPrices, setOpenOceanPrices] = useState({
    larryPrice: 0,
    ykpPrice: 0,
    lastUpdated: 0,
    larryToYkpRate: 0,
    ykpToLarryRate: 0,
    error: null as string | null
  });

  // Calculate buy amounts using real contract data
  useEffect(() => {
    const calculateBuyAmount = async () => {
      if (buyLarryAmount && parseFloat(buyLarryAmount) > 0) {
        // First try to use the contract's getBuyTokens function directly
        const tokensFromContract = await getBuyTokensFromContract(buyLarryAmount);
        if (parseFloat(tokensFromContract) > 0) {
          setBuyYkpAmount(tokensFromContract);
          return;
        }
        
        // Fallback to manual calculation if contract backing and supply are available
        if (contractBacking && totalSupply && buyFee && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0) {
          const tokensFromManual = calculateTokensFromLarry(buyLarryAmount);
          const feeMultiplier = parseFloat(buyFee) / 1000; // Convert from basis points
          const tokensAfterFee = parseFloat(tokensFromManual) * feeMultiplier;
          setBuyYkpAmount(tokensAfterFee.toFixed(4));
        } else {
          // Final fallback to static calculation
          const calculated = (parseFloat(buyLarryAmount) * 0.975).toFixed(4);
          setBuyYkpAmount(calculated);
        }
      } else {
        setBuyYkpAmount("");
      }
    };
    
    calculateBuyAmount();
  }, [buyLarryAmount, contractBacking, totalSupply, buyFee]);

  // Calculate sell amounts using real contract data
  useEffect(() => {
    const calculateSellAmount = async () => {
      if (sellYkpAmount && parseFloat(sellYkpAmount) > 0) {
        // First try to use the contract simulation for accurate sell amount
        const realLarryFromSell = await getSellTokensFromContract(sellYkpAmount);
        if (parseFloat(realLarryFromSell) > 0) {
          setSellLarryAmount(realLarryFromSell);
          return;
        }
        
        // Fallback to contract data calculation if simulation fails
        if (contractBacking && totalSupply && sellFee) {
          const larryFromContract = calculateLarryFromTokens(sellYkpAmount);
          const feeMultiplier = parseFloat(sellFee) / 1000; // Convert from basis points
          const larryAfterFee = parseFloat(larryFromContract) * feeMultiplier;
          setSellLarryAmount(larryAfterFee.toFixed(4));
        } else {
          // Final fallback to static calculation
          const calculated = (parseFloat(sellYkpAmount) * 0.975).toFixed(4);
          setSellLarryAmount(calculated);
        }
      } else {
        setSellLarryAmount("");
      }
    };

    calculateSellAmount();
  }, [sellYkpAmount, contractBacking, totalSupply, sellFee]);

  // Calculate leverage fee using real contract data
  useEffect(() => {
    if (leverageLarryAmount && parseFloat(leverageLarryAmount) > 0 && leverageDays && leverageFeeRate) {
      // Use the real contract calculation function
      const calculatedFee = calculateLeverageFee(leverageLarryAmount, leverageDays);
      setLeverageFee(calculatedFee);
    } else if (leverageLarryAmount && parseFloat(leverageLarryAmount) > 0 && leverageDays) {
      // Fallback to static calculation if contract data not loaded
      const baseInterest = (parseFloat(leverageLarryAmount) * 0.039 * parseFloat(leverageDays)) / 365;
      const dayInterest = (parseFloat(leverageLarryAmount) * 0.001 * parseFloat(leverageDays));
      const totalFee = (parseFloat(leverageLarryAmount) * 0.1) + baseInterest + dayInterest;
      setLeverageFee(totalFee.toFixed(4));
    } else {
      setLeverageFee("");
    }
  }, [leverageLarryAmount, leverageDays, leverageFeeRate]);

  // Default leverage amount to full LARRY balance when connected
  useEffect(() => {
    if (isConnected && parseFloat(larryBalance) > 0) {
      const lb = parseFloat(larryBalance);
      const floored = (Math.floor(lb * 1e4) / 1e4).toFixed(4);
      setLeverageLarryAmount(floored);
    }
  }, [isConnected, larryBalance]);

  // Calculate borrow collateral using real contract data
  useEffect(() => {
    if (borrowLarryAmount && parseFloat(borrowLarryAmount) > 0 && contractBacking && totalSupply) {
      // Convert LARRY to tokens for collateral (need to over-collateralize by ~1%)
      const larryAmount = parseFloat(borrowLarryAmount);
      // Need to provide collateral worth more than 99% of borrowed amount
      const requiredLarryCollateral = larryAmount / 0.99;
      const requiredTokenCollateral = calculateTokensFromLarry(requiredLarryCollateral.toString());
      setBorrowCollateral(requiredTokenCollateral);
    } else if (borrowLarryAmount && parseFloat(borrowLarryAmount) > 0) {
      // Fallback to static calculation
      const collateral = (parseFloat(borrowLarryAmount) / 0.99).toFixed(4);
      setBorrowCollateral(collateral);
    } else {
      setBorrowCollateral("");
    }
  }, [borrowLarryAmount, contractBacking, totalSupply]);

  // Calculate real arbitrage data using getBuyTokens and getSellTokens
  useEffect(() => {
    const calculateRealArbitrageData = async () => {
      if (contractBacking && totalSupply) {
        try {
          // Get real YKP amount from 1 LARRY
          const realYkpFromOneLarry = await getBuyTokensFromContract("1");
          const ykpAmount = parseFloat(realYkpFromOneLarry);
          
          if (ykpAmount > 0) {
            // Get real LARRY amount from selling the YKP we got
            const realLarryFromYkp = await getSellTokensFromContract(realYkpFromOneLarry);
            const larryAmount = parseFloat(realLarryFromYkp);
            
            setRealArbitrageData({
              realYkpFromOneLarry: ykpAmount,
              realLarryFromYkp: larryAmount > 0 ? larryAmount / ykpAmount : 0, // YKP to LARRY rate
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error("Failed to calculate real arbitrage data:", error);
        }
      }
    };

    calculateRealArbitrageData();
  }, [contractBacking, totalSupply]); // Recalculate when contract data changes

  // Set default extend days to maximum extendable days
  useEffect(() => {
    if (userLoan && userLoan.endDate && userLoan.endDate !== "0") {
      const currentTime = Math.floor(Date.now() / 1000);
      const loanEndTime = parseInt(userLoan.endDate);
      const remainingDays = Math.max(0, Math.floor((loanEndTime - currentTime) / (24 * 60 * 60)));
      const maxExtendableDays = Math.max(0, 365 - remainingDays);
      
      if (maxExtendableDays > 0 && (!extendDays || extendDays === "30")) {
        setExtendDays(maxExtendableDays.toString());
      }
    }
  }, [userLoan.endDate]);

  // Auto-switch tabs based on loan status
  useEffect(() => {
    const hasExistingLoan = userLoan && userLoan.borrowed && parseFloat(userLoan.borrowed) > 0;
    
    // If user has a loan but is on leverage/borrow tab, switch to borrow-more
    if (hasExistingLoan && (activeTab === "leverage" || activeTab === "borrow")) {
      setActiveTab("borrow-more");
    }
    
    // If user has no loan but is on borrow-more/manage tab, switch to buy
    if (!hasExistingLoan && (activeTab === "borrow-more" || activeTab === "manage")) {
      setActiveTab("buy");
    }
  }, [userLoan.borrowed, activeTab]);

  // Function to fetch user balances
  const fetchBalances = async (userAccount: string) => {
    if (!window.ethereum) return;
    
    try {
      // Get LARRY balance
      const larryBalanceData = encodeContractCall(getSelectorForSignature('balanceOf(address)'), [padAddress(userAccount)]); // balanceOf
      const larryResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: LARRY_TOKEN_ADDRESS,
          data: larryBalanceData
        }, 'latest']
      }) as string;
      
      const larryBalanceWei = BigInt(larryResult);
      // Convert wei to ether with full precision
      const weiString = larryBalanceWei.toString();
      const etherStr = weiString.length > 18 
        ? weiString.slice(0, -18) + '.' + weiString.slice(-18).replace(/0+$/, '')
        : '0.' + weiString.padStart(18, '0').replace(/0+$/, '');
      setLarryBalance(etherStr.endsWith('.') ? etherStr.slice(0, -1) : etherStr || '0');
      
      // Get YKP balance  
      const ykpBalanceData = encodeContractCall(getSelectorForSignature('balanceOf(address)'), [padAddress(userAccount)]); // balanceOf
      const ykpResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: ykpBalanceData
        }, 'latest']
      }) as string;
      
      const ykpBalanceWei = BigInt(ykpResult);
      // Convert wei to ether with full precision
      const ykpWeiString = ykpBalanceWei.toString();
      const ykpEtherStr = ykpWeiString.length > 18 
        ? ykpWeiString.slice(0, -18) + '.' + ykpWeiString.slice(-18).replace(/0+$/, '')
        : '0.' + ykpWeiString.padStart(18, '0').replace(/0+$/, '');
      setYkpBalance(ykpEtherStr.endsWith('.') ? ykpEtherStr.slice(0, -1) : ykpEtherStr || '0');
      
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  };

  // Function to check current network
  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const currentChainId = parseInt(chainId, 16);
      console.log("Current chain ID:", currentChainId);
      console.log("Expected chain ID:", SEI_CHAIN_ID);
      
      if (currentChainId !== SEI_CHAIN_ID) {
        console.warn(`Wrong network! Current: ${currentChainId}, Expected: ${SEI_CHAIN_ID}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to check network:", error);
      return false;
    }
  };

  // Find function in ABI and create proper call data
  type AbiInput = { name: string; type: string; internalType?: string; };
  type AbiItem = { type: string; name?: string; stateMutability?: string; inputs?: AbiInput[] };
  const findFunctionInABI = (functionName: string): AbiItem | undefined => {
    return (YAKA_PIE_ABI as AbiItem[]).find((item) => 
      item.type === 'function' && item.name === functionName
    );
  };

  // Use standard keccak256 calculation for function selectors
  const calculateFunctionSelector = (functionSignature: string): string => {
    // Since we can't use crypto.subtle for keccak256, let's try the known working approach
    // Use a simple mapping based on what actually works
    
    const standardSelectors: { [key: string]: string } = SELECTOR_MAP;
    
    const selector = standardSelectors[functionSignature];
    if (selector) {
      console.log(`🔧 Using selector for ${functionSignature}: ${selector}`);
      return selector;
    }
    
    console.error(`❌ No selector found for: ${functionSignature}`);
    return '0x00000000';
  };

  // Get function selector for a function name
  const getFunctionSelector = (functionName: string): string => {
    const signature = `${functionName}()`;
    return calculateFunctionSelector(signature);
  };

  // Create function selector using direct RPC test
  const createFunctionSelector = (functionName: string): string => {
    return getFunctionSelector(functionName);
  };
  
  // Test a function selector by trying it
  const testFunctionSelector = async (functionName: string, selector: string) => {
    try {
      const result = await window.ethereum?.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: selector
        }, 'latest']
      }) as string;
      
      console.log(`Testing ${functionName} with ${selector}: ${result}`);
      return result && result !== '0x' && result !== '0x0';
    } catch (error) {
      console.log(`Failed ${functionName} with ${selector}:`, error);
      return false;
    }
  };
  
  // Debug brute-force helper removed

  // Function to test a single contract function using ABI
  const testSingleFunction = async (functionName: string) => {
    if (!window.ethereum) {
      console.error(`❌ No ethereum provider for ${functionName}`);
      return null;
    }
    
    try {
      // Find function in ABI
      const abiFunction = findFunctionInABI(functionName);
      if (!abiFunction) {
        console.error(`❌ Function ${functionName} not found in ABI`);
        return null;
      }
      
      const selector = createFunctionSelector(functionName);
      console.log(`🔍 Testing ${functionName}:`);
      console.log(`  Selector: ${selector}`);
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: selector
        }, 'latest']
      }) as string;
      
      console.log(`  Raw result: ${result}`);
      
      if (!result || result === '0x' || result === '0x0') {
        console.warn(`  ❌ ${functionName} returned empty/zero`);
        return null;
      }
      
      console.log(`  ✅ ${functionName} successful`);
      return result;
      
    } catch (error) {
      console.error(`  ❌ ${functionName} failed:`, error);
      return null;
    }
  };

  // Debug helpers removed (testAllContractFunctions, bruteForceTest)

  // Function to fetch contract state for leverage calculations
  const fetchContractState = async () => {
    if (!window.ethereum) {
      console.error("❌ No ethereum provider");
      return;
    }
    
    // Check if we're on the right network first
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.error("❌ Cannot fetch contract state - wrong network");
      return;
    }
    
    console.log("🚀 Fetching contract state from:", YKP_TOKEN_ADDRESS);
    
    try {
      // Test getBacking(); fall back to LARRY.balanceOf(YKP)
      const backingResult = await testSingleFunction('getBacking');
      if (backingResult) {
        const backingWei = BigInt(backingResult);
        // Convert wei to ether with full precision
        const backingWeiString = backingWei.toString();
        const backingEtherStr = backingWeiString.length > 18 
          ? backingWeiString.slice(0, -18) + '.' + backingWeiString.slice(-18).replace(/0+$/, '')
          : '0.' + backingWeiString.padStart(18, '0').replace(/0+$/, '');
        const backingFormatted = backingEtherStr.endsWith('.') ? backingEtherStr.slice(0, -1) : backingEtherStr || '0';
        setContractBacking(backingFormatted);
        console.log(`💰 Contract backing: ${backingFormatted} LARRY`);
      } else {
        // Fallback: read LARRY token balance of the YKP contract
        try {
          const selector = getSelectorForSignature('balanceOf(address)');
          const calldata = selector + padAddress(YKP_TOKEN_ADDRESS);
          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: LARRY_TOKEN_ADDRESS, data: calldata }, 'latest']
          }) as string;
          if (result && result !== '0x') {
            const wei = BigInt(result);
            // Convert wei to ether with full precision
            const weiString = wei.toString();
            const etherStr = weiString.length > 18 
              ? weiString.slice(0, -18) + '.' + weiString.slice(-18).replace(/0+$/, '')
              : '0.' + weiString.padStart(18, '0').replace(/0+$/, '');
            const formatted = etherStr.endsWith('.') ? etherStr.slice(0, -1) : etherStr || '0';
            setContractBacking(formatted);
            console.log(`💰 Contract backing (fallback via LARRY.balanceOf): ${formatted} LARRY`);
          } else {
            console.warn('⚠️ Fallback LARRY.balanceOf returned empty');
          }
        } catch (e) {
          console.warn('⚠️ Fallback backing fetch failed:', e);
        }
      }
      
      // Test totalSupply()
      const totalSupplyResult = await testSingleFunction('totalSupply');
      if (totalSupplyResult) {
        const totalSupplyWei = BigInt(totalSupplyResult);
        // Convert wei to ether with full precision
        const supplyWeiString = totalSupplyWei.toString();
        const supplyEtherStr = supplyWeiString.length > 18 
          ? supplyWeiString.slice(0, -18) + '.' + supplyWeiString.slice(-18).replace(/0+$/, '')
          : '0.' + supplyWeiString.padStart(18, '0').replace(/0+$/, '');
        const totalSupplyFormatted = supplyEtherStr.endsWith('.') ? supplyEtherStr.slice(0, -1) : supplyEtherStr || '0';
        setTotalSupply(totalSupplyFormatted);
        console.log(`🔢 Total supply: ${totalSupplyFormatted} YKP`);
      }
      
      // Test getBuyFee()
      const buyFeeResult = await testSingleFunction('getBuyFee');
      if (buyFeeResult) {
        const buyFeeValue = BigInt(buyFeeResult);
        setBuyFee(buyFeeValue.toString());
        console.log(`💸 Buy fee: ${buyFeeValue.toString()}`);
      } else {
        setBuyFee("975"); // Default fallback
      }
      
      // Test sell_fee()
      const sellFeeResult = await testSingleFunction('sell_fee');
      if (sellFeeResult) {
        const sellFeeValue = BigInt(sellFeeResult);
        setSellFee(sellFeeValue.toString());
        console.log(`💰 Sell fee: ${sellFeeValue.toString()}`);
      } else {
        setSellFee("975"); // Default fallback
      }
      
      // Test buy_fee_leverage()
      const leverageFeeResult = await testSingleFunction('buy_fee_leverage');
      if (leverageFeeResult) {
        const leverageFeeValue = BigInt(leverageFeeResult);
        setLeverageFeeRate(leverageFeeValue.toString());
        console.log(`🚀 Leverage fee rate: ${leverageFeeValue.toString()}`);
      } else {
        setLeverageFeeRate("10"); // Default fallback
      }
      
      console.log("✅ Contract state fetch completed");
      
    } catch (error) {
      console.error("❌ Failed to fetch contract state:", error);
      // Set default values if contract calls fail
      setBuyFee("975");
      setSellFee("975");
      setLeverageFeeRate("10");
    }
  };

  // Utility function to safely convert decimal string to wei BigInt
  const toWei = (amount: string | number, decimals: number = 18): bigint => {
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;
    if (!amountStr || parseFloat(amountStr) === 0) return BigInt(0);
    
    // Split into integer and decimal parts
    const [integerPart = '0', decimalPart = ''] = amountStr.split('.');
    
    // Pad or trim decimal part to match required decimals
    const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    
    // Combine and convert to BigInt
    const weiString = integerPart + paddedDecimal;
    return BigInt(weiString);
  };

  // Function to get buy tokens directly from contract
  const getBuyTokensFromContract = async (larryAmount: string) => {
    if (!window.ethereum || !larryAmount || parseFloat(larryAmount) <= 0) return "0";
    
    // Check network first
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.warn("Cannot call getBuyTokens - wrong network");
      return "0";
    }
    
    try {
      const larryAmountWei = toWei(larryAmount, 18);
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      
      // Call getBuyTokens(amount) via ABI-derived selector
      const selector = getSelectorForSignature('getBuyTokens(uint256)');
      const getBuyTokensData = selector + padNumber(larryAmountHex);
      
      console.log("🔍 Calling getBuyTokens:");
      console.log("  📍 Contract:", YKP_TOKEN_ADDRESS);
      console.log("  💰 LARRY Amount:", larryAmount);
      console.log("  🔢 Wei:", larryAmountWei.toString());
      console.log("  🔧 Selector:", selector);
      console.log("  📦 Call Data:", getBuyTokensData);
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: getBuyTokensData
        }, 'latest']
      }) as string;
      
      console.log("📥 getBuyTokens raw result:", result);
      
      if (!result || result === '0x' || result === '0x0') {
        console.warn("⚠️ getBuyTokens returned empty/zero");
        return "0";
      }
      
      const tokensWei = BigInt(result);
      // Convert wei to ether with full precision
      const tokensWeiString = tokensWei.toString();
      const tokensEtherStr = tokensWeiString.length > 18 
        ? tokensWeiString.slice(0, -18) + '.' + tokensWeiString.slice(-18).replace(/0+$/, '')
        : '0.' + tokensWeiString.padStart(18, '0').replace(/0+$/, '');
      const tokensFormatted = tokensEtherStr.endsWith('.') ? tokensEtherStr.slice(0, -1) : tokensEtherStr || '0';
      console.log("✅ Tokens from getBuyTokens:", tokensFormatted, "YKP");
      
      return tokensFormatted;
    } catch (error) {
      console.error("❌ Failed to call getBuyTokens:", error);
      return "0";
    }
  };

  // Function to get LARRY amount from selling YKP tokens via contract simulation
  const getSellTokensFromContract = async (ykpAmount: string) => {
    if (!window.ethereum || !ykpAmount || parseFloat(ykpAmount) <= 0) return "0";
    
    // Check network first
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.warn("Cannot call sell simulation - wrong network");
      return "0";
    }
    
    try {
      const ykpAmountWei = toWei(ykpAmount, 18);
      const ykpAmountHex = '0x' + ykpAmountWei.toString(16);
      
      // Simulate sell function call to see how much LARRY would be returned
      const selector = getSelectorForSignature('sell(uint256)');
      const sellData = selector + padNumber(ykpAmountHex);
      
      console.log("🔍 Simulating sell transaction:");
      console.log("  📍 Contract:", YKP_TOKEN_ADDRESS);
      console.log("  💰 YKP Amount:", ykpAmount);
      console.log("  🔢 Wei:", ykpAmountWei.toString());
      console.log("  🔧 Selector:", selector);
      console.log("  📦 Call Data:", sellData);
      
      // Note: This will simulate the transaction to see what LARRY amount would be returned
      // The sell function should return or emit the LARRY amount that would be transferred
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: sellData,
          from: account // Need to specify from address for proper simulation
        }, 'latest']
      }) as string;
      
      console.log("📥 Sell simulation raw result:", result);
      
      if (!result || result === '0x' || result === '0x0') {
        console.warn("⚠️ Sell simulation returned empty/zero - using fallback calculation");
        // Fallback to current calculation method
        const larryFromTokens = calculateLarryFromTokens(ykpAmount);
        const sellFeeNum = parseFloat(sellFee) / 1000;
        const larryAfterFee = parseFloat(larryFromTokens) * sellFeeNum;
        return larryAfterFee.toFixed(6);
      }
      
      const larryWei = BigInt(result);
      // Convert wei to ether with full precision
      const larryWeiString = larryWei.toString();
      const larryEtherStr = larryWeiString.length > 18 
        ? larryWeiString.slice(0, -18) + '.' + larryWeiString.slice(-18).replace(/0+$/, '')
        : '0.' + larryWeiString.padStart(18, '0').replace(/0+$/, '');
      const larryFormatted = larryEtherStr.endsWith('.') ? larryEtherStr.slice(0, -1) : larryEtherStr || '0';
      console.log("✅ LARRY from sell simulation:", larryFormatted, "LARRY");
      
      return larryFormatted;
    } catch (error) {
      console.error("❌ Failed to simulate sell transaction:", error);
      // Fallback to current calculation method
      const larryFromTokens = calculateLarryFromTokens(ykpAmount);
      const sellFeeNum = parseFloat(sellFee) / 1000;
      const larryAfterFee = parseFloat(larryFromTokens) * sellFeeNum;
      return larryAfterFee.toFixed(6);
    }
  };

  // Test direct RPC call to verify contract functions
  const testDirectRPC = async () => {
    try {
      console.log("🔍 Testing direct RPC call to SEI...");
      
      // Test with a direct fetch to SEI RPC
      const response = await fetch('https://evm-rpc.sei-apis.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: YKP_TOKEN_ADDRESS,
            data: '0x18160ddd' // totalSupply()
          }, 'latest'],
          id: 1
        })
      });
      
      const data = await response.json();
      console.log("📥 Direct RPC response:", data);
      
      if (data.result) {
        console.log("✅ Direct RPC working!");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("❌ Direct RPC test failed:", error);
      return false;
    }
  };

  // List all functions in the ABI
  const listABIFunctions = () => {
    console.log("📜 ABI Functions:");
    const functions = (YAKA_PIE_ABI as AbiItem[]).filter((item) => item.type === 'function');
    functions.forEach((func, index: number) => {
      console.log(`  ${index + 1}. ${func.name}() - ${func.stateMutability}`);
    });
    return functions;
  };

  // Test function to verify contract is deployed and responding
  const testContractConnection = async () => {
    if (!window.ethereum) {
      console.error("❌ No ethereum provider found");
      return false;
    }
    
    // Check network first
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.error("❌ Wrong network - switch to SEI EVM Mainnet (Chain ID: 1329)");
      return false;
    }
    
    try {
      console.log("🔍 Testing contract connection to:", YKP_TOKEN_ADDRESS);
      
      // List all functions from ABI
      listABIFunctions();
      
      // Test direct RPC first
      const directRPCWorks = await testDirectRPC();
      if (!directRPCWorks) {
        console.error("❌ Direct RPC test failed");
      }
      
      // First test: Check if there's any code at this address
      const code = await window.ethereum.request({
        method: 'eth_getCode',
        params: [YKP_TOKEN_ADDRESS, 'latest']
      }) as string;
      
      console.log("📜 Contract code length:", code.length);
      
      if (!code || code === '0x' || code.length <= 2) {
        console.error("❌ No contract deployed at address:", YKP_TOKEN_ADDRESS);
        console.log("💡 This could mean:");
        console.log("   1. Wrong contract address");
        console.log("   2. Contract not deployed on this network");
        console.log("   3. Wrong network (current should be SEI EVM Mainnet)");
        return false;
      }
      
      console.log("✅ Contract code found - testing function calls...");
      return true;
      
    } catch (error) {
      console.error("❌ Contract connection test failed:", error);
      return false;
    }
  };

  // Function to fetch user's loan data
  const fetchUserLoan = async (userAccount: string) => {
    if (!window.ethereum) return;
    
    try {
      // Get user loan data (Loans mapping)
      const loanData = encodeContractCall(getSelectorForSignature('Loans(address)'), [padAddress(userAccount)]); // Loans(address)
      const loanResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: loanData
        }, 'latest']
      }) as string;
      
      // Decode the loan data (collateral, borrowed, endDate, numberOfDays)
      const loanResultHex = loanResult.slice(2);
      const collateral = BigInt('0x' + loanResultHex.slice(0, 64));
      const borrowed = BigInt('0x' + loanResultHex.slice(64, 128));
      const endDate = BigInt('0x' + loanResultHex.slice(128, 192));
      const numberOfDays = BigInt('0x' + loanResultHex.slice(192, 256));
      
      // Convert collateral wei to ether with full precision
      const collateralWeiString = collateral.toString();
      const collateralEtherStr = collateralWeiString.length > 18 
        ? collateralWeiString.slice(0, -18) + '.' + collateralWeiString.slice(-18).replace(/0+$/, '')
        : '0.' + collateralWeiString.padStart(18, '0').replace(/0+$/, '');
      const collateralFormatted = collateralEtherStr.endsWith('.') ? collateralEtherStr.slice(0, -1) : collateralEtherStr || '0';
      
      // Convert borrowed wei to ether with full precision  
      const borrowedWeiString = borrowed.toString();
      const borrowedEtherStr = borrowedWeiString.length > 18 
        ? borrowedWeiString.slice(0, -18) + '.' + borrowedWeiString.slice(-18).replace(/0+$/, '')
        : '0.' + borrowedWeiString.padStart(18, '0').replace(/0+$/, '');
      const borrowedFormatted = borrowedEtherStr.endsWith('.') ? borrowedEtherStr.slice(0, -1) : borrowedEtherStr || '0';
      
      setUserLoan({
        collateral: collateralFormatted,
        borrowed: borrowedFormatted,
        endDate: endDate.toString(),
        numberOfDays: numberOfDays.toString()
      });
      
    } catch (error) {
      console.error("Failed to fetch user loan:", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' }) as string[];
        setAccount(accounts[0]);
        setIsConnected(true);

        // Switch to SEI network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SEI_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          // This error code indicates that the chain has not been added to MetaMask
          const error = switchError as EthereumError;
          if (error.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${SEI_CHAIN_ID.toString(16)}`,
                chainName: 'SEI Network',
                nativeCurrency: {
                  name: 'SEI',
                  symbol: 'SEI',
                  decimals: 18,
                },
                rpcUrls: ['https://evm-rpc.sei-apis.com'],
                blockExplorerUrls: ['https://seitrace.com'],
              }],
            });
          }
        }
        
        // Fetch balances and contract state after connection
        await fetchBalances(accounts[0]);
        await fetchContractState(); // Refresh contract state
        await fetchUserLoan(accounts[0]);
        
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet");
    }
  };

  // Helper function to create contract call data
  const encodeContractCall = (functionSig: string, params: string[]) => {
    return functionSig + params.join('');
  };

  // Calculate real leverage fee using contract data
  const calculateLeverageFee = (larryAmount: string, days: string) => {
    if (!larryAmount || !days) return "0";
    
    const amount = parseFloat(larryAmount);
    const numDays = parseFloat(days);
    
    // Use the actual leverage fee rate from contract
    const leverageFeePercent = parseFloat(leverageFeeRate) / 1000; // Convert from basis points
    const mintFee = amount * leverageFeePercent;
    
    // Calculate interest: 3.9% APY + 0.1% per day
    const interestRate = (0.039 * numDays) / 365 + 0.001 * numDays;
    const interestFee = amount * interestRate;
    
    return (mintFee + interestFee).toFixed(4);
  };

  // Calculate tokens received from LARRY amount using contract data
  const calculateTokensFromLarry = (larryAmount: string) => {
    if (!larryAmount || !contractBacking || !totalSupply) return "0";
    
    const amount = parseFloat(larryAmount);
    const backing = parseFloat(contractBacking);
    const supply = parseFloat(totalSupply);
    
    if (backing === 0) return "0";
    
    const tokens = (amount * supply) / backing;
    return tokens.toFixed(4);
  };

  // Calculate LARRY from tokens using contract data
  const calculateLarryFromTokens = (tokenAmount: string) => {
    if (!tokenAmount || !contractBacking || !totalSupply) return "0";
    
    const tokens = parseFloat(tokenAmount);
    const backing = parseFloat(contractBacking);
    const supply = parseFloat(totalSupply);
    
    if (supply === 0) return "0";
    
    const larry = (tokens * backing) / supply;
    return larry.toFixed(4);
  };

  // Helper function to pad address
  const padAddress = (address: string) => {
    return address.slice(2).toLowerCase().padStart(64, '0');
  };

  // Fetch OpenOcean prices using v4 API
  const fetchOpenOceanPrices = async () => {
    try {
      const LARRY_ADDRESS = "0x888d81e3ea5E8362B5f69188CBCF34Fa8da4b888"; // OpenOcean LARRY token
      const YKP_ADDRESS = "0x008c8c362cd46a9e41957cc11ee812647233dff1"; // OpenOcean YKP token
      const chain = "1329"; // SEI chain
      
      console.log("🔍 Fetching OpenOcean prices for:", { LARRY_ADDRESS, YKP_ADDRESS, chain });
      
      // Fetch LARRY/YKP price directly (LARRY -> YKP)
      const larryToYkpUrl = `https://open-api.openocean.finance/v4/${chain}/quote?inTokenAddress=${LARRY_ADDRESS}&outTokenAddress=${YKP_ADDRESS}&amountDecimals=1000000000000000000&gasPriceDecimals=1000000000`;
      console.log("📡 LARRY->YKP URL:", larryToYkpUrl);
      
      const larryToYkpResponse = await fetch(larryToYkpUrl);
      
      // Fetch YKP/LARRY price (YKP -> LARRY)  
      const ykpToLarryUrl = `https://open-api.openocean.finance/v4/${chain}/quote?inTokenAddress=${YKP_ADDRESS}&outTokenAddress=${LARRY_ADDRESS}&amountDecimals=1000000000000000000&gasPriceDecimals=1000000000`;
      console.log("📡 YKP->LARRY URL:", ykpToLarryUrl);
      
      const ykpToLarryResponse = await fetch(ykpToLarryUrl);

      console.log("📥 Response status:", { 
        larryToYkp: larryToYkpResponse.status, 
        ykpToLarry: ykpToLarryResponse.status 
      });

      if (larryToYkpResponse.ok) {
        const larryToYkpData = await larryToYkpResponse.json();
        console.log("📊 LARRY->YKP Response:", larryToYkpData);
      }
      
      if (ykpToLarryResponse.ok) {
        const ykpToLarryData = await ykpToLarryResponse.json();
        console.log("📊 YKP->LARRY Response:", ykpToLarryData);
        
        // If both requests succeeded, process the data
        if (larryToYkpResponse.ok) {
          const larryToYkpData = await fetch(larryToYkpUrl).then(r => r.json());
          
          if (larryToYkpData.code === 200 && ykpToLarryData.code === 200 && larryToYkpData.data && ykpToLarryData.data) {
            // Calculate exchange rates
            const larryToYkpRate = parseFloat(larryToYkpData.data.outAmount) / 1e18;
            const ykpToLarryRate = parseFloat(ykpToLarryData.data.outAmount) / 1e18;
            
            setOpenOceanPrices({
              larryPrice: 1, // Base price
              ykpPrice: larryToYkpRate, // YKP price in LARRY terms
              lastUpdated: Date.now(),
              larryToYkpRate,
              ykpToLarryRate,
              error: null
            });
            
            console.log("✅ OpenOcean Rates Updated:", { 
              "1 LARRY =": `${larryToYkpRate.toFixed(6)} YKP`,
              "1 YKP =": `${ykpToLarryRate.toFixed(6)} LARRY`
            });
          } else {
            console.warn("⚠️ OpenOcean API returned error codes or missing data:", {
              larryToYkp: larryToYkpData,
              ykpToLarry: ykpToLarryData
            });
            // Set error state
            setOpenOceanPrices(prev => ({
              ...prev,
              lastUpdated: Date.now(),
              error: "No liquidity found for LARRY/YKP pair on OpenOcean"
            }));
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to fetch OpenOcean prices:", error);
      setOpenOceanPrices(prev => ({
        ...prev,
        lastUpdated: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  };

  // Helper function to pad number (handles hex strings)
  const padNumber = (num: string | number) => {
    if (typeof num === 'string' && num.startsWith('0x')) {
      return num.slice(2).padStart(64, '0');
    }
    return Number(num).toString(16).padStart(64, '0');
  };

  // ABI-based function call encoding
  const encodeFunctionCall = (functionName: string, params: unknown[]) => {
    // Simple ABI encoding for our specific functions
    if (functionName === 'buy') {
      const receiver = params[0] as string; // address
      const amount = params[1] as string; // uint256
      const result = '0xcce7ec13' + padAddress(receiver) + padNumber(amount);
      console.log(`Encoding buy function:`);
      console.log(`  Receiver: ${receiver}`);
      console.log(`  Amount: ${amount}`);
      console.log(`  Padded receiver: ${padAddress(receiver)}`);
      console.log(`  Padded amount: ${padNumber(amount)}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'sell') {
      const tokens = params[0] as string; // uint256
      const result = '0xe4849b32' + padNumber(tokens);
      console.log(`Encoding sell function:`);
      console.log(`  Tokens: ${tokens}`);
      console.log(`  Padded tokens: ${padNumber(tokens)}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'approve') {
      const spender = params[0] as string; // address
      const amount = params[1] as string; // uint256
      const result = '0x095ea7b3' + padAddress(spender) + padNumber(amount);
      console.log(`Encoding approve function:`);
      console.log(`  Spender: ${spender}`);
      console.log(`  Amount: ${amount}`);
      console.log(`  Padded spender: ${padAddress(spender)}`);
      console.log(`  Padded amount: ${padNumber(amount)}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'leverage') {
      const larry = params[0] as string; // uint256
      const numberOfDays = params[1] as string; // uint256
      const selector = getSelectorForSignature('leverage(uint256,uint256)');
      const result = selector + padNumber(larry) + padNumber(numberOfDays);
      console.log(`Encoding leverage function:`);
      console.log(`  LARRY: ${larry}`);
      console.log(`  Number of Days: ${numberOfDays}`);
      console.log(`  Padded LARRY: ${padNumber(larry)}`);
      console.log(`  Padded Days: ${padNumber(numberOfDays)}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'borrow') {
      const larry = params[0] as string; // uint256
      const numberOfDays = params[1] as string; // uint256
      const selector = getSelectorForSignature('borrow(uint256,uint256)');
      const result = selector + padNumber(larry) + padNumber(numberOfDays);
      console.log(`Encoding borrow function:`);
      console.log(`  LARRY: ${larry}`);
      console.log(`  Number of Days: ${numberOfDays}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'borrowMore') {
      const larry = params[0] as string; // uint256
      const selector = getSelectorForSignature('borrowMore(uint256)');
      const result = selector + padNumber(larry);
      console.log(`Encoding borrowMore function:`);
      console.log(`  LARRY: ${larry}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'removeCollateral') {
      const amount = params[0] as string; // uint256
      const selector = getSelectorForSignature('removeCollateral(uint256)');
      const result = selector + padNumber(amount);
      console.log(`Encoding removeCollateral function:`);
      console.log(`  Amount: ${amount}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'repay') {
      const amount = params[0] as string; // uint256
      const selector = getSelectorForSignature('repay(uint256)');
      const result = selector + padNumber(amount);
      console.log(`Encoding repay function:`);
      console.log(`  Amount: ${amount}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'extendLoan') {
      const days = params[0] as string; // uint256
      const selector = getSelectorForSignature('extendLoan(uint256)');
      const result = selector + padNumber(days);
      console.log(`Encoding extendLoan function:`);
      console.log(`  Days: ${days}`);
      console.log(`  Final data: ${result}`);
      return result;
    } else if (functionName === 'closePosition') {
      const selector = getSelectorForSignature('closePosition()');
      console.log(`Encoding closePosition function: ${selector}`);
      return selector;
    } else if (functionName === 'flashClosePosition') {
      const selector = getSelectorForSignature('flashClosePosition()');
      console.log(`Encoding flashClosePosition function: ${selector}`);
      return selector;
    }

    throw new Error(`Unsupported function: ${functionName}`);
  };



  // Trading Functions
  const executeTransaction = async (to: string, data: string, value: string = '0x0') => {
    if (!window.ethereum || !isConnected) {
      alert("Please connect your wallet first");
      return null;
    }

    try {
      const transactionParameters = {
        to,
        from: account,
        value,
        data,
        gas: '0x55730', // 350000 in hex (enough for most contract calls)
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      }) as string;

      return txHash;

    } catch (error: unknown) {
      console.error("Transaction failed:", error);

      const err = error as { code?: number; message?: string };
      if (err.code === 4001) {
        throw new Error("Transaction cancelled by user");
      } else {
        throw new Error(err.message || "Transaction failed");
      }
    }
  };

  const buyYKP = async () => {
    if (!isConnected || !buyLarryAmount) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert LARRY amount to wei (18 decimals) - handle large numbers safely
      const larryAmountFloat = parseFloat(buyLarryAmount);
      if (isNaN(larryAmountFloat) || larryAmountFloat <= 0) {
        throw new Error("Invalid LARRY amount");
      }

      // Check for extremely large numbers that could cause precision issues
      // Allow up to 1 billion tokens (reasonable for DeFi trading)
      const maxReasonableAmount = 1000000000; // 1 billion
      if (larryAmountFloat > maxReasonableAmount) {
        throw new Error("Amount too large. Maximum allowed is 1,000,000,000 LARRY tokens.");
      }

      // Use a safer method to handle large numbers without scientific notation
      const decimals = 18;
      const larryAmountWei = toWei(larryAmountFloat, decimals);
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      
      // Step 1: Approve LARRY tokens for the YKP contract
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, larryAmountHex]);

      console.log("Step 1: Approving LARRY tokens...");
      const approveTxHash = await executeTransaction(LARRY_TOKEN_ADDRESS, approveData);

      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }

      console.log("LARRY tokens approved! Hash:", approveTxHash);

      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Call buy function on YKP contract
      const buyData = encodeFunctionCall('buy', [account, larryAmountHex]);

      console.log("Step 2: Buying YKP tokens...");
      console.log("Account (receiver):", account);
      console.log("LARRY Amount (hex):", larryAmountHex);
      console.log("Buy Data:", buyData);
      console.log("Expected buy data format:", getSelectorForSignature('buy(address,uint256)') + padAddress(account) + padNumber(larryAmountHex));

      const buyTxHash = await executeTransaction(YKP_TOKEN_ADDRESS, buyData);
      
      if (buyTxHash) {
        setTxHash(buyTxHash);
        alert(`Buy YKP transaction submitted! Transaction hash: ${buyTxHash}`);
        
        // Refresh balances and contract state after successful transaction
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
        }, 3000);
      }
      
    } catch (error: unknown) {
      console.error("Buy YKP failed:", error);
      const err = error as { message?: string };
      alert(err.message || "Buy YKP failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sellYKP = async () => {
    if (!isConnected || !sellYkpAmount) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert YKP amount to wei (18 decimals) - handle large numbers safely
      const ykpAmountFloat = parseFloat(sellYkpAmount);
      if (isNaN(ykpAmountFloat) || ykpAmountFloat <= 0) {
        throw new Error("Invalid YKP amount");
      }

      // Check for extremely large numbers that could cause precision issues
      // Allow up to 1 billion tokens (reasonable for DeFi trading)
      const maxReasonableAmount = 1000000000; // 1 billion
      if (ykpAmountFloat > maxReasonableAmount) {
        throw new Error("Amount too large. Maximum allowed is 1,000,000,000 YKP tokens.");
      }

      // Use a safer method to handle large numbers without scientific notation
      const decimals = 18;
      // Use floor to avoid attempting to sell more than balance due to float rounding
      const ykpAmountWei = toWei(ykpAmountFloat, decimals);
      const ykpAmountHex = '0x' + ykpAmountWei.toString(16);
      
      // Call sell function on YKP contract
      const sellData = encodeFunctionCall('sell', [ykpAmountHex]);

      console.log("Selling YKP tokens...");
      console.log("YKP Amount (hex):", ykpAmountHex);
      console.log("Sell Data:", sellData);
      console.log("Expected sell data format:", getSelectorForSignature('sell(uint256)') + padNumber(ykpAmountHex));

      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, sellData);
      
      if (txHash) {
        setTxHash(txHash);
        alert(`Sell YKP transaction submitted! Transaction hash: ${txHash}`);
        
        // Refresh balances and contract state after successful transaction
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
        }, 3000);
      }
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Sell YKP failed");
    } finally {
      setIsLoading(false);
    }
  };

  const leveragePosition = async () => {
    if (!isConnected || !leverageLarryAmount || !leverageDays) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert LARRY amount to wei (18 decimals) - handle large numbers safely
      const larryAmountFloat = parseFloat(leverageLarryAmount);
      if (isNaN(larryAmountFloat) || larryAmountFloat <= 0) {
        throw new Error("Invalid LARRY amount");
      }

      // Check for extremely large numbers
      const maxReasonableAmount = 1000000000; // 1 billion
      if (larryAmountFloat > maxReasonableAmount) {
        throw new Error("Amount too large. Maximum allowed is 1,000,000,000 LARRY tokens.");
      }

      // Calculate the total fee required
      const totalFee = calculateLeverageFee(leverageLarryAmount, leverageDays);
      const totalFeeFloat = parseFloat(totalFee);
      const totalRequired = larryAmountFloat + totalFeeFloat;
      
      // Use a safer method to handle large numbers without scientific notation
      const decimals = 18;
      const larryAmountWei = toWei(larryAmountFloat, decimals);
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      const numberOfDaysHex = '0x' + parseInt(leverageDays).toString(16);
      
      // Step 1: Approve LARRY tokens for the YKP contract (including fees)
      const totalRequiredWei = toWei(totalRequired, decimals);
      const totalRequiredHex = '0x' + totalRequiredWei.toString(16);
      
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, totalRequiredHex]);

      console.log("Step 1: Approving LARRY tokens for leverage...");
      const approveTxHash = await executeTransaction(LARRY_TOKEN_ADDRESS, approveData);

      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }

      console.log("LARRY tokens approved! Hash:", approveTxHash);

      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Call leverage function on YKP contract
      const leverageData = encodeFunctionCall('leverage', [larryAmountHex, numberOfDaysHex]);

      console.log("Step 2: Creating leverage position...");
      console.log("LARRY Amount (hex):", larryAmountHex);
      console.log("Number of Days (hex):", numberOfDaysHex);
      console.log("Leverage Data:", leverageData);

      const leverageTxHash = await executeTransaction(YKP_TOKEN_ADDRESS, leverageData);
      
      if (leverageTxHash) {
        setTxHash(leverageTxHash);
        alert(`Leverage position created! Transaction hash: ${leverageTxHash}`);
        
        // Refresh balances and contract state after successful transaction
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
      
    } catch (error: unknown) {
      console.error("Leverage position failed:", error);
      const err = error as { message?: string };
      alert(err.message || "Leverage position failed");
    } finally {
      setIsLoading(false);
    }
  };

  const borrowLARRY = async () => {
    if (!isConnected || !borrowLarryAmount || !borrowDays) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert amounts to wei
      const larryAmountFloat = parseFloat(borrowLarryAmount);
      const collateralFloat = parseFloat(borrowCollateral);
      
      if (isNaN(larryAmountFloat) || larryAmountFloat <= 0) {
        throw new Error("Invalid LARRY amount");
      }
      
      if (isNaN(collateralFloat) || collateralFloat <= 0) {
        throw new Error("Invalid collateral amount");
      }

      const decimals = 18;
      const larryAmountWei = toWei(larryAmountFloat, decimals);
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      const numberOfDaysHex = '0x' + parseInt(borrowDays).toString(16);
      
      // Calculate required YKP collateral in wei
      const collateralWei = toWei(collateralFloat, decimals);
      const collateralHex = '0x' + collateralWei.toString(16);
      
      // Call borrow function on YKP contract (no approval needed for native YKP collateral)
      const borrowData = encodeFunctionCall('borrow', [larryAmountHex, numberOfDaysHex]);

      console.log("Creating borrow position...");
      console.log("LARRY Amount (hex):", larryAmountHex);
      console.log("Number of Days (hex):", numberOfDaysHex);
      console.log("Borrow Data:", borrowData);

      const borrowTxHash = await executeTransaction(YKP_TOKEN_ADDRESS, borrowData);
      
      if (borrowTxHash) {
        setTxHash(borrowTxHash);
        alert(`Borrow position created! Transaction hash: ${borrowTxHash}`);
        
        // Refresh balances and contract state after successful transaction
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
      
    } catch (error: unknown) {
      console.error("Borrow position failed:", error);
      const err = error as { message?: string };
      alert(err.message || "Borrow position failed");
    } finally {
      setIsLoading(false);
    }
  };

  const borrowMoreLARRY = async () => {
    if (!isConnected || !borrowMoreAmount) return;
    setIsLoading(true);
    setTxHash("");
    try {
      const amountFloat = parseFloat(borrowMoreAmount);
      if (isNaN(amountFloat) || amountFloat <= 0) throw new Error("Invalid LARRY amount");
      const decimals = 18;
      const amountWei = toWei(amountFloat, decimals);
      const amountHex = '0x' + amountWei.toString(16);
      const data = encodeFunctionCall('borrowMore', [amountHex]);
      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, data);
      if (txHash) {
        setTxHash(txHash);
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Borrow more failed");
    } finally {
      setIsLoading(false);
    }
  };

  const removeCollateral = async () => {
    if (!isConnected || !removeCollateralAmount) return;
    setIsLoading(true);
    setTxHash("");
    try {
      const amountFloat = parseFloat(removeCollateralAmount);
      if (isNaN(amountFloat) || amountFloat <= 0) throw new Error("Invalid amount");
      
      // Validation checks before transaction
      const currentCollateral = parseFloat(userLoan.collateral || '0');
      const borrowed = parseFloat(userLoan.borrowed || '0');
      
      if (amountFloat > currentCollateral) {
        throw new Error(`Cannot remove ${amountFloat} YKP. You only have ${currentCollateral} YKP as collateral.`);
      }
      
      // Check if loan is expired (basic client-side check)
      const currentTime = Date.now() / 1000;
      const loanEndTime = parseFloat(userLoan.endDate || '0');
      if (loanEndTime > 0 && currentTime > loanEndTime) {
        throw new Error("Your loan has expired and may have been liquidated. Cannot remove collateral.");
      }
      
      // Estimate if remaining collateral will maintain 99% collateralization
      const remainingCollateral = currentCollateral - amountFloat;
      if (contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0) {
        const remainingCollateralInLarry = (remainingCollateral * parseFloat(contractBacking)) / parseFloat(totalSupply);
        const requiredCollateral = borrowed / 0.99; // Need 99% collateralization
        
        if (remainingCollateralInLarry < requiredCollateral) {
          const maxRemovable = currentCollateral - (requiredCollateral * parseFloat(totalSupply)) / parseFloat(contractBacking);
          throw new Error(
            `Removing ${amountFloat} YKP would violate the 99% collateralization requirement. ` +
            `Maximum you can remove is approximately ${Math.max(0, maxRemovable).toFixed(4)} YKP.`
          );
        }
      }
      
      const decimals = 18;
      const amountWei = toWei(amountFloat, decimals);
      const amountHex = '0x' + amountWei.toString(16);
      const data = encodeFunctionCall('removeCollateral', [amountHex]);
      
      console.log("Removing collateral:", {
        amount: amountFloat,
        currentCollateral,
        borrowed,
        remainingAfterRemoval: currentCollateral - amountFloat
      });
      
      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, data);
      if (txHash) {
        setTxHash(txHash);
        alert(`Remove Collateral transaction submitted! Transaction hash: ${txHash}`);
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Remove collateral failed");
    } finally {
      setIsLoading(false);
    }
  };

  const repayLoan = async () => {
    if (!isConnected || !repayAmount) return;
    setIsLoading(true);
    setTxHash("");
    try {
      const amountFloat = parseFloat(repayAmount);
      if (isNaN(amountFloat) || amountFloat <= 0) throw new Error("Invalid amount");
      
      // IMPORTANT: Contract requires repay amount < borrowed amount (not equal!)
      const borrowedAmount = parseFloat(userLoan.borrowed || '0');
      
      // Check if trying to repay full amount (which will fail)
      if (amountFloat >= borrowedAmount) {
        throw new Error(
          `Cannot repay full loan amount (${borrowedAmount} LARRY). ` +
          `Contract requires repay amount to be LESS than borrowed. ` +
          `Use 'Close Position' or 'Flash Close' to fully close the loan.`
        );
      }
      
      // Use standard conversion for partial repayments
      const decimals = 18;
      const amountWei = toWei(amountFloat, decimals);
      const amountHex = '0x' + amountWei.toString(16);
      
      console.log("Partial repayment:", amountFloat, "-> Wei:", amountWei.toString());
      
      // Step 1: Approve LARRY tokens for the YKP contract
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, amountHex]);
      console.log("Step 1: Approving LARRY tokens for repayment...");
      const approveTxHash = await executeTransaction(LARRY_TOKEN_ADDRESS, approveData);
      
      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }
      
      console.log("LARRY tokens approved! Hash:", approveTxHash);
      
      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Call repay function on YKP contract
      const data = encodeFunctionCall('repay', [amountHex]);
      console.log("Step 2: Repaying loan...");
      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, data);
      if (txHash) {
        setTxHash(txHash);
        alert(`Repay transaction submitted! Transaction hash: ${txHash}`);
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Repay failed");
    } finally {
      setIsLoading(false);
    }
  };

  const extendLoan = async () => {
    if (!isConnected || !extendDays) return;
    if (!window.ethereum) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const account = accounts[0];
      
      // Convert days to uint256 parameter
      const daysToExtend = parseInt(extendDays);
      const daysParam = '0x' + daysToExtend.toString(16).padStart(64, '0');
      
      // Function selector for extendLoan(uint256)
      const functionSelector = '0x7ace2ac9';
      const data = functionSelector + daysParam.slice(2);
      
      console.log(`Extending loan by ${daysToExtend} days`);
      console.log('Transaction data:', data);
      
      const txParams = {
        from: account,
        to: YKP_TOKEN_ADDRESS,
        data: data,
        gasLimit: '0x7A120', // 500,000 gas limit
      };
      
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      }) as string;
      
      setTxHash(hash);
      console.log('Extend loan transaction sent:', hash);
      alert(`Loan extension submitted! Transaction hash: ${hash}`);
      
      // Refresh data after delay
      setTimeout(() => {
        fetchBalances(account);
        fetchContractState();
        fetchUserLoan(account);
      }, 3000);
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Extend loan failed");
    } finally {
      setIsLoading(false);
    }
  };

  const closePosition = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setTxHash("");
    try {
      // For closePosition, we need to approve LARRY equal to the exact borrowed amount
      const borrowedAmount = parseFloat(userLoan.borrowed || '0');
      if (borrowedAmount <= 0) {
        throw new Error("No loan to close");
      }
      
      // Use exact borrowed amount to avoid precision issues
      const exactBorrowedStr = userLoan.borrowed || '0';
      const parts = exactBorrowedStr.split('.');
      const integerPart = parts[0] || '0';
      const decimalPart = (parts[1] || '').padEnd(18, '0').slice(0, 18);
      const borrowedWei = BigInt(integerPart) * BigInt(10 ** 18) + BigInt(decimalPart);
      const borrowedHex = '0x' + borrowedWei.toString(16);
      
      console.log("Close position - exact borrowed amount:", exactBorrowedStr, "-> Wei:", borrowedWei.toString());
      
      // Step 1: Approve LARRY tokens for the YKP contract (borrowed amount)
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, borrowedHex]);
      console.log("Step 1: Approving LARRY tokens for position closure...");
      const approveTxHash = await executeTransaction(LARRY_TOKEN_ADDRESS, approveData);
      
      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }
      
      console.log("LARRY tokens approved! Hash:", approveTxHash);
      
      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Call closePosition function on YKP contract
      const data = encodeFunctionCall('closePosition', []);
      console.log("Step 2: Closing position...");
      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, data);
      if (txHash) {
        setTxHash(txHash);
        alert(`Close Position transaction submitted! Transaction hash: ${txHash}`);
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Close position failed");
    } finally {
      setIsLoading(false);
    }
  };

  const flashClosePosition = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setTxHash("");
    try {
      // Flash close typically doesn't need approval since it uses flash loans,
      // but let's add a safety check and approval just in case
      const borrowedAmount = parseFloat(userLoan.borrowed || '0');
      if (borrowedAmount <= 0) {
        throw new Error("No loan to close");
      }
      
      // Use exact borrowed amount to avoid precision issues
      const exactBorrowedStr = userLoan.borrowed || '0';
      const parts = exactBorrowedStr.split('.');
      const integerPart = parts[0] || '0';
      const decimalPart = (parts[1] || '').padEnd(18, '0').slice(0, 18);
      const borrowedWei = BigInt(integerPart) * BigInt(10 ** 18) + BigInt(decimalPart);
      const borrowedHex = '0x' + borrowedWei.toString(16);
      
      console.log("Flash close - exact borrowed amount:", exactBorrowedStr, "-> Wei:", borrowedWei.toString());
      
      // Step 1: Approve LARRY tokens for the YKP contract (as backup)
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, borrowedHex]);
      console.log("Step 1: Approving LARRY tokens for flash close...");
      const approveTxHash = await executeTransaction(LARRY_TOKEN_ADDRESS, approveData);
      
      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }
      
      console.log("LARRY tokens approved! Hash:", approveTxHash);
      
      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Call flashClosePosition function on YKP contract
      const data = encodeFunctionCall('flashClosePosition', []);
      console.log("Step 2: Flash closing position...");
      const txHash = await executeTransaction(YKP_TOKEN_ADDRESS, data);
      if (txHash) {
        setTxHash(txHash);
        alert(`Flash Close Position transaction submitted! Transaction hash: ${txHash}`);
        setTimeout(() => {
          fetchBalances(account);
          fetchContractState();
          fetchUserLoan(account);
        }, 3000);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(err.message || "Flash close position failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Flash close removed
  
  // Calculate DEX prices
  const getDexPrices = () => {
    if (!contractBacking || !totalSupply || parseFloat(contractBacking) === 0 || parseFloat(totalSupply) === 0) {
      return { larryPrice: 0, ykpPrice: 0 };
    }
    
    const backing = parseFloat(contractBacking);
    const supply = parseFloat(totalSupply);
    
    // YKP price in LARRY terms
    const ykpInLarry = backing / supply;
    
    // For comparison, assume LARRY base price (you can adjust this)
    const larryBasePrice = 1; // or fetch from another source
    
    return {
      larryPrice: larryBasePrice,
      ykpPrice: ykpInLarry * larryBasePrice
    };
  };

  // Fetch OpenOcean prices on component mount and every 30 seconds
  useEffect(() => {
    fetchOpenOceanPrices();
    const interval = setInterval(fetchOpenOceanPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Max button functions
  const setMaxLarry = () => {
    // Use the same precision as displayed in the balance (2 decimal places, rounded down)
    const balance = parseFloat(larryBalance || '0');
    // Round down to 2 decimals to ensure we never try to buy more than what's shown
    const roundedBalance = Math.floor(balance * 100) / 100;
    setBuyLarryAmount(roundedBalance.toFixed(2));
  };

  const setMaxYkp = () => {
    // Use the same precision as displayed in the balance (2 decimal places, rounded down)
    const balance = parseFloat(ykpBalance || '0');
    // Round down to 2 decimals to ensure we never try to sell more than what's shown
    const roundedBalance = Math.floor(balance * 100) / 100;
    setSellYkpAmount(roundedBalance.toFixed(2));
  };

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 640px) {
          .mobile-responsive-input {
            font-size: 16px;
          }
        }
      `}</style>
      <div className={`${geistSans.className} ${inter.variable} min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100`}>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-yellow-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between min-w-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-lg sm:text-2xl">🥧</span>
              </div>
              <div className="min-w-0 flex-shrink">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">YAKA PIE</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">DeFi Trading Platform</p>
              </div>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="text-gray-700 hover:text-yellow-600 transition-colors hidden sm:block">Home</Link>
              <a 
                href="https://discord.gg/8HSJQUCujU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:flex items-center gap-1 text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </a>
              <a 
                href="https://x.com/Yakapie_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-1 text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @Yakapie_
              </a>
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
                    <span className="hidden sm:inline">{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <span className="sm:hidden">{account.slice(0, 4)}...{account.slice(-2)}</span>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-12">


        {/* Price Comparison Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">💹 Price Comparison: Our DEX vs OpenOcean</h3>
            <div className="text-sm text-gray-500">
              Updated {openOceanPrices.lastUpdated ? new Date(openOceanPrices.lastUpdated).toLocaleTimeString() : 'Never'}
            </div>
          </div>

          {/* Price Comparison Table */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-gray-700 mb-3">
              <div className="col-span-2 sm:col-span-1">Trading Pair</div>
              <div className="text-center sm:block hidden">YAKA PIE Rate</div>
              <div className="text-center sm:block hidden">OpenOcean Rate</div>
              <div className="text-center">Difference</div>
            </div>
            <div className="space-y-3">
              {/* LARRY → YKP */}
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-gray-800 text-sm sm:text-base">💰 LARRY → YKP</div>
                  <div className="text-center">
                    <span className={`font-bold px-2 py-1 rounded text-xs sm:text-sm ${
                      (contractBacking && totalSupply && parseFloat(totalSupply) > 0 
                        ? parseFloat(totalSupply) / parseFloat(contractBacking)
                        : 0) > openOceanPrices.larryToYkpRate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {openOceanPrices.larryToYkpRate > 0 && contractBacking && totalSupply && parseFloat(totalSupply) > 0 
                        ? (((parseFloat(totalSupply) / parseFloat(contractBacking)) - openOceanPrices.larryToYkpRate) / openOceanPrices.larryToYkpRate * 100).toFixed(2) 
                        : '0.00'}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">YAKA PIE</div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono">
                      {contractBacking && totalSupply && parseFloat(totalSupply) > 0 
                        ? (parseFloat(totalSupply) / parseFloat(contractBacking)).toFixed(4)
                        : '0.0000'}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">OpenOcean</div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                      {openOceanPrices.larryToYkpRate.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* YKP → LARRY */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-gray-800 text-sm sm:text-base">🥧 YKP → LARRY</div>
                  <div className="text-center">
                    <span className={`font-bold px-2 py-1 rounded text-xs sm:text-sm ${
                      (contractBacking && totalSupply && parseFloat(contractBacking) > 0 
                        ? parseFloat(contractBacking) / parseFloat(totalSupply)
                        : 0) > openOceanPrices.ykpToLarryRate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {openOceanPrices.ykpToLarryRate > 0 && contractBacking && totalSupply && parseFloat(contractBacking) > 0 
                        ? (((parseFloat(contractBacking) / parseFloat(totalSupply)) - openOceanPrices.ykpToLarryRate) / openOceanPrices.ykpToLarryRate * 100).toFixed(2) 
                        : '0.00'}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">YAKA PIE</div>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono">
                      {contractBacking && totalSupply && parseFloat(contractBacking) > 0 
                        ? (parseFloat(contractBacking) / parseFloat(totalSupply)).toFixed(4)
                        : '0.0000'}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">OpenOcean</div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                      {openOceanPrices.ykpToLarryRate.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {openOceanPrices.error && (
            <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg text-sm">
              <div className="font-semibold text-orange-800 mb-1">⚠️ OpenOcean Data Unavailable</div>
              <div className="text-orange-700">{openOceanPrices.error}</div>
              <div className="text-orange-600 mt-1">This may indicate no liquidity for LARRY/YKP pair on external DEXs, or SEI chain not supported.</div>
            </div>
          )}
          {/* Real Arbitrage Analysis */}
          {openOceanPrices.larryToYkpRate > 0 && openOceanPrices.ykpToLarryRate > 0 && contractBacking && totalSupply && (
            <>
              {(() => {
                const ourLarryToYkpRate = parseFloat(totalSupply) / parseFloat(contractBacking);
                const ourYkpToLarryRate = parseFloat(contractBacking) / parseFloat(totalSupply);
                const openOceanLarryToYkpRate = openOceanPrices.larryToYkpRate;
                const openOceanYkpToLarryRate = openOceanPrices.ykpToLarryRate;

                // Test REAL arbitrage cycles using real contract data
                // Use real arbitrage data from getBuyTokens contract call
                const realYkpFromOneLarry = realArbitrageData 
                  ? realArbitrageData.realYkpFromOneLarry 
                  : parseFloat(totalSupply) / parseFloat(contractBacking); // fallback to theoretical
                
                // Use real contract data when available  
                const yakaLarryToYkp = realYkpFromOneLarry; // Real contract rate from getBuyTokens
                const openOceanLarryToYkp = openOceanLarryToYkpRate; // OpenOcean rate
                
                // Cycle 1: Start with 1 LARRY → YKP (best platform) → LARRY (best platform)
                // Step 1: Determine best platform for LARRY → YKP
                console.log("🔍 Arbitrage Rate Comparison:");
                console.log("  YAKA PIE LARRY→YKP rate:", yakaLarryToYkp);
                console.log("  OpenOcean LARRY→YKP rate:", openOceanLarryToYkp);
                console.log("  Real arbitrage data:", realArbitrageData);
                
                const bestLarryToYkpPlatform = yakaLarryToYkp > openOceanLarryToYkp ? 'YAKA PIE' : 'OpenOcean';
                const bestLarryToYkpRate = Math.max(yakaLarryToYkp, openOceanLarryToYkp);
                const step1_ykpAmount = bestLarryToYkpRate; // YKP received from 1 LARRY
                
                // Step 2: Determine best platform for YKP → LARRY using the YKP amount from step 1
                // Use real sell data when available
                const yakaYkpToLarryRate = realArbitrageData 
                  ? realArbitrageData.realLarryFromYkp 
                  : parseFloat(contractBacking) / parseFloat(totalSupply); // fallback to theoretical
                
                console.log("  YAKA PIE YKP→LARRY rate:", yakaYkpToLarryRate);
                console.log("  OpenOcean YKP→LARRY rate:", openOceanYkpToLarryRate);
                
                const bestYkpToLarryPlatform = yakaYkpToLarryRate > openOceanYkpToLarryRate ? 'YAKA PIE' : 'OpenOcean';
                const bestYkpToLarryRate = Math.max(yakaYkpToLarryRate, openOceanYkpToLarryRate);
                const step2_larryAmount = step1_ykpAmount * bestYkpToLarryRate; // Final LARRY amount
                
                console.log("🎯 Selected platforms:", { step1: bestLarryToYkpPlatform, step2: bestYkpToLarryPlatform });
                
                const cycle1_profit = ((step2_larryAmount - 1) / 1) * 100; // Profit from 1 LARRY

                // Check all possible cross-platform arbitrage combinations
                // Combination 1: YAKA PIE → OpenOcean  
                const combo1_ykp = yakaLarryToYkp; // Buy YKP on YAKA PIE
                const combo1_larry = combo1_ykp * openOceanYkpToLarryRate; // Sell YKP on OpenOcean
                const combo1_profit = ((combo1_larry - 1) / 1) * 100;
                
                // Combination 2: OpenOcean → YAKA PIE
                const combo2_ykp = openOceanLarryToYkp; // Buy YKP on OpenOcean  
                const combo2_larry = combo2_ykp * yakaYkpToLarryRate; // Sell YKP on YAKA PIE
                const combo2_profit = ((combo2_larry - 1) / 1) * 100;
                
                console.log("📊 Cross-platform combinations:");
                console.log("  Combo1 (YAKA→OpenOcean): YKP=" + combo1_ykp + ", LARRY=" + combo1_larry + ", Profit=" + combo1_profit.toFixed(2) + "%");
                console.log("  Combo2 (OpenOcean→YAKA): YKP=" + combo2_ykp + ", LARRY=" + combo2_larry + ", Profit=" + combo2_profit.toFixed(2) + "%");
                
                // Always use cross-platform arbitrage (never same platform)
                // Pick the most profitable cross-platform combination
                const bestCombo = combo1_profit >= combo2_profit ? 
                  { profit: combo1_profit, ykp: combo1_ykp, larry: combo1_larry, buyPlatform: 'YAKA PIE', sellPlatform: 'OpenOcean' } :
                  { profit: combo2_profit, ykp: combo2_ykp, larry: combo2_larry, buyPlatform: 'OpenOcean', sellPlatform: 'YAKA PIE' };
                
                console.log("🔄 Cross-platform arbitrage analysis:");
                console.log("  YAKA PIE → OpenOcean:", combo1_profit.toFixed(2) + "%");
                console.log("  OpenOcean → YAKA PIE:", combo2_profit.toFixed(2) + "%");
                
                const hasRealArbitrage = bestCombo.profit > 1; // 1% threshold

                if (hasRealArbitrage) {
                  return (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl">
                      <div className="font-bold text-green-800 mb-3 flex items-center gap-2">
                        💰 LARRY ARBITRAGE OPPORTUNITY 💰
                      </div>
                      
                      {/* Always show LARRY-based arbitrage */}
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="font-semibold text-gray-800 mb-3">
                          🔄 Start with LARRY → End with More LARRY
                        </div>
                        <div className="text-sm space-y-3">
                          <div className="font-medium text-blue-800 bg-blue-50 px-3 py-2 rounded">
                            <div className="font-bold mb-1">Complete Arbitrage Cycle:</div>
                            <div>1. Start: 1 LARRY</div>
                            <div>2. Convert: 1 LARRY → {bestCombo.ykp.toFixed(6)} YKP (on {bestCombo.buyPlatform}) ✅</div>
                            <div>3. Convert: {bestCombo.ykp.toFixed(6)} YKP → {bestCombo.larry.toFixed(6)} LARRY (on {bestCombo.sellPlatform}) ✅</div>
                            <div className="font-bold text-green-700">4. End Result: {bestCombo.larry.toFixed(6)} LARRY</div>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <div className="font-bold text-green-700 text-lg">
                              💰 LARRY Profit: {bestCombo.profit.toFixed(2)}% per cycle
                            </div>
                            <div className="text-green-600 mt-1">
                              For every 100 LARRY you start with → You end with {(100 * bestCombo.larry).toFixed(2)} LARRY
                            </div>
                            <div className="text-green-600 font-medium">
                              = {((100 * bestCombo.larry) - 100).toFixed(2)} LARRY profit 🎯
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ Arbitrage requires gas fees for each transaction and timing. Actual profit may be lower after costs.
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                      <div className="font-semibold text-gray-700 mb-1">📊 No Arbitrage Opportunities</div>
                      <div className="text-gray-600">
                        No profitable cross-platform arbitrage opportunities found. Current price differences between YAKA PIE and OpenOcean don't create profitable cycles after accounting for fees and slippage.
                        <div className="mt-2 text-xs">
                          <div>YAKA PIE → OpenOcean: {combo1_profit.toFixed(2)}% profit</div>
                          <div>OpenOcean → YAKA PIE: {combo2_profit.toFixed(2)}% profit</div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </>
          )}
        </div>

        {/* Trading Interface */}
        <div className="bg-white rounded-3xl shadow-2xl border border-yellow-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {(() => {
                // Check if user has an existing loan
                const hasExistingLoan = userLoan && userLoan.borrowed && parseFloat(userLoan.borrowed) > 0;
                
                const allTabs = [
                  { id: "buy", label: "Buy YKP", icon: "🛒" },
                  { id: "sell", label: "Sell YKP", icon: "💰" },
                  // Only show leverage and borrow if NO existing loan
                  ...(!hasExistingLoan ? [
                    { id: "leverage", label: "Leverage", icon: "🚀" },
                    { id: "borrow", label: "Borrow", icon: "🏦" },
                  ] : []),
                  // Only show borrow more if HAS existing loan  
                  ...(hasExistingLoan ? [
                    { id: "borrow-more", label: "Borrow More", icon: "📈" },
                  ] : []),
                  // Always show manage position if has loan
                  ...(hasExistingLoan ? [
                    { id: "manage", label: "Manage Position", icon: "⚙️" },
                  ] : []),
                ];
                
                return allTabs;
              })().map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap transition-all duration-300 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? "bg-yellow-500 text-white border-b-2 border-yellow-600"
                      : "text-gray-600 hover:text-yellow-600 hover:bg-yellow-50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {!isConnected ? (
              <div className="text-center py-6 sm:py-12 px-4">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🔗</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Connect Your Wallet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">Connect your MetaMask or Web3 wallet to start trading on YAKA PIE</p>
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto max-w-xs mx-auto block"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {/* Buy Tab */}
                {activeTab === "buy" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Buy YKP Tokens</h2>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                        <label className="block text-sm font-semibold text-gray-700">
                          LARRY Amount to Spend
                        </label>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          Balance: {parseFloat(larryBalance || '0').toLocaleString(undefined, {maximumFractionDigits: 2})} LARRY
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={buyLarryAmount}
                          onChange={(e) => setBuyLarryAmount(e.target.value)}
                          placeholder="Enter LARRY amount"
                          className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                        />
                        <button
                          onClick={setMaxLarry}
                          className="absolute right-14 sm:right-16 top-3 bg-yellow-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-yellow-600 transition-colors"
                        >
                          MAX
                        </button>
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        YKP Tokens You&apos;ll Receive
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={buyYkpAmount}
                          readOnly
                          placeholder="0.0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900 mobile-responsive-input"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">YKP</div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Transaction Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>LARRY Amount:</span>
                          <span>{buyLarryAmount || "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buy Fee ({((1000 - parseFloat(buyFee)) / 10).toFixed(1)}%):</span>
                          <span>{buyLarryAmount ? (parseFloat(buyLarryAmount) * (1000 - parseFloat(buyFee)) / 1000).toFixed(4) : "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>You Receive:</span>
                          <span>{buyYkpAmount || "0"} YKP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contract Backing:</span>
                          <span className={contractBacking === "0" ? "text-orange-600" : "text-green-600"}>
                            {contractBacking === "0" ? "Loading/Not Available" : `${contractBacking} LARRY`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Supply:</span>
                          <span className={totalSupply === "0" ? "text-orange-600" : "text-green-600"}>
                            {totalSupply === "0" ? "Loading/Not Available" : `${totalSupply} YKP`}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Calculation Method:</span>
                          <span className={buyYkpAmount && parseFloat(buyYkpAmount) > 0 && contractBacking !== "0" ? "text-green-600" : "text-blue-600"}>
                            {buyYkpAmount && parseFloat(buyYkpAmount) > 0 && contractBacking !== "0" ? "Live Contract Data" : "Fallback Formula"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Leverage Information */}
                    {userLoan && parseFloat(userLoan.borrowed) > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <h4 className="font-semibold text-gray-900 mb-2">🚀 Your Active Leverage Position</h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <div className="flex justify-between">
                            <span>Collateral:</span>
                            <span>{userLoan.collateral} YKP</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Borrowed:</span>
                            <span>{userLoan.borrowed} LARRY</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan Duration:</span>
                            <span>{userLoan.numberOfDays} days</span>
                          </div>
                          <div className="flex justify-between font-semibold text-purple-700">
                            <span>End Date:</span>
                            <span>{userLoan.endDate !== "0" ? new Date(parseInt(userLoan.endDate) * 1000).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                          💡 You can manage your leverage position in the &quot;Leverage&quot; and &quot;Manage Position&quot; tabs
                        </div>
                      </div>
                    )}

                    {/* Leverage Opportunity */}
                    {buyLarryAmount && parseFloat(buyLarryAmount) > 0 && parseFloat(userLoan.borrowed) === 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <h4 className="font-semibold text-gray-900 mb-2">💪 Leverage Opportunity</h4>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>Consider using leverage to amplify your position!</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Leverage Fee (30 days):</span>
                              <div className="text-purple-700 font-semibold">
                                {calculateLeverageFee(buyLarryAmount, "30")} LARRY
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Potential Multiplier:</span>
                              <div className="text-green-600 font-semibold">~2x-5x</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setLeverageLarryAmount(buyLarryAmount);
                              setActiveTab("leverage");
                            }}
                            className="mt-2 w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                          >
                            🚀 Switch to Leverage Tab
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={buyYKP}
                      disabled={!buyLarryAmount || isLoading}
                      className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>🛒</span>
                          Buy YKP Tokens
                          <span>🥧</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Sell Tab */}
                {activeTab === "sell" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Sell YKP Tokens</h2>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                        <label className="block text-sm font-semibold text-gray-700">
                          YKP Amount to Sell
                        </label>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          Balance: {parseFloat(ykpBalance || '0').toLocaleString(undefined, {maximumFractionDigits: 2})} YKP
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={sellYkpAmount}
                          onChange={(e) => setSellYkpAmount(e.target.value)}
                          placeholder="Enter YKP amount"
                          className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                        />
                        <button
                          onClick={setMaxYkp}
                          className="absolute right-12 sm:right-16 top-3 bg-yellow-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-yellow-600 transition-colors"
                        >
                          MAX
                        </button>
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">YKP</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LARRY You&apos;ll Receive
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={sellLarryAmount}
                          readOnly
                          placeholder="0.0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900 mobile-responsive-input"
                        />
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Transaction Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>YKP Amount:</span>
                          <span>{sellYkpAmount || "0"} YKP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sell Fee ({((1000 - parseFloat(sellFee)) / 10).toFixed(1)}%):</span>
                          <span>{sellYkpAmount ? (parseFloat(sellYkpAmount) * (1000 - parseFloat(sellFee)) / 1000).toFixed(4) : "0"} YKP</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>You Receive:</span>
                          <span>{sellLarryAmount || "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contract Backing:</span>
                          <span>{contractBacking || "Loading..."} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Supply:</span>
                          <span>{totalSupply || "Loading..."} YKP</span>
                        </div>
                      </div>
                    </div>

                    {/* Time-based loan; leverage warning removed */}

                    <button
                      onClick={sellYKP}
                      disabled={!sellYkpAmount || isLoading}
                      className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>💰</span>
                          Sell YKP Tokens
                          <span>📈</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Leverage Tab */}
                {activeTab === "leverage" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Leverage Position</h2>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LARRY Amount to Borrow
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={leverageLarryAmount}
                          onChange={(e) => setLeverageLarryAmount(e.target.value)}
                          placeholder="Enter LARRY amount"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                        />
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Duration: <span className="text-purple-600 font-bold">{leverageDays} Days</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="365"
                        step="1"
                        value={leverageDays}
                        onChange={(e) => setLeverageDays(e.target.value)}
                        className="w-full accent-purple-500 h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span className="hidden sm:inline">90</span>
                        <span className="hidden sm:inline">180</span>
                        <span className="hidden sm:inline">270</span>
                        <span>365</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Fee
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={leverageFee}
                          readOnly
                          placeholder="0.0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900 mobile-responsive-input"
                        />
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Leverage Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Borrow Amount:</span>
                          <span>{leverageLarryAmount || "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{leverageDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leverage Fee Rate:</span>
                          <span>{(parseFloat(leverageFeeRate) / 10).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interest Rate:</span>
                          <span>3.9% APY + 0.1%/day</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total Fee:</span>
                          <span>{leverageFee || "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>YKP Tokens Minted:</span>
                          <span>{leverageLarryAmount ? calculateTokensFromLarry((parseFloat(leverageLarryAmount) - parseFloat(leverageFee || "0")).toString()) : "0"} YKP</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Position Info */}
                    {userLoan && parseFloat(userLoan.borrowed) > 0 && (
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <h4 className="font-semibold text-gray-900 mb-2">⚠️ Existing Position</h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>You already have an active leverage position:</p>
                          <div className="flex justify-between">
                            <span>Collateral:</span>
                            <span>{userLoan.collateral} YKP</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Borrowed:</span>
                            <span>{userLoan.borrowed} LARRY</span>
                          </div>
                          <div className="text-orange-600 text-xs mt-2">
                            💡 Close your current position before creating a new leverage position
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={leveragePosition}
                      disabled={!leverageLarryAmount || !leverageDays || isLoading}
                      className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>🚀</span>
                          Create Leverage Position
                          <span>💪</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Borrow Tab */}
                {activeTab === "borrow" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Borrow LARRY</h2>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                        <label className="block text-sm font-semibold text-gray-700">
                          LARRY Amount to Borrow
                        </label>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          YKP Balance: {ykpBalance} YKP
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={borrowLarryAmount}
                          onChange={(e) => setBorrowLarryAmount(e.target.value)}
                          placeholder="Enter LARRY amount"
                          className="w-full px-4 py-3 pr-20 sm:pr-24 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                        />
                        <button
                          onClick={() => {
                            // Calculate maximum LARRY that can be borrowed based on YKP balance
                            const ykpBalanceFloat = parseFloat(ykpBalance || '0');
                            if (ykpBalanceFloat > 0 && contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0) {
                              // Calculate YKP value in LARRY terms
                              const ykpValueInLarry = (ykpBalanceFloat * parseFloat(contractBacking)) / parseFloat(totalSupply);
                              // Max borrowable is 99% of collateral value (contract allows this)
                              const maxBorrowable = ykpValueInLarry * 0.99; // 99% as per contract requirement
                              setBorrowLarryAmount(maxBorrowable.toFixed(2));
                            } else {
                              // Fallback: if no contract data, assume 1:1 ratio and use 99%
                              const maxBorrowable = ykpBalanceFloat * 0.99; 
                              setBorrowLarryAmount(maxBorrowable.toFixed(2));
                            }
                          }}
                          className="absolute right-14 sm:right-16 top-3 bg-green-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          MAX
                        </button>
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                      
                      {/* Borrowing Capacity Info */}
                      {ykpBalance && parseFloat(ykpBalance) > 0 && contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 text-xs sm:text-sm mt-3">
                          <div className="font-semibold text-blue-800 mb-2">💡 Borrowing Capacity</div>
                          {(() => {
                            const ykpBalanceFloat = parseFloat(ykpBalance);
                            const ykpValueInLarry = (ykpBalanceFloat * parseFloat(contractBacking)) / parseFloat(totalSupply);
                            const maxBorrowable = ykpValueInLarry * 0.99; // 99% as per contract
                            const currentBorrowAmount = parseFloat(borrowLarryAmount || '0');
                            const utilizationRatio = maxBorrowable > 0 ? (currentBorrowAmount / maxBorrowable) * 100 : 0;
                            
                            return (
                              <div className="space-y-1 text-blue-700">
                                <div>YKP Collateral Value: <span className="font-semibold">{ykpValueInLarry.toFixed(4)} LARRY</span></div>
                                <div>Max Borrowable (99%): <span className="font-semibold text-green-600">{maxBorrowable.toFixed(4)} LARRY</span></div>
                                <div>Current Utilization: <span className={`font-semibold ${utilizationRatio > 90 ? 'text-red-600' : utilizationRatio > 70 ? 'text-yellow-600' : 'text-green-600'}`}>{utilizationRatio.toFixed(1)}%</span></div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Duration: <span className="text-blue-600 font-bold">{borrowDays} Days</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="365"
                        step="1"
                        value={borrowDays}
                        onChange={(e) => setBorrowDays(e.target.value)}
                        className="w-full accent-yellow-500 h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span className="hidden sm:inline">90</span>
                        <span className="hidden sm:inline">180</span>
                        <span className="hidden sm:inline">270</span>
                        <span>365</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        YKP Collateral Required
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={borrowCollateral}
                          readOnly
                          placeholder="0.0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">YKP</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Borrow Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Borrow Amount:</span>
                          <span>{borrowLarryAmount || "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{borrowDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collateral Ratio:</span>
                          <span>99% (Over-collateralized)</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>YKP Required:</span>
                          <span>{borrowCollateral || "0"} YKP</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={borrowLARRY}
                      disabled={!borrowLarryAmount || !borrowDays || isLoading}
                      className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>🏦</span>
                          Borrow LARRY
                          <span>💳</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Borrow More Tab */}
                {activeTab === "borrow-more" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Borrow More LARRY</h2>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Additional LARRY Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={borrowMoreAmount}
                          onChange={(e) => setBorrowMoreAmount(e.target.value)}
                          placeholder="Enter additional LARRY amount"
                          className="w-full px-4 py-3 pr-20 sm:pr-24 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                        />
                        <button
                          onClick={() => {
                            // Calculate maximum borrowable based on wallet + existing collateral
                            // Following contract logic: total collateral (existing + wallet) * 0.99 - current borrowed
                            console.log('=== BORROW MORE MAX CALCULATION ===');
                            
                            const currentCollateral = parseFloat(userLoan.collateral || '0');
                            const currentBorrowed = parseFloat(userLoan.borrowed || '0'); 
                            // Use rounded down wallet balance to match display precision
                            const walletBalanceRaw = parseFloat(ykpBalance || '0');
                            const walletBalance = Math.floor(walletBalanceRaw * 100) / 100;
                            
                            console.log('currentCollateral:', currentCollateral);
                            console.log('currentBorrowed:', currentBorrowed);
                            console.log('walletBalance:', walletBalance);
                            
                            if (contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0) {
                              // Total possible collateral = existing + wallet
                              const totalPossibleCollateral = currentCollateral + walletBalance;
                              
                              // Calculate total collateral value in LARRY
                              const totalCollateralValueInLarry = (totalPossibleCollateral * parseFloat(contractBacking)) / parseFloat(totalSupply);
                              
                              // Max total borrowable is 99% of total possible collateral
                              const maxTotalBorrowable = totalCollateralValueInLarry * 0.99;
                              
                              // Max additional = max total - current borrowed
                              const maxAdditionalBorrowable = Math.max(0, maxTotalBorrowable - currentBorrowed);
                              
                              console.log('totalPossibleCollateral:', totalPossibleCollateral);
                              console.log('totalCollateralValueInLarry:', totalCollateralValueInLarry);
                              console.log('maxTotalBorrowable:', maxTotalBorrowable);
                              console.log('maxAdditionalBorrowable:', maxAdditionalBorrowable);
                              
                              setBorrowMoreAmount(maxAdditionalBorrowable.toFixed(2));
                            } else {
                              // Fallback: assume 1:1 ratio
                              const totalPossibleCollateral = currentCollateral + walletBalance;
                              const maxTotalBorrowable = totalPossibleCollateral * 0.99;
                              const maxAdditionalBorrowable = Math.max(0, maxTotalBorrowable - currentBorrowed);
                              
                              console.log('Fallback - totalPossibleCollateral:', totalPossibleCollateral);
                              console.log('Fallback - maxAdditionalBorrowable:', maxAdditionalBorrowable);
                              
                              setBorrowMoreAmount(maxAdditionalBorrowable.toFixed(2));
                            }
                            console.log('=== END MAX CALCULATION ===');
                          }}
                          className="absolute right-14 sm:right-16 top-3 bg-green-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          MAX
                        </button>
                        <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Borrow More Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Additional Amount:</span>
                          <span>{borrowMoreAmount || "0"} LARRY</span>
                        </div>
                        <div className="text-green-600 text-sm mt-2">
                          💡 Smart function: Uses existing excess collateral when possible, adds new YKP from your wallet only when needed
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={borrowMoreLARRY}
                      disabled={!borrowMoreAmount || isLoading}
                      className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>📈</span>
                          Borrow More LARRY
                          <span>💰</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Manage Position Tab */}
                {activeTab === "manage" && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Manage Your Position</h2>

                    {/* Current Loan Summary */}
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Current Loan</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                        <div className="flex justify-between"><span>Collateral</span><span>{userLoan.collateral} YKP</span></div>
                        <div className="flex justify-between"><span>Borrowed</span><span>{userLoan.borrowed} LARRY</span></div>
                        <div className="flex justify-between"><span>Duration</span><span>{userLoan.numberOfDays} days</span></div>
                        <div className="flex justify-between"><span>End Date</span><span>{userLoan.endDate !== "0" ? new Date(parseInt(userLoan.endDate) * 1000).toLocaleDateString() : "N/A"}</span></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Remove Collateral</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                              <label className="block text-sm font-semibold text-gray-700">
                                YKP Amount to Remove
                              </label>
                              <div className="text-xs sm:text-sm text-gray-600 truncate">
                                Available: {userLoan.collateral} YKP
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={removeCollateralAmount}
                                onChange={(e) => setRemoveCollateralAmount(e.target.value)}
                                placeholder="Enter YKP amount"
                                className="w-full px-4 py-3 pr-16 sm:pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input"
                              />
                              <button
                                onClick={() => {
                                  // Calculate safe maximum amount that maintains 99% collateralization
                                  const currentCollateral = parseFloat(userLoan.collateral || '0');
                                  const borrowed = parseFloat(userLoan.borrowed || '0');
                                  
                                  if (contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0 && borrowed > 0) {
                                    const requiredCollateralInLarry = borrowed / 0.99; // Need 99% collateralization
                                    const requiredCollateralInYkp = (requiredCollateralInLarry * parseFloat(totalSupply)) / parseFloat(contractBacking);
                                    const safeMaxRemovable = Math.max(0, currentCollateral - requiredCollateralInYkp - 0.001); // Small buffer
                                    setRemoveCollateralAmount(safeMaxRemovable.toFixed(2));
                                  } else {
                                    // Fallback: leave small buffer
                                    const safeAmount = Math.max(0, currentCollateral * 0.1); // Only allow 10% as safe fallback
                                    setRemoveCollateralAmount(safeAmount.toFixed(2));
                                  }
                                }}
                                className="absolute right-14 sm:right-16 top-3 bg-green-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                              >
                                SAFE
                              </button>
                              <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">YKP</div>
                            </div>
                          </div>
                          
                          {/* Collateralization Info */}
                          {userLoan.collateral && userLoan.borrowed && parseFloat(userLoan.borrowed) > 0 && contractBacking && totalSupply && parseFloat(contractBacking) > 0 && parseFloat(totalSupply) > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 text-xs sm:text-sm">
                              <div className="font-semibold text-blue-800 mb-2">💡 Collateralization Status</div>
                              {(() => {
                                const currentCollateral = parseFloat(userLoan.collateral);
                                const borrowed = parseFloat(userLoan.borrowed);
                                const currentCollateralInLarry = (currentCollateral * parseFloat(contractBacking)) / parseFloat(totalSupply);
                                const currentRatio = (currentCollateralInLarry / borrowed) * 100;
                                const requiredCollateralInLarry = borrowed / 0.99;
                                const requiredCollateralInYkp = (requiredCollateralInLarry * parseFloat(totalSupply)) / parseFloat(contractBacking);
                                const maxSafeRemovable = Math.max(0, currentCollateral - requiredCollateralInYkp);
                                
                                return (
                                  <div className="space-y-1 text-blue-700">
                                    <div>Current Ratio: <span className={`font-semibold ${currentRatio > 110 ? 'text-green-600' : currentRatio > 100 ? 'text-yellow-600' : 'text-red-600'}`}>{currentRatio.toFixed(1)}%</span></div>
                                    <div>Required: <span className="font-semibold">99.0%</span> minimum</div>
                                    <div>Safe to Remove: <span className="font-semibold text-green-600">{maxSafeRemovable.toFixed(4)} YKP</span></div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          
                          <button
                            onClick={removeCollateral}
                            disabled={!removeCollateralAmount || isLoading}
                            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove Collateral
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repay Loan</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                              <label className="block text-sm font-semibold text-gray-700">
                                LARRY Amount to Repay <span className="text-red-600">(Partial Only)</span>
                              </label>
                              <div className="text-xs sm:text-sm text-gray-600 truncate">
                                Owed: {userLoan.borrowed} LARRY | Max Repayable: ~{(parseFloat(userLoan.borrowed || '0') * 0.9999).toFixed(6)} LARRY
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={repayAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow decimal numbers with up to 18 decimal places
                                  if (/^\d*\.?\d{0,18}$/.test(value) || value === '') {
                                    setRepayAmount(value);
                                  }
                                }}
                                placeholder="Enter exact LARRY amount"
                                className="w-full px-4 py-3 pr-16 sm:pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white mobile-responsive-input font-mono"
                              />
                              <button
                                onClick={() => {
                                  // IMPORTANT: Cannot repay exact borrowed amount due to contract requirement
                                  // "require(borrowed > amount, \"Must repay less than borrowed amount\");"
                                  const exactBorrowedAmount = userLoan.borrowed || '0';
                                  const borrowedFloat = parseFloat(exactBorrowedAmount);
                                  const balanceFloat = parseFloat(larryBalance || '0');
                                  
                                  // Set to slightly less than borrowed amount (99.99% of borrowed)
                                  const maxRepayableFloat = borrowedFloat * 0.9999;
                                  const maxRepayable = maxRepayableFloat.toFixed(12); // Keep precision
                                  
                                  if (balanceFloat >= maxRepayableFloat) {
                                    setRepayAmount(maxRepayable);
                                  } else {
                                    // User doesn't have enough, use their balance (limit to 2 decimals)
                                    const balance = parseFloat(larryBalance || '0');
                                    setRepayAmount(balance.toFixed(2));
                                  }
                                }}
                                className="absolute right-14 sm:right-16 top-3 bg-blue-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
                              >
                                99%
                              </button>
                              <div className="absolute right-2 sm:right-3 top-3 text-gray-500 font-semibold text-xs sm:text-base">LARRY</div>
                            </div>
                          </div>
                          
                          {/* Repayment Rules Info */}
                          {userLoan.borrowed && parseFloat(userLoan.borrowed) > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 text-xs sm:text-sm">
                              <div className="font-semibold text-blue-800 mb-2">💡 Repayment Rules</div>
                              <div className="space-y-1 text-blue-700">
                                <div>Total owed: <span className="font-mono font-semibold">{userLoan.borrowed}</span> LARRY</div>
                                <div>⚠️ <strong>Cannot repay the full amount here</strong></div>
                                <div>Contract requires: <code>repay_amount &lt; borrowed_amount</code></div>
                                <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800">
                                  <strong>To close loan completely:</strong><br/>
                                  Use &quot;Close Position&quot; or &quot;Flash Close&quot; buttons below
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={repayLoan}
                            disabled={!repayAmount || isLoading}
                            className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Repay Loan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Extend Loan</h3>
                      {(() => {
                        // Calculate maximum extendable days
                        const currentTime = Math.floor(Date.now() / 1000);
                        const loanEndTime = parseInt(userLoan.endDate || '0');
                        const remainingDays = Math.max(0, Math.floor((loanEndTime - currentTime) / (24 * 60 * 60)));
                        const maxExtendableDays = Math.max(0, 365 - remainingDays);
                        
                        
                        return (
                          <>
                            {/* Loan Status Info */}
                            <div className="bg-purple-50 rounded-lg p-4 mb-6">
                              <div className="font-semibold text-purple-800 mb-2">📅 Loan Duration Status</div>
                              <div className="space-y-1 text-sm text-purple-700">
                                <div>Current remaining: <span className="font-semibold">{remainingDays} days</span></div>
                                <div>Maximum total duration: <span className="font-semibold">365 days</span></div>
                                <div>Maximum extendable: <span className="font-semibold text-green-600">{maxExtendableDays} days</span></div>
                                {maxExtendableDays === 0 && (
                                  <div className="text-red-600 font-semibold mt-2">⚠️ Cannot extend - already at maximum duration</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Additional Days (Max: {maxExtendableDays})
                                </label>
                                <select
                                  value={extendDays}
                                  onChange={(e) => setExtendDays(e.target.value)}
                                  disabled={maxExtendableDays === 0}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  {maxExtendableDays === 0 && <option value="0">Cannot Extend</option>}
                                  {maxExtendableDays >= 7 && <option value="7">7 Days</option>}
                                  {maxExtendableDays >= 14 && <option value="14">14 Days</option>}
                                  {maxExtendableDays >= 30 && <option value="30">30 Days</option>}
                                  {maxExtendableDays >= 60 && <option value="60">60 Days</option>}
                                  {maxExtendableDays >= 90 && <option value="90">90 Days</option>}
                                  {maxExtendableDays >= 180 && <option value="180">180 Days</option>}
                                  {maxExtendableDays > 0 && maxExtendableDays !== 7 && maxExtendableDays !== 14 && maxExtendableDays !== 30 && maxExtendableDays !== 60 && maxExtendableDays !== 90 && maxExtendableDays !== 180 && <option value={maxExtendableDays.toString()}>MAX: {maxExtendableDays} Days</option>}
                                </select>
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={extendLoan}
                                  disabled={!extendDays || isLoading || maxExtendableDays === 0 || parseInt(extendDays) > maxExtendableDays}
                                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {maxExtendableDays === 0 ? 'Cannot Extend' : 'Extend Loan'}
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Position Management</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={closePosition}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-red-400 to-pink-500 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                              <span className="text-sm sm:text-base">Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <span>❌</span>
                              <span className="text-sm sm:text-base">Close Position</span>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={flashClosePosition}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-orange-400 to-red-500 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                              <span className="text-sm sm:text-base">Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <span>⚡</span>
                              <span className="text-sm sm:text-base">Flash Close</span>
                            </div>
                          )}
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm">
                        <div className="font-semibold text-blue-800 mb-1">💡 Position Closing Options</div>
                        <div className="text-blue-700 space-y-1">
                          <div><strong>Close Position:</strong> Standard position closure with normal settlement</div>
                          <div><strong>Flash Close:</strong> Instant position closure using flash loan functionality</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                

                {/* Transaction Status */}
                {txHash && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                      <span>✅</span>
                      Transaction Submitted!
                    </div>
                    <p className="text-sm text-green-700">
                      Transaction Hash: <code className="bg-green-100 px-2 py-1 rounded text-xs">{txHash}</code>
                    </p>
                    <a
                      href={`https://seitrace.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 underline text-sm mt-2 inline-block"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </>
            )}
        </div>


      </div>

      {/* Footer */}
      </div>
      <footer className="bg-white border-t border-yellow-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-lg">🥧</span>
            </div>
            <span className="text-gray-900 font-bold">YAKA PIE</span>
          </div>
          
          {/* Social Links */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <a 
              href="https://discord.gg/8HSJQUCujU" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord Community
            </a>
            <a 
              href="https://x.com/Yakapie_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow @Yakapie_
            </a>
          </div>
          
          <p className="text-gray-600 text-sm">Built on SEI Network • Smart Contract Protected • Never Goes Down</p>
        </div>
      </footer>
      </div>
    </>
  );
}
