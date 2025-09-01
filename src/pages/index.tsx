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

export default function Home() {
  return (
    <div className={`${geistSans.className} ${inter.variable} min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 text-gray-900 overflow-x-hidden relative`}>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-200/30 via-orange-200/20 to-red-200/10 animate-pulse"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-300/10 via-orange-300/5 to-red-300/5 animate-spin [animation-duration:25s]"></div>

      {/* Navigation */}
      <nav className="relative z-20 bg-white/80 backdrop-blur-md border-b border-yellow-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* YAKA PIE Logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🥧</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YAKA PIE</h1>
                <p className="text-sm text-gray-600">Never Goes Down</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-yellow-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-yellow-600 transition-colors">How It Works</a>
              <a href="#contract" className="text-gray-700 hover:text-yellow-600 transition-colors">Smart Contract</a>
              <a 
                href="https://discord.gg/8HSJQUCujU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                💬 Discord
              </a>
              <Link href="/trade" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                Trade YKP
              </Link>
            </div>

            <button className="md:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            {/* Main Logo */}
            <div className="relative mb-12">
              <div className="inline-block relative">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-2xl opacity-30 scale-110"></div>

                {/* Main logo container */}
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-yellow-200">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    {/* Main Pie Logo */}
                    <div className="text-center">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse mx-auto mb-4">
                        <span className="text-6xl sm:text-7xl">🥧</span>
                      </div>
                      <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 bg-clip-text text-transparent leading-none">
                        YAKA PIE
                      </h1>
                    </div>
                  </div>

                  {/* YKP Badge */}
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg inline-block">
                    YKP Token
                  </div>
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                The World&apos;s First Meme Coin That Can
                <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-black">
                  NEVER GO DOWN
                </span>
              </h2>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                YAKA PIE is mathematically protected against price decreases. Built on SEI Network with
                advanced DeFi features including leverage, borrowing, and full LARRY token backing.
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">🛡️</div>
                  <div className="text-sm font-semibold text-gray-900">Price Protected</div>
                  <div className="text-xs text-gray-600">Never decreases</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">💰</div>
                  <div className="text-sm font-semibold text-gray-900">LARRY Backed</div>
                  <div className="text-xs text-gray-600">100% collateral</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-600">🚀</div>
                  <div className="text-sm font-semibold text-gray-900">Leverage Ready</div>
                  <div className="text-xs text-gray-600">Up to 99% ratio</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">🌐</div>
                  <div className="text-sm font-semibold text-gray-900">SEI Network</div>
                  <div className="text-xs text-gray-600">Fast & secure</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/trade" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  <span>🚀</span>
                  Trade YKP Now
                </Link>
                <button className="border-2 border-yellow-400 text-yellow-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-50 transition-all duration-300 flex items-center justify-center gap-2">
                  <span>📖</span>
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Features Section */}
      <section id="features" className="relative z-10 bg-white/50 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              YAKA PIE combines meme culture with advanced DeFi technology for the ultimate price-protected token experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: Price Protection */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-yellow-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-bounce">
                <span className="text-2xl text-white">🛡️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Price Floor</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mathematical price protection ensures YKP can never decrease in value. Every transaction is verified.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-green-200">
                <code className="text-green-700 text-xs font-mono">
                  require(lastPrice ≤ newPrice)
                </code>
              </div>
            </div>

            {/* Feature 2: Full Backing */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-orange-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-bounce">
                <span className="text-2xl text-white">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">LARRY Backed</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                100% backed by LARRY tokens. Every YKP is fully collateralized with real, tradable assets.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-orange-200">
                <code className="text-orange-700 text-xs font-mono">
                  getBacking() + totalBorrowed
                </code>
              </div>
            </div>

            {/* Feature 3: Leverage */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-red-200">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-bounce">
                <span className="text-2xl text-white">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Leverage Loops</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Borrow LARRY against YKP collateral. Create powerful leverage positions with compounding returns.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-red-200">
                <code className="text-red-700 text-xs font-mono">
                  leverage(uint256 larry, days)
                </code>
              </div>
            </div>

            {/* Feature 4: Flash Actions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-bounce">
                <span className="text-2xl text-white">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Flash Actions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Advanced flash loan mechanics for instant position management and arbitrage opportunities.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-purple-200">
                <code className="text-purple-700 text-xs font-mono">
                  flashClosePosition()
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              How YAKA PIE Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              A simple 4-step process to start using the world&apos;s first price-protected meme coin.
            </p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-8 bg-white rounded-3xl p-8 shadow-xl border border-yellow-200">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Initialize & Buy YKP</h3>
                    <p className="text-gray-600">Get started with YAKA PIE tokens</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What happens:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Deploy contract with LARRY address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Owner sets initial liquidity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Buy YKP with LARRY (2.5% max fee)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>80% treasury, 20% burned</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Smart Contract:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="text-green-700 text-sm font-mono">
{`buy(address receiver, uint256 amount)
// Mint tokens with fee
// 80% to FEE_ADDRESS
// 20% LARRY burned
// Price protection: ✓`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 border border-green-200">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🛒</div>
                    <h4 className="font-bold text-gray-900 mb-2">Buy YKP</h4>
                    <p className="text-sm text-gray-600">Purchase YAKA PIE tokens with LARRY</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row items-center gap-8 bg-white rounded-3xl p-8 shadow-xl border border-orange-200">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Borrow LARRY with Leverage</h3>
                    <p className="text-gray-600">Create leveraged positions</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Leverage features:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>99% collateralization ratio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>3.9% APY base interest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>1-365 day loan terms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Auto-liquidation protection</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Contract function:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="text-orange-700 text-sm font-mono">
{`leverage(uint256 larry, uint256 days)
// 99% collateralization
// Interest: 3.9% + 0.1% per day
// Max 365 days
// Auto-liquidation: ✓`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-6 border border-orange-200">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🚀</div>
                    <h4 className="font-bold text-gray-900 mb-2">Leverage</h4>
                    <p className="text-sm text-gray-600">Borrow LARRY against YKP collateral</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-8 bg-white rounded-3xl p-8 shadow-xl border border-red-200">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Position</h3>
                    <p className="text-gray-600">Advanced position management tools</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Management tools:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Borrow more LARRY</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Remove excess collateral</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Repay loan partially</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Extend loan duration</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key functions:</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-red-700 text-sm font-mono">borrowMore()</code>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-red-700 text-sm font-mono">removeCollateral()</code>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-red-700 text-sm font-mono">repay()</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl p-6 border border-red-200">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h4 className="font-bold text-gray-900 mb-2">Manage</h4>
                    <p className="text-sm text-gray-600">Control your leveraged positions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col lg:flex-row items-center gap-8 bg-white rounded-3xl p-8 shadow-xl border border-purple-200">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    4
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Sell & Auto-Liquidation</h3>
                    <p className="text-gray-600">Exit positions safely with price protection</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Exit strategies:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Sell YKP for LARRY (2.5% fee)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Flash close positions instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Auto-liquidation of expired loans</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Price protection always active</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Liquidation system:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="text-purple-700 text-sm font-mono">
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

              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 border border-purple-200">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="font-bold text-gray-900 mb-2">Exit</h4>
                    <p className="text-sm text-gray-600">Sell YKP or close positions</p>
                  </div>
                </div>
              </div>
            </div>
                    </div>
        </div>
      </section>

      {/* Contract Section */}
      <section id="contract" className="relative z-10 bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Smart Contract Details
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Complete technical breakdown of YAKA PIE&apos;s advanced DeFi features and safety mechanisms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Core Functions */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Core Functions</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-yellow-700 text-sm font-mono">buy()</code>
                  <p className="text-gray-600 text-sm mt-2">Purchase YKP tokens with LARRY</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-yellow-700 text-sm font-mono">sell()</code>
                  <p className="text-gray-600 text-sm mt-2">Sell YKP for LARRY</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-yellow-700 text-sm font-mono">leverage()</code>
                  <p className="text-gray-600 text-sm mt-2">Borrow LARRY with leverage</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-yellow-700 text-sm font-mono">borrow()</code>
                  <p className="text-gray-600 text-sm mt-2">Standard borrowing function</p>
                </div>
              </div>
            </div>

            {/* Position Management */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Position Management</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-orange-700 text-sm font-mono">borrowMore()</code>
                  <p className="text-gray-600 text-sm mt-2">Increase loan amount</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-orange-700 text-sm font-mono">removeCollateral()</code>
                  <p className="text-gray-600 text-sm mt-2">Free up YKP tokens</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-orange-700 text-sm font-mono">repay()</code>
                  <p className="text-gray-600 text-sm mt-2">Pay down debt</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-orange-700 text-sm font-mono">extendLoan()</code>
                  <p className="text-gray-600 text-sm mt-2">Extend loan duration</p>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced Features</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-red-700 text-sm font-mono">flashClosePosition()</code>
                  <p className="text-gray-600 text-sm mt-2">Instant position closure</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-red-700 text-sm font-mono">closePosition()</code>
                  <p className="text-gray-600 text-sm mt-2">Standard position closure</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-red-700 text-sm font-mono">liquidate()</code>
                  <p className="text-gray-600 text-sm mt-2">Auto-liquidation engine</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-red-700 text-sm font-mono">safetyCheck()</code>
                  <p className="text-gray-600 text-sm mt-2">Price protection validation</p>
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Fee Economics</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-green-700 font-semibold">Buy Fee: 2.5% max</div>
                  <p className="text-gray-600 text-sm mt-1">80% treasury, 20% burned</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-green-700 font-semibold">Sell Fee: 2.5% max</div>
                  <p className="text-gray-600 text-sm mt-1">80% treasury, 20% burned</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-green-700 font-semibold">Leverage Fee: 10%</div>
                  <p className="text-gray-600 text-sm mt-1">Interest + minting fee</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-green-700 font-semibold">Flash Fee: 1%</div>
                  <p className="text-gray-600 text-sm mt-1">30% treasury, 10% burned</p>
                </div>
              </div>
            </div>

            {/* Safety Mechanisms */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">🛡️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Safety Mechanisms</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-blue-700 font-semibold">Price Protection</div>
                  <p className="text-gray-600 text-sm mt-1">require(lastPrice ≤ newPrice)</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-blue-700 font-semibold">99% Collateralization</div>
                  <p className="text-gray-600 text-sm mt-1">Enforced on all positions</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-blue-700 font-semibold">Auto-Liquidation</div>
                  <p className="text-gray-600 text-sm mt-1">Daily expired loan cleanup</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-blue-700 font-semibold">Reentrancy Guard</div>
                  <p className="text-gray-600 text-sm mt-1">OpenZeppelin protection</p>
                </div>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">🔧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Specs</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-purple-700 font-semibold">Solidity 0.8.28</div>
                  <p className="text-gray-600 text-sm mt-1">Latest stable compiler</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-purple-700 font-semibold">ERC20 Burnable</div>
                  <p className="text-gray-600 text-sm mt-1">OpenZeppelin standard</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-purple-700 font-semibold">SEI Network</div>
                  <p className="text-gray-600 text-sm mt-1">Fast & secure blockchain</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-purple-700 font-semibold">BUSL-1.1 License</div>
                  <p className="text-gray-600 text-sm mt-1">Business Source License</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose YAKA PIE */}
      <section className="relative z-10 bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Why Choose YAKA PIE?
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              The world&apos;s first meme coin that combines viral appeal with institutional-grade DeFi protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-white rounded-3xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-green-200">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <span className="text-4xl text-white">🛡️</span>
                </div>
                <h4 className="text-2xl font-black text-green-600 mb-4">UNBREAKABLE</h4>
                <p className="text-gray-700 leading-relaxed">
                  Mathematically impossible for price to decrease. Every transaction is protected by smart contract mathematics.
                </p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-white rounded-3xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-blue-200">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <span className="text-4xl text-white">💎</span>
                </div>
                <h4 className="text-2xl font-black text-blue-600 mb-4">DIAMOND HANDS</h4>
                <p className="text-gray-700 leading-relaxed">
                  Built for long-term holding with absolute confidence. No more worrying about price crashes or dumps.
                </p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-white rounded-3xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-purple-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <span className="text-4xl text-white">🚀</span>
                </div>
                <h4 className="text-2xl font-black text-purple-600 mb-4">LEVERAGE POWER</h4>
                <p className="text-gray-700 leading-relaxed">
                  Earn more LARRY through smart leverage positions while maintaining 99% collateralization safety.
                </p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-white rounded-3xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-pink-200">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <span className="text-4xl text-white">🌟</span>
                </div>
                <h4 className="text-2xl font-black text-pink-600 mb-4">MEME REVOLUTION</h4>
                <p className="text-gray-700 leading-relaxed">
                  First meme coin that actually delivers real utility, advanced DeFi features, and price protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-12 border border-yellow-400/30 shadow-2xl text-center">
          <h2 className="text-4xl font-black mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Ready to YAKA PIE? 🚀
          </h2>

          <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
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
      <footer className="relative z-10 bg-white border-t border-yellow-200 mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">🥧</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">YAKA PIE (YKP)</h3>
                <p className="text-gray-600">Never Goes Down</p>
              </div>
            </div>

            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              The world&apos;s first meme coin that can never go down in price, fully backed by LARRY tokens,
              with advanced leverage and borrowing features. Built on SEI Network with mathematical certainty.
            </p>

            {/* Discord Community Button */}
            <div className="mb-8">
              <a 
                href="https://discord.gg/8HSJQUCujU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <span className="text-2xl">💬</span>
                Join Discord Community
                <span className="text-sm bg-indigo-800 px-2 py-1 rounded-full">Live Chat</span>
              </a>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
              <span className="text-gray-700">Built on SEI Network</span>
              <span className="text-yellow-500">•</span>
              <span className="text-gray-700">Fully Backed by LARRY</span>
              <span className="text-yellow-500">•</span>
              <span className="text-gray-700">Smart Contract Protected</span>
              <span className="text-yellow-500">•</span>
              <span className="text-gray-700">Price Floor Enforced</span>
              <span className="text-yellow-500">•</span>
              <span className="text-gray-700">Mathematical Security</span>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-yellow-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 mb-4 md:mb-0">
                © 2025 YAKA PIE. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Privacy</a>
                <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Terms</a>
                <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
