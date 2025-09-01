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
  
  // Contract state for leverage calculations
  const [contractBacking, setContractBacking] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [buyFee, setBuyFee] = useState("975");
  const [sellFee, setSellFee] = useState("975");
  const [leverageFeeRate, setLeverageFeeRate] = useState("10");
  const [userLoan, setUserLoan] = useState({ collateral: "0", borrowed: "0", endDate: "0", numberOfDays: "0" });

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
    if (sellYkpAmount && parseFloat(sellYkpAmount) > 0 && contractBacking && totalSupply && sellFee) {
      // Use the actual sell fee from contract and calculateLarryFromTokens function
      const larryFromContract = calculateLarryFromTokens(sellYkpAmount);
      const feeMultiplier = parseFloat(sellFee) / 1000; // Convert from basis points
      const larryAfterFee = parseFloat(larryFromContract) * feeMultiplier;
      setSellLarryAmount(larryAfterFee.toFixed(4));
    } else if (sellYkpAmount && parseFloat(sellYkpAmount) > 0) {
      // Fallback to static calculation if contract data not loaded
      const calculated = (parseFloat(sellYkpAmount) * 0.975).toFixed(4);
      setSellLarryAmount(calculated);
    } else {
      setSellLarryAmount("");
    }
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
      const ykpBalanceFloat = Number(ykpBalanceWei) / Math.pow(10, 18);
      const ykpBalanceFloored = Math.floor(ykpBalanceFloat * 1e4) / 1e4; // avoid rounding up
      const ykpBalanceFormatted = ykpBalanceFloored.toFixed(4);
      setYkpBalance(ykpBalanceFormatted);
      
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
        const backingFormatted = (Number(backingWei) / Math.pow(10, 18)).toFixed(4);
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
            const formatted = (Number(wei) / Math.pow(10, 18)).toFixed(4);
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
        const totalSupplyFormatted = (Number(totalSupplyWei) / Math.pow(10, 18)).toFixed(4);
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
      const larryAmountWei = BigInt(Math.floor(parseFloat(larryAmount) * Math.pow(10, 18)));
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
      const tokensFormatted = (Number(tokensWei) / Math.pow(10, 18)).toFixed(4);
      console.log("✅ Tokens from getBuyTokens:", tokensFormatted, "YKP");
      
      return tokensFormatted;
    } catch (error) {
      console.error("❌ Failed to call getBuyTokens:", error);
      return "0";
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
      
      setUserLoan({
        collateral: (Number(collateral) / Math.pow(10, 18)).toFixed(4),
        borrowed: (Number(borrowed) / Math.pow(10, 18)).toFixed(4),
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
      const larryAmountWei = BigInt(Math.floor(larryAmountFloat * Math.pow(10, decimals)));
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
      const ykpAmountWei = BigInt(Math.floor(ykpAmountFloat * Math.pow(10, decimals)));
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
      const larryAmountWei = BigInt(Math.floor(larryAmountFloat * Math.pow(10, decimals)));
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      const numberOfDaysHex = '0x' + parseInt(leverageDays).toString(16);
      
      // Step 1: Approve LARRY tokens for the YKP contract (including fees)
      const totalRequiredWei = BigInt(Math.floor(totalRequired * Math.pow(10, decimals)));
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
      const larryAmountWei = BigInt(Math.floor(larryAmountFloat * Math.pow(10, decimals)));
      const larryAmountHex = '0x' + larryAmountWei.toString(16);
      const numberOfDaysHex = '0x' + parseInt(borrowDays).toString(16);
      
      // Calculate required YKP collateral in wei
      const collateralWei = BigInt(Math.floor(collateralFloat * Math.pow(10, decimals)));
      const collateralHex = '0x' + collateralWei.toString(16);
      
      // Step 1: Approve YKP tokens as collateral
      const approveData = encodeFunctionCall('approve', [YKP_TOKEN_ADDRESS, collateralHex]);

      console.log("Step 1: Approving YKP tokens as collateral...");
      const approveTxHash = await executeTransaction(YKP_TOKEN_ADDRESS, approveData);

      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }

      console.log("YKP tokens approved! Hash:", approveTxHash);

      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Call borrow function on YKP contract
      const borrowData = encodeFunctionCall('borrow', [larryAmountHex, numberOfDaysHex]);

      console.log("Step 2: Creating borrow position...");
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
      const amountWei = BigInt(Math.floor(amountFloat * Math.pow(10, decimals)));
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
      const decimals = 18;
      const amountWei = BigInt(Math.floor(amountFloat * Math.pow(10, decimals)));
      const amountHex = '0x' + amountWei.toString(16);
      const data = encodeFunctionCall('removeCollateral', [amountHex]);
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
      const decimals = 18;
      const amountWei = BigInt(Math.floor(amountFloat * Math.pow(10, decimals)));
      const amountHex = '0x' + amountWei.toString(16);
      const data = encodeFunctionCall('repay', [amountHex]);
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
      alert(err.message || "Repay failed");
    } finally {
      setIsLoading(false);
    }
  };

  const extendLoan = async () => {
    if (!isConnected || !extendDays) return;
    alert("Extend Loan functionality will be implemented soon!");
  };

  const closePosition = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setTxHash("");
    try {
      const data = encodeFunctionCall('closePosition', []);
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
      alert(err.message || "Close position failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Flash close removed

  // Max button functions
  const setMaxLarry = () => {
    setBuyLarryAmount(larryBalance);
  };

  const setMaxYkp = () => {
    // Use a conservative amount to avoid exceeding balance due to rounding
    const amt = ykpBalance ? (Math.floor(parseFloat(ykpBalance) * 1e4) / 1e4).toFixed(4) : "0";
    setSellYkpAmount(amt);
  };

  return (
    <div className={`${geistSans.className} ${inter.variable} min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100`}>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-yellow-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🥧</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YAKA PIE</h1>
                <p className="text-sm text-gray-600">DeFi Trading Platform</p>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-yellow-600 transition-colors">Home</Link>
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold">LARRY: {larryBalance}</div>
                    <div className="font-semibold">YKP: {ykpBalance}</div>
                  </div>

                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-2xl opacity-20 scale-110"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-yellow-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🥧</span>
                </div>
                <div className="text-center">
                  <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                    YAKA PIE Trading
                  </h1>
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg inline-block mt-2">
                    DeFi Protocol
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Complete DeFi trading platform for YAKA PIE. Buy, sell, leverage, borrow, and manage positions with price protection.
          </p>
        </div>

        {/* Network Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Network Information</h3>
            <div className="flex gap-2">
              {/* Debug/Test buttons removed per request */}
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-700">Network</div>
              <div className="text-gray-600">SEI EVM Mainnet</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Chain ID</div>
              <div className="text-gray-600">{SEI_CHAIN_ID}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">YKP Token</div>
              <div className="text-gray-600 font-mono text-xs">{YKP_TOKEN_ADDRESS}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">LARRY Token</div>
              <div className="text-gray-600 font-mono text-xs">{LARRY_TOKEN_ADDRESS}</div>
            </div>
          </div>
          
          {/* Contract Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-gray-700">Contract Backing</div>
                <div className={contractBacking === "0" ? "text-orange-600" : "text-green-600"}>
                  {contractBacking === "0" ? "❌ Not Loaded" : `✅ ${contractBacking} LARRY`}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Total Supply</div>
                <div className={totalSupply === "0" ? "text-orange-600" : "text-green-600"}>
                  {totalSupply === "0" ? "❌ Not Loaded" : `✅ ${totalSupply} YKP`}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Buy Fee Rate</div>
                <div className={buyFee === "975" ? "text-blue-600" : "text-green-600"}>
                  {buyFee === "975" ? "🔄 Default" : `✅ ${((1000 - parseFloat(buyFee)) / 10).toFixed(1)}%`}
                </div>
              </div>
            </div>
            {/* Helper text removed per request */}
          </div>
        </div>

        {/* Trading Interface */}
        <div className="bg-white rounded-3xl shadow-2xl border border-yellow-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: "buy", label: "Buy YKP", icon: "🛒" },
                { id: "sell", label: "Sell YKP", icon: "💰" },
                { id: "leverage", label: "Leverage", icon: "🚀" },
                { id: "borrow", label: "Borrow", icon: "🏦" },
                { id: "borrow-more", label: "Borrow More", icon: "📈" },
                { id: "manage", label: "Manage Position", icon: "⚙️" },
                
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all duration-300 ${
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
          <div className="p-8">
            {!isConnected ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">🔗</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">Connect your MetaMask or Web3 wallet to start trading on YAKA PIE</p>
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {/* Buy Tab */}
                {activeTab === "buy" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy YKP Tokens</h2>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          LARRY Amount to Spend
                        </label>
                        <div className="text-sm text-gray-600">
                          Balance: {larryBalance} LARRY
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={buyLarryAmount}
                          onChange={(e) => setBuyLarryAmount(e.target.value)}
                          placeholder="Enter LARRY amount"
                          className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <button
                          onClick={setMaxLarry}
                          className="absolute right-16 top-3 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-medium hover:bg-yellow-600 transition-colors"
                        >
                          MAX
                        </button>
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900"
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sell YKP Tokens</h2>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          YKP Amount to Sell
                        </label>
                        <div className="text-sm text-gray-600">
                          Balance: {ykpBalance} YKP
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={sellYkpAmount}
                          onChange={(e) => setSellYkpAmount(e.target.value)}
                          placeholder="Enter YKP amount"
                          className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <button
                          onClick={setMaxYkp}
                          className="absolute right-16 top-3 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-medium hover:bg-yellow-600 transition-colors"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
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
                      className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Leverage Position</h2>

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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Duration (Days): {leverageDays}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="365"
                        step="1"
                        value={leverageDays}
                        onChange={(e) => setLeverageDays(e.target.value)}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span>90</span>
                        <span>180</span>
                        <span>270</span>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg text-gray-900"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
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
                      className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrow LARRY</h2>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LARRY Amount to Borrow
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={borrowLarryAmount}
                          onChange={(e) => setBorrowLarryAmount(e.target.value)}
                          placeholder="Enter LARRY amount"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Duration (Days): {borrowDays}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="365"
                        step="1"
                        value={borrowDays}
                        onChange={(e) => setBorrowDays(e.target.value)}
                        className="w-full accent-yellow-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span>90</span>
                        <span>180</span>
                        <span>270</span>
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
                      className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrow More LARRY</h2>

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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Borrow More Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Additional Amount:</span>
                          <span>{borrowMoreAmount || "0"} LARRY</span>
                        </div>
                        <div className="text-orange-600 text-sm mt-2">
                          💡 You can borrow more against your existing collateral position
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={borrowMoreLARRY}
                      disabled={!borrowMoreAmount || isLoading}
                      className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Position</h2>

                    {/* Current Loan Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Loan</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div className="flex justify-between"><span>Collateral</span><span>{userLoan.collateral} YKP</span></div>
                        <div className="flex justify-between"><span>Borrowed</span><span>{userLoan.borrowed} LARRY</span></div>
                        <div className="flex justify-between"><span>Duration</span><span>{userLoan.numberOfDays} days</span></div>
                        <div className="flex justify-between"><span>End Date</span><span>{userLoan.endDate !== "0" ? new Date(parseInt(userLoan.endDate) * 1000).toLocaleDateString() : "N/A"}</span></div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Remove Collateral</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              YKP Amount to Remove
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={removeCollateralAmount}
                                onChange={(e) => setRemoveCollateralAmount(e.target.value)}
                                placeholder="Enter YKP amount"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                              />
                              <div className="absolute right-3 top-3 text-gray-500 font-semibold">YKP</div>
                            </div>
                          </div>
                          <button
                            onClick={removeCollateral}
                            disabled={!removeCollateralAmount || isLoading}
                            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove Collateral
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repay Loan</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              LARRY Amount to Repay
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                placeholder="Enter LARRY amount"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                              />
                              <div className="absolute right-3 top-3 text-gray-500 font-semibold">LARRY</div>
                            </div>
                          </div>
                          <button
                            onClick={repayLoan}
                            disabled={!repayAmount || isLoading}
                            className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Repay Loan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Extend Loan</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Additional Days
                          </label>
                          <select
                            value={extendDays}
                            onChange={(e) => setExtendDays(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                          >
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={extendLoan}
                            disabled={!extendDays || isLoading}
                            className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Extend Loan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex gap-4">
                        <button
                          onClick={closePosition}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Close Position
                        </button>
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
          <p className="text-gray-600 text-sm">Built on SEI Network • Smart Contract Protected • Never Goes Down</p>
        </div>
      </footer>
    </div>
  );
}
