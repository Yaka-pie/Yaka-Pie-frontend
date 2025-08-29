import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.className} min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden`}>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 animate-pulse"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-purple-500/5 to-transparent animate-spin [animation-duration:20s]"></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
          <div className="text-center">
            {/* Animated Logo */}
            <div className="relative mb-8">
              <h1 className="text-7xl sm:text-9xl font-black mb-4 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
                YAKA PIE
              </h1>
              <div className="absolute inset-0 text-7xl sm:text-9xl font-black text-yellow-400/20 blur-sm animate-pulse">
                YAKA PIE
              </div>
            </div>

            <div className="text-3xl sm:text-5xl font-mono font-bold text-yellow-400 mb-6 animate-bounce">
              (YKP)
            </div>

            <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-yellow-400/30 shadow-2xl">
              <p className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-4">
                ⚠️ PRICE PROTECTION ACTIVE ⚠️
              </p>
              <p className="text-xl sm:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
                The world&apos;s first meme coin that can <span className="text-green-400 font-black text-3xl">NEVER GO DOWN</span> in price.
                <br />Mathematically impossible to lose value.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-lg font-semibold text-gray-300">
              <span className="bg-blue-500/20 px-4 py-2 rounded-full border border-blue-400/30">🌐 SEI Network</span>
              <span className="bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30">💎 LARRY Backed</span>
              <span className="bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">🚀 Leverage Protocol</span>
              <span className="bg-pink-500/20 px-4 py-2 rounded-full border border-pink-400/30">🛡️ Price Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 gap-6 mb-20">
          <div className="group bg-gradient-to-br from-green-500/10 to-green-700/10 backdrop-blur-lg rounded-2xl p-8 border border-green-400/30 hover:border-green-400/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="text-5xl mb-4 group-hover:animate-bounce">🛡️</div>
            <h3 className="text-2xl font-black mb-4 text-green-400">PRICE FLOOR</h3>
            <p className="text-gray-200 leading-relaxed mb-4">
              Smart contract enforced price protection. Every transaction must maintain or increase the price.
            </p>
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-400/20">
              <code className="text-green-300 text-xs font-mono">
                require(lastPrice ≤ newPrice)
              </code>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-blue-500/10 to-blue-700/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="text-5xl mb-4 group-hover:animate-bounce">💰</div>
            <h3 className="text-2xl font-black mb-4 text-blue-400">FULLY BACKED</h3>
            <p className="text-gray-200 leading-relaxed mb-4">
              100% LARRY token backing. Every YKP is fully collateralized with real assets.
            </p>
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-400/20">
              <code className="text-blue-300 text-xs font-mono">
                getBacking() + totalBorrowed
              </code>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-500/10 to-purple-700/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="text-5xl mb-4 group-hover:animate-bounce">🚀</div>
            <h3 className="text-2xl font-black mb-4 text-purple-400">LEVERAGE LOOPS</h3>
            <p className="text-gray-200 leading-relaxed mb-4">
              Borrow LARRY against YKP collateral. Create compounding leverage positions.
            </p>
            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-400/20">
              <code className="text-purple-300 text-xs font-mono">
                leverage(uint256 larry, days)
              </code>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-pink-500/10 to-pink-700/10 backdrop-blur-lg rounded-2xl p-8 border border-pink-400/30 hover:border-pink-400/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="text-5xl mb-4 group-hover:animate-bounce">⚡</div>
            <h3 className="text-2xl font-black mb-4 text-pink-400">FLASH ACTIONS</h3>
            <p className="text-gray-200 leading-relaxed mb-4">
              Advanced flash loan mechanics for instant position management.
            </p>
            <div className="bg-pink-900/30 rounded-lg p-3 border border-pink-400/20">
              <code className="text-pink-300 text-xs font-mono">
                flashClosePosition()
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Interactive Steps */}
      <div className="relative z-10 bg-gradient-to-r from-black/40 via-purple-900/20 to-black/40 backdrop-blur-sm py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-16 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            The YAKA PIE Protocol
          </h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl p-8 border border-green-400/20">
              <div className="flex-1">
                <div className="text-6xl mb-4">1️⃣</div>
                <h3 className="text-3xl font-black mb-6 text-green-400">Initialize & Buy YKP</h3>
                <ul className="space-y-3 text-gray-200 text-lg">
                  <li>• Deploy contract with LARRY token address</li>
                  <li>• Owner calls <code className="bg-green-900/30 px-2 py-1 rounded text-green-300">setStart()</code> with initial liquidity</li>
                  <li>• Buy YKP tokens with LARRY (2.5% fee max)</li>
                  <li>• 80% fee to treasury, 20% LARRY burned</li>
                  <li>• Automatic price protection activates</li>
                </ul>
              </div>
              <div className="lg:w-1/3">
                <div className="bg-black/50 rounded-xl p-6 border border-green-400/30">
                  <pre className="text-green-300 text-sm overflow-x-auto">
{`buy(address receiver, uint256 amount)
// Mint tokens with fee
// 80% to FEE_ADDRESS
// 20% LARRY burned
// Price protection: ✓`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-8 border border-blue-400/20">
              <div className="flex-1">
                <div className="text-6xl mb-4">2️⃣</div>
                <h3 className="text-3xl font-black mb-6 text-blue-400">Borrow LARRY with Leverage</h3>
                <ul className="space-y-3 text-gray-200 text-lg">
                  <li>• Use YKP as collateral (99% collateralization)</li>
                  <li>• Borrow LARRY with interest (3.9% APY base)</li>
                  <li>• Choose loan duration (1-365 days)</li>
                  <li>• Automatic liquidation if loan expires</li>
                  <li>• Borrow more against existing collateral</li>
                </ul>
              </div>
              <div className="lg:w-1/3">
                <div className="bg-black/50 rounded-xl p-6 border border-blue-400/30">
                  <pre className="text-blue-300 text-sm overflow-x-auto">
{`borrow(uint256 larry, uint256 days)
// 99% collateralization
// Interest: 3.9% + 0.1% per day
// Max 365 days
// Auto-liquidation: ✓`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-400/20">
              <div className="flex-1">
                <div className="text-6xl mb-4">3️⃣</div>
                <h3 className="text-3xl font-black mb-6 text-purple-400">Advanced Position Management</h3>
                <ul className="space-y-3 text-gray-200 text-lg">
                  <li>• <code className="bg-purple-900/30 px-2 py-1 rounded">borrowMore()</code> - Increase loan amount</li>
                  <li>• <code className="bg-purple-900/30 px-2 py-1 rounded">removeCollateral()</code> - Free up tokens</li>
                  <li>• <code className="bg-purple-900/30 px-2 py-1 rounded">repay()</code> - Pay down debt</li>
                  <li>• <code className="bg-purple-900/30 px-2 py-1 rounded">extendLoan()</code> - Extend duration</li>
                  <li>• <code className="bg-purple-900/30 px-2 py-1 rounded">flashClosePosition()</code> - Instant close</li>
                </ul>
              </div>
              <div className="lg:w-1/3">
                <div className="bg-black/50 rounded-xl p-6 border border-purple-400/30">
                  <pre className="text-purple-300 text-sm overflow-x-auto">
{`removeCollateral(uint256 amount)
// Must maintain 99% ratio
// Frees up YKP tokens
// Price protection: ✓`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-3xl p-8 border border-pink-400/20">
              <div className="flex-1">
                <div className="text-6xl mb-4">4️⃣</div>
                <h3 className="text-3xl font-black mb-6 text-pink-400">Sell & Liquidation System</h3>
                <ul className="space-y-3 text-gray-200 text-lg">
                  <li>• Sell YKP for LARRY (2.5% fee max)</li>
                  <li>• 80% fee to treasury, 20% LARRY burned</li>
                  <li>• Automatic daily liquidation of expired loans</li>
                  <li>• Price always increases or stays same</li>
                  <li>• Full asset backing maintained</li>
                </ul>
              </div>
              <div className="lg:w-1/3">
                <div className="bg-black/50 rounded-xl p-6 border border-pink-400/30">
                  <pre className="text-pink-300 text-sm overflow-x-auto">
{`liquidate()
// Daily auto-liquidation
// Expired loans burned
// Collateral redistributed
// Price protection: ✓`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center mb-16 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          Advanced DeFi Features
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Borrowing Features */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-400/30">
            <h3 className="text-2xl font-black mb-6 text-blue-400 flex items-center gap-3">
              💰 BORROWING SYSTEM
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Flexible loan terms (1-365 days)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>99% collateralization requirement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Interest: 3.9% APY + 0.1% per day</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Borrow more against existing collateral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Extend loans without closing</span>
              </li>
            </ul>
          </div>

          {/* Safety Features */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg rounded-2xl p-8 border border-green-400/30">
            <h3 className="text-2xl font-black mb-6 text-green-400 flex items-center gap-3">
              🛡️ SAFETY MECHANISMS
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Price floor protection (never decreases)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Safety check on every transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Automatic loan liquidation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>99% collateralization enforced</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>ERC20 burnable LARRY integration</span>
              </li>
            </ul>
          </div>

          {/* Fee System */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30">
            <h3 className="text-2xl font-black mb-6 text-purple-400 flex items-center gap-3">
              💎 FEE ECONOMICS
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Buy fee: 2.5% max (97.5% to user)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Sell fee: 2.5% max (97.5% to user)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>80% of fees to treasury</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>20% of fees burned (deflationary)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>LARRY burn mechanism integrated</span>
              </li>
            </ul>
          </div>

          {/* Flash Features */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg rounded-2xl p-8 border border-orange-400/30">
            <h3 className="text-2xl font-black mb-6 text-orange-400 flex items-center gap-3">
              ⚡ FLASH ACTIONS
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Flash close position</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Instant liquidation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>1% flash fee</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>30% fee to treasury, 10% burned</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Price protection maintained</span>
              </li>
            </ul>
          </div>

          {/* Liquidation */}
          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl p-8 border border-red-400/30">
            <h3 className="text-2xl font-black mb-6 text-red-400 flex items-center gap-3">
              🔥 LIQUIDATION ENGINE
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Daily automatic liquidation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Midnight timestamp calculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Expired collateral burned</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Borrowed amount reduction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Price protection during liquidation</span>
              </li>
            </ul>
          </div>

          {/* Utility Functions */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-lg rounded-2xl p-8 border border-cyan-400/30">
            <h3 className="text-2xl font-black mb-6 text-cyan-400 flex items-center gap-3">
              🛠️ UTILITY FUNCTIONS
            </h3>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Real-time price calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Token conversion utilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Loan status checking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Fee preview functions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Backing ratio monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Why Choose YAKA PIE */}
      <div className="relative z-10 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-16 text-yellow-400">
            Why YAKA PIE?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl p-8 mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-400/30">
                <div className="text-6xl mb-4">🛡️</div>
                <h4 className="text-2xl font-black text-green-400 mb-3">UNBREAKABLE</h4>
                <p className="text-gray-200">Mathematically impossible for price to decrease. Smart contract enforced.</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl p-8 mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-400/30">
                <div className="text-6xl mb-4">💎</div>
                <h4 className="text-2xl font-black text-blue-400 mb-3">DIAMOND HANDS</h4>
                <p className="text-gray-200">Built for long-term holding with absolute confidence and security.</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-2xl p-8 mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-400/30">
                <div className="text-6xl mb-4">🚀</div>
                <h4 className="text-2xl font-black text-purple-400 mb-3">LEVERAGE POWER</h4>
                <p className="text-gray-200">Earn more LARRY through smart leverage while staying protected.</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-2xl p-8 mb-4 group-hover:scale-110 transition-transform duration-300 border border-pink-400/30">
                <div className="text-6xl mb-4">🌟</div>
                <h4 className="text-2xl font-black text-pink-400 mb-3">MEME REVOLUTION</h4>
                <p className="text-gray-200">First meme coin that actually delivers on its promises with real utility.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-12 border border-yellow-400/30 shadow-2xl text-center">
          <h2 className="text-4xl font-black mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Ready to YAKA PIE? 🚀
          </h2>

          <p className="text-2xl text-gray-200 mb-8 leading-relaxed">
            Join the revolution of meme coins that actually work. YAKA PIE combines the fun of memes
            with the security of DeFi and the certainty of mathematical price protection.
          </p>

          <div className="bg-black/50 rounded-2xl p-8 border border-yellow-400/20 mb-8">
            <div className="text-2xl font-mono font-bold text-yellow-400 mb-4">
              YAKA PIE (YKP) - The Future of Memecoins
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-400/20">
                <div className="text-green-400 font-bold mb-2">🛡️ PRICE PROTECTION</div>
                <div className="text-gray-300">Never goes down</div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-400/20">
                <div className="text-blue-400 font-bold mb-2">💰 FULLY BACKED</div>
                <div className="text-gray-300">100% LARRY collateral</div>
              </div>
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-400/20">
                <div className="text-purple-400 font-bold mb-2">🚀 LEVERAGE READY</div>
                <div className="text-gray-300">Advanced DeFi features</div>
              </div>
            </div>
          </div>

          <div className="text-lg text-gray-400">
            <p className="mb-2">Built on SEI Network • Smart Contract Protected • Mathematically Secure</p>
            <p className="text-yellow-400 font-bold">The world&apos;s first non-decreasing meme coin that actually delivers! 🌟</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">YAKA PIE (YKP)</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The world&apos;s first meme coin that can never go down in price, fully backed by LARRY tokens,
              with advanced leverage and borrowing features. Built on SEI Network with mathematical certainty.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>Built on SEI Network</span>
            <span>•</span>
            <span>Fully Backed by LARRY</span>
            <span>•</span>
            <span>Smart Contract Protected</span>
            <span>•</span>
            <span>Price Floor Enforced</span>
            <span>•</span>
            <span>Mathematical Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
