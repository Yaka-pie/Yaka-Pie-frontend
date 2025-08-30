import { useState, useEffect } from "react";
import Link from "next/link";
import { Geist, Inter } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const YKP_TOKEN_ADDRESS = "0xd3323f8e7556c6A5C3cF3A143eAbaF0dE59cC43b";
const LARRY_TOKEN_ADDRESS = "0x888d81e3ea5E8362B5f69188CBCF34Fa8da4b888";
const SEI_CHAIN_ID = 1329; // SEI EVM Mainnet

interface EthereumError {
  code: number;
  message: string;
}

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

  // Buy/Sell states
  const [buyLarryAmount, setBuyLarryAmount] = useState("");
  const [buyYkpAmount, setBuyYkpAmount] = useState("");
  const [sellYkpAmount, setSellYkpAmount] = useState("");
  const [sellLarryAmount, setSellLarryAmount] = useState("");

  // Leverage states
  const [leverageLarryAmount, setLeverageLarryAmount] = useState("");
  const [leverageDays, setLeverageDays] = useState("30");
  const [leverageFee, setLeverageFee] = useState("");

  // Borrow states
  const [borrowLarryAmount, setBorrowLarryAmount] = useState("");
  const [borrowDays, setBorrowDays] = useState("30");
  const [borrowCollateral, setBorrowCollateral] = useState("");

  // Borrow More states
  const [borrowMoreAmount, setBorrowMoreAmount] = useState("");
  const [borrowMoreCollateral, setBorrowMoreCollateral] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Position Management states
  const [removeCollateralAmount, setRemoveCollateralAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [extendDays, setExtendDays] = useState("30");

  // Flash Close states
  const [flashCloseCollateral, setFlashCloseCollateral] = useState("");

  // Calculate buy amounts
  useEffect(() => {
    if (buyLarryAmount && parseFloat(buyLarryAmount) > 0) {
      const calculated = (parseFloat(buyLarryAmount) * 0.975).toFixed(4);
      setBuyYkpAmount(calculated);
    } else {
      setBuyYkpAmount("");
    }
  }, [buyLarryAmount]);

  // Calculate sell amounts
  useEffect(() => {
    if (sellYkpAmount && parseFloat(sellYkpAmount) > 0) {
      const calculated = (parseFloat(sellYkpAmount) * 0.975).toFixed(4);
      setSellLarryAmount(calculated);
    } else {
      setSellLarryAmount("");
    }
  }, [sellYkpAmount]);

  // Calculate leverage fee
  useEffect(() => {
    if (leverageLarryAmount && parseFloat(leverageLarryAmount) > 0 && leverageDays) {
      const baseInterest = (parseFloat(leverageLarryAmount) * 0.039 * parseFloat(leverageDays)) / 365;
      const dayInterest = (parseFloat(leverageLarryAmount) * 0.001 * parseFloat(leverageDays));
      const totalFee = (parseFloat(leverageLarryAmount) * 0.1) + baseInterest + dayInterest;
      setLeverageFee(totalFee.toFixed(4));
    } else {
      setLeverageFee("");
    }
  }, [leverageLarryAmount, leverageDays]);

  // Calculate borrow collateral
  useEffect(() => {
    if (borrowLarryAmount && parseFloat(borrowLarryAmount) > 0) {
      const collateral = (parseFloat(borrowLarryAmount) / 0.99).toFixed(4);
      setBorrowCollateral(collateral);
    } else {
      setBorrowCollateral("");
    }
  }, [borrowLarryAmount]);

  // Function to fetch user balances
  const fetchBalances = async (userAccount: string) => {
    if (!window.ethereum) return;
    
    try {
      // Get LARRY balance
      const larryBalanceData = encodeContractCall('0x70a08231', [padAddress(userAccount)]); // balanceOf
      const larryResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: LARRY_TOKEN_ADDRESS,
          data: larryBalanceData
        }, 'latest']
      }) as string;
      
      const larryBalanceWei = BigInt(larryResult);
      const larryBalanceFormatted = (Number(larryBalanceWei) / Math.pow(10, 18)).toFixed(4);
      setLarryBalance(larryBalanceFormatted);
      
      // Get YKP balance  
      const ykpBalanceData = encodeContractCall('0x70a08231', [padAddress(userAccount)]); // balanceOf
      const ykpResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: YKP_TOKEN_ADDRESS,
          data: ykpBalanceData
        }, 'latest']
      }) as string;
      
      const ykpBalanceWei = BigInt(ykpResult);
      const ykpBalanceFormatted = (Number(ykpBalanceWei) / Math.pow(10, 18)).toFixed(4);
      setYkpBalance(ykpBalanceFormatted);
      
    } catch (error) {
      console.error("Failed to fetch balances:", error);
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
        
        // Fetch balances after connection
        await fetchBalances(accounts[0]);
        
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

  // Trading Functions
  const executeTransaction = async (action: string, to: string, data: string, value: string = '0x0') => {
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

    } catch (error: any) {
      console.error("Transaction failed:", error);
      
      if (error.code === 4001) {
        throw new Error("Transaction cancelled by user");
      } else {
        throw new Error(error.message || "Transaction failed");
      }
    }
  };

  const buyYKP = async () => {
    if (!isConnected || !buyLarryAmount) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert LARRY amount to wei (18 decimals)
      const larryAmountWei = (parseFloat(buyLarryAmount) * Math.pow(10, 18)).toString();
      const larryAmountHex = '0x' + BigInt(larryAmountWei).toString(16);
      
      // Step 1: Approve LARRY tokens for the YKP contract
      const approveData = encodeContractCall(
        '0x095ea7b3', // approve(address,uint256)
        [
          padAddress(YKP_TOKEN_ADDRESS), // spender (YKP contract)
          padNumber(larryAmountHex) // amount in hex
        ]
      );
      
      console.log("Step 1: Approving LARRY tokens...");
      const approveTxHash = await executeTransaction("Approve LARRY", LARRY_TOKEN_ADDRESS, approveData);
      
      if (!approveTxHash) {
        setIsLoading(false);
        return;
      }
      
      console.log("LARRY tokens approved! Hash:", approveTxHash);
      
      // Wait a moment for approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Call buy function on YKP contract
      const buyData = encodeContractCall(
        '0x6c8f61b4', // buy(address,uint256) function signature
        [
          padAddress(account), // receiver address
          padNumber(larryAmountHex) // amount in hex
        ]
      );
      
      console.log("Step 2: Buying YKP tokens...");
      const buyTxHash = await executeTransaction("Buy YKP", YKP_TOKEN_ADDRESS, buyData);
      
      if (buyTxHash) {
        setTxHash(buyTxHash);
        alert(`Buy YKP transaction submitted! Transaction hash: ${buyTxHash}`);
        
        // Refresh balances after successful transaction
        setTimeout(() => {
          fetchBalances(account);
        }, 3000);
      }
      
    } catch (error: any) {
      console.error("Buy YKP failed:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sellYKP = async () => {
    if (!isConnected || !sellYkpAmount) return;
    
    setIsLoading(true);
    setTxHash("");
    
    try {
      // Convert YKP amount to wei (18 decimals)
      const ykpAmountWei = (parseFloat(sellYkpAmount) * Math.pow(10, 18)).toString();
      const ykpAmountHex = '0x' + BigInt(ykpAmountWei).toString(16);
      
      // Call sell function on YKP contract
      const sellData = encodeContractCall(
        '0xe4849b32', // sell(uint256) function signature  
        [padNumber(ykpAmountHex)]
      );
      
      const txHash = await executeTransaction("Sell YKP", YKP_TOKEN_ADDRESS, sellData);
      
      if (txHash) {
        setTxHash(txHash);
        alert(`Sell YKP transaction submitted! Transaction hash: ${txHash}`);
        
        // Refresh balances after successful transaction
        setTimeout(() => {
          fetchBalances(account);
        }, 3000);
      }
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const leveragePosition = async () => {
    if (!isConnected || !leverageLarryAmount || !leverageDays) return;
    alert("Leverage functionality will be implemented soon!");
  };

  const borrowLARRY = async () => {
    if (!isConnected || !borrowLarryAmount || !borrowDays) return;
    alert("Borrow functionality will be implemented soon!");
  };

  const borrowMoreLARRY = async () => {
    if (!isConnected || !borrowMoreAmount) return;
    alert("Borrow More functionality will be implemented soon!");
  };

  const removeCollateral = async () => {
    if (!isConnected || !removeCollateralAmount) return;
    alert("Remove Collateral functionality will be implemented soon!");
  };

  const repayLoan = async () => {
    if (!isConnected || !repayAmount) return;
    alert("Repay Loan functionality will be implemented soon!");
  };

  const extendLoan = async () => {
    if (!isConnected || !extendDays) return;
    alert("Extend Loan functionality will be implemented soon!");
  };

  const closePosition = async () => {
    if (!isConnected) return;
    alert("Close Position functionality will be implemented soon!");
  };

  const flashClosePosition = async () => {
    if (!isConnected || !flashCloseCollateral) return;
    alert("Flash Close functionality will be implemented soon!");
  };

  // Max button functions
  const setMaxLarry = () => {
    setBuyLarryAmount(larryBalance);
  };

  const setMaxYkp = () => {
    setSellYkpAmount(ykpBalance);
  };

  return (
    <div className={`${geistSans.className} ${inter.variable} min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100`}>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-yellow-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">Y</span>
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
              <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                YAKA PIE Trading
              </h1>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg inline-block">
                DeFi Protocol
              </div>
            </div>
          </div>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Complete DeFi trading platform for YAKA PIE. Buy, sell, leverage, borrow, and manage positions with price protection.
          </p>
        </div>

        {/* Network Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Network Information</h3>
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
                { id: "flash", label: "Flash Actions", icon: "⚡" }
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
                          <span>Buy Fee (2.5%):</span>
                          <span>{buyLarryAmount ? (parseFloat(buyLarryAmount) * 0.025).toFixed(4) : "0"} LARRY</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>You Receive:</span>
                          <span>{buyYkpAmount || "0"} YKP</span>
                        </div>
                      </div>
                    </div>

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
                          <span>Sell Fee (2.5%):</span>
                          <span>{sellYkpAmount ? (parseFloat(sellYkpAmount) * 0.025).toFixed(4) : "0"} YKP</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>You Receive:</span>
                          <span>{sellLarryAmount || "0"} LARRY</span>
                        </div>
                      </div>
                    </div>

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
                        Loan Duration (Days)
                      </label>
                      <select
                        value={leverageDays}
                        onChange={(e) => setLeverageDays(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                      >
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
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
                          <span>Interest Rate:</span>
                          <span>3.9% APY + 0.1%/day</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total Fee:</span>
                          <span>{leverageFee || "0"} LARRY</span>
                        </div>
                      </div>
                    </div>

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
                        Loan Duration (Days)
                      </label>
                      <select
                        value={borrowDays}
                        onChange={(e) => setBorrowDays(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                      >
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
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

                {/* Flash Actions Tab */}
                {activeTab === "flash" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Flash Actions</h2>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        YKP Collateral Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={flashCloseCollateral}
                          onChange={(e) => setFlashCloseCollateral(e.target.value)}
                          placeholder="Enter YKP collateral amount"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg text-gray-900 bg-white"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 font-semibold">YKP</div>
                      </div>
                    </div>

                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Flash Close Details</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Collateral Amount:</span>
                          <span>{flashCloseCollateral || "0"} YKP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flash Fee:</span>
                          <span>{flashCloseCollateral ? (parseFloat(flashCloseCollateral) * 0.01).toFixed(4) : "0"} YKP</span>
                        </div>
                        <div className="text-cyan-600 text-sm mt-2">
                          ⚡ Instant position closure with flash loan mechanics
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={flashClosePosition}
                      disabled={!flashCloseCollateral || isLoading}
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>⚡</span>
                          Flash Close Position
                          <span>💫</span>
                        </div>
                      )}
                    </button>
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
              <span className="text-white font-black">Y</span>
            </div>
            <span className="text-gray-900 font-bold">YAKA PIE</span>
          </div>
          <p className="text-gray-600 text-sm">Built on SEI Network • Smart Contract Protected • Never Goes Down</p>
        </div>
      </footer>
    </div>
  );
}
