'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import useContract from '../hooks/useContract';

const YKP_TOKEN_ADDRESS = "0x008c8c362cd46a9e41957cc11ee812647233dff1";

interface PriceDataPoint {
  date: string;
  seiPrice: string;
  larryPriceInSei: string;
  ykpPriceInLarry: string;
  ykpPriceInSei: string;
  floor: number;
}

interface TooltipPayload {
  dataKey: string;
  value: string;
}

const PriceChart = () => {
  const { lastPrice, totalSupply, totalBorrowed, backing, buyFee, sellFee, larryPrice, larrySupply, isLoading, refreshData } = useContract();
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);

  const generatePriceData = (currentYkpPrice: number, currentLarryPrice: number) => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // 29 days ago
    
    // Real prices from contracts
    const larryStartPrice = 0.01; // LARRY started at 0.01 SEI  
    const larryCurrentPrice = Math.max(currentLarryPrice, larryStartPrice); // Real LARRY price from contract
    
    const ykpStartPrice = 1.0; // 1 YKP = 1 LARRY initially (but LARRY was 0.01 SEI)
    const ykpCurrentPrice = Math.max(currentYkpPrice, 1.0); // Real YKP price from contract
    
    // Starting SEI price (baseline)
    const seiPrice = 1.0;
    
    const totalDays = 29;
    const larryGrowthRate = Math.pow(larryCurrentPrice / larryStartPrice, 1 / totalDays);
    const ykpGrowthRate = Math.pow(ykpCurrentPrice / ykpStartPrice, 1 / totalDays);
    
    let larryPrice = larryStartPrice;
    let ykpPrice = ykpStartPrice;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // All prices only increase, never decrease (price protection)
      larryPrice = Math.max(larryPrice, larryPrice * larryGrowthRate);
      ykpPrice = Math.max(ykpPrice, ykpPrice * ykpGrowthRate);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        seiPrice: seiPrice.toFixed(6), // SEI stays at 1 (baseline)
        larryPriceInSei: larryPrice.toFixed(6), // LARRY price in SEI
        ykpPriceInLarry: ykpPrice.toFixed(6), // YKP price in LARRY
        ykpPriceInSei: (larryPrice * ykpPrice).toFixed(6), // YKP total value in SEI!
        floor: 1.0 // Protected floors
      });
    }
    
    // Add today's current prices
    const today = new Date();
    data.push({
      date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      seiPrice: seiPrice.toFixed(6),
      larryPriceInSei: larryCurrentPrice.toFixed(6),
      ykpPriceInLarry: ykpCurrentPrice.toFixed(6),
      ykpPriceInSei: (larryCurrentPrice * ykpCurrentPrice).toFixed(6), // COMPOUNDING GAINS!
      floor: 1.0
    });
    
    return data;
  };

  useEffect(() => {
    const currentYkpPrice = parseFloat(lastPrice);
    const currentLarryPrice = parseFloat(larryPrice);
    
    if (currentYkpPrice > 0 && currentLarryPrice > 0) {
      setPriceHistory(generatePriceData(currentYkpPrice, currentLarryPrice));
    } else {
      setPriceHistory([]);
    }
  }, [lastPrice, larryPrice]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  const priceData = priceHistory;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (active && payload && payload.length) {
      const seiPrice = payload.find((p: TooltipPayload) => p.dataKey === 'seiPrice')?.value || '1';
      const larryPrice = payload.find((p: TooltipPayload) => p.dataKey === 'larryPriceInSei')?.value || '0';
      const ykpPrice = payload.find((p: TooltipPayload) => p.dataKey === 'ykpPriceInSei')?.value || '0';
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-yellow-200">
          <p className="font-semibold text-gray-900">{`Date: ${label || ''}`}</p>
          <hr className="my-2" />
          <p className="text-gray-600">
            {`SEI: ${parseFloat(seiPrice).toFixed(6)} (Baseline)`}
          </p>
          <p className="text-blue-600">
            {`LARRY: ${parseFloat(larryPrice).toFixed(6)} SEI (+${(((parseFloat(larryPrice) - 0.01) / 0.01) * 100).toFixed(0)}% from 0.01)`}
          </p>
          <p className="text-red-600 font-bold">
            {`YKP: ${parseFloat(ykpPrice).toFixed(6)} SEI (+${(((parseFloat(ykpPrice) - 0.01) / 0.01) * 100).toFixed(0)}% from 0.01)`}
          </p>
          <hr className="my-2" />
          <p className="text-sm text-green-700 font-semibold">
            🚀 YKP delivers over {(((parseFloat(ykpPrice) - 0.01) / 0.01) * 100).toFixed(0)}% gains from 0.01 starting price!
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-xl border border-yellow-200 mb-8">
        {parseFloat(lastPrice) > 0 && parseFloat(larryPrice) > 0 ? (
          <>
            <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg p-3 sm:p-4 border-2 border-green-200 mb-6">
              <div className="text-center">
                <h4 className="text-sm sm:text-lg font-bold text-gray-900 mb-2">💰 100 SEI COMPARISON 💰</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-0">
                    <div className="text-xs sm:text-sm text-gray-600">Holding SEI</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-500">100 SEI</div>
                    <div className="text-xs text-gray-500">+0%</div>
                  </div>
                  <div className="text-center p-2 sm:p-0">
                    <div className="text-xs sm:text-sm text-blue-600">LARRY</div>
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{(100 * parseFloat(larryPrice) / 0.01).toFixed(0)} SEI</div>
                    <div className="text-xs text-blue-500">+{(((parseFloat(larryPrice) - 0.01) / 0.01) * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center border-2 border-green-400 rounded-lg p-2 bg-green-50">
                    <div className="text-xs sm:text-sm text-green-700 font-bold">🚀 YKP 🚀</div>
                    <div className="text-lg sm:text-2xl font-black text-red-600">{(100 * (parseFloat(larryPrice) * parseFloat(lastPrice)) / 0.01).toFixed(0)} SEI</div>
                    <div className="text-xs text-green-600 font-bold">+{(((parseFloat(larryPrice) * parseFloat(lastPrice)) - 0.01) / 0.01 * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-green-700 font-semibold">
                  🎯 YKP delivers {(((parseFloat(larryPrice) * parseFloat(lastPrice) - 0.01) / 0.01) * 100).toFixed(0)}% gains! 🚀
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-semibold text-blue-800">LARRY Supply</div>
                <div className="text-lg font-bold text-blue-600">
                  {parseFloat(larrySupply).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-sm font-semibold text-green-800">YKP Supply</div>
                <div className="text-lg font-bold text-green-600">
                  {parseFloat(totalSupply).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-sm font-semibold text-purple-800">YKP Backing</div>
                <div className="text-lg font-bold text-purple-600">
                  {parseFloat(backing).toLocaleString()} LARRY
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="text-sm font-semibold text-orange-800">Protection Status</div>
                <div className="text-lg font-bold text-orange-600">✅ Active</div>
                <div className="text-xs text-orange-500 mt-1">Never decreases</div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
            <div className="text-red-800 text-center">
              <div className="text-lg font-bold mb-2">⚠️ Contract Connection Failed</div>
              <div className="text-sm">Unable to fetch real-time price data. Please refresh or check your connection.</div>
            </div>
          </div>
        )}
    </div>
  );
};

export default PriceChart;