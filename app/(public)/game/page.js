"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { claimRandomCouponFromPool, fetchUserCoupons } from "@/lib/coupon";
import Link from "next/link";

export default function GamePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Game State
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [level, setLevel] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Reward State
  const [grandPrize, setGrandPrize] = useState(null);
  const [minorRewards, setMinorRewards] = useState([]);
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [lootDropData, setLootDropData] = useState(null); // Holds the reward code to show modal

  const TOTAL_LEVELS = 10;
  const difficultyNames = [
    "Newbie", "Beginner", "Novice", // 1-3
    "Amateur", "Intermediate", "Skilled", // 4-6
    "Advanced", "Expert", "Master", // 7-9
    "Banalata AI" // 10
  ];

  // --- Auth Check ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  // --- AI Logic Section ---
  const getRandomMove = (squares) => {
    const available = squares.map((s, i) => s === null ? i : null).filter(val => val !== null);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  const getStrategicMove = (squares, symbol) => {
    const opponentSymbol = symbol === "X" ? "O" : "X";
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    
    // 1. Try to win
    for (const [a, b, c] of lines) {
      const line = [squares[a], squares[b], squares[c]];
      if (line.filter(s => s === symbol).length === 2 && line.filter(s => s === null).length === 1) {
        return [a, b, c][line.indexOf(null)];
      }
    }
    // 2. Try to block
    for (const [a, b, c] of lines) {
      const line = [squares[a], squares[b], squares[c]];
      if (line.filter(s => s === opponentSymbol).length === 2 && line.filter(s => s === null).length === 1) {
        return [a, b, c][line.indexOf(null)];
      }
    }
    // 3. Take center
    if (squares[4] === null) return 4;
    // 4. Take corners
    const corners = [0, 2, 6, 8].filter(i => squares[i] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    return getRandomMove(squares);
  };

  const minimax = (squares, depth, isMax) => {
    const res = calculateWinner(squares);
    if (res === "O") return 10 - depth;
    if (res === "X") return depth - 10;
    if (squares.every(s => s !== null)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "O";
          best = Math.max(best, minimax(squares, depth + 1, !isMax));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "X";
          best = Math.min(best, minimax(squares, depth + 1, !isMax));
          squares[i] = null;
        }
      }
      return best;
    }
  };

  const getBestMove = (squares) => {
    let bestVal = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = "O";
        let moveVal = minimax(squares, 0, false);
        squares[i] = null;
        if (moveVal > bestVal) {
          bestMove = i;
          bestVal = moveVal;
        }
      }
    }
    return bestMove;
  };

  const getComputerMove = (squares, currentLevel) => {
    const rand = Math.random();
    // 10 Levels of difficulty scaling
    if (currentLevel <= 3) {
       return getRandomMove(squares); // Easy
    } else if (currentLevel <= 6) {
       return rand < 0.5 ? getStrategicMove(squares, "O") : getRandomMove(squares); // Medium
    } else if (currentLevel <= 9) {
       return rand < 0.8 ? getBestMove(squares) : getStrategicMove(squares, "O"); // Hard
    } else {
       // Level 10: 90% Best move, 10% chance to make a slight mistake so it's beatable
       return rand < 0.9 ? getBestMove(squares) : getStrategicMove(squares, "O");
    }
  };

  // --- Game State Handlers ---
  useEffect(() => {
    if (!isXNext && !winner && !isDraw && !isCompleted && user && !lootDropData) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const move = getComputerMove(board, level);
        if (move !== null) {
          const nextBoard = board.slice();
          nextBoard[move] = "O";
          setBoard(nextBoard);
        }
        setIsXNext(true);
        setIsThinking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner, isDraw, level, isCompleted, user, lootDropData]);

  const handleClick = (i) => {
    if (winner || board[i] || !isXNext || isThinking || isCompleted || !user || lootDropData) return;
    const nextBoard = board.slice();
    nextBoard[i] = "X";
    setBoard(nextBoard);
    setIsXNext(false);
  };

  const handleNextLevelSequence = async () => {
    if (level < TOTAL_LEVELS) {
      // 30% chance for a minor loot drop
      if (Math.random() <= 0.3) {
         await generateMinorReward();
      } else {
         advanceToNextLevel();
      }
    } else {
      // Beat level 10
      setIsCompleted(true);
      await generateGrandPrize();
    }
  };

  const advanceToNextLevel = () => {
    setLevel(level + 1);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setLootDropData(null);
  };

  const generateMinorReward = async () => {
    setIsSavingReward(true);
    try {
      const claimedCoupon = await claimRandomCouponFromPool(user.id, 'game_minor');
      if (claimedCoupon) {
        const rewardObj = { code: claimedCoupon.coupon_code, text: claimedCoupon.reward_text || 'Secret Bonus' };
        setMinorRewards(prev => [...prev, rewardObj]);
        setLootDropData(rewardObj); // Show modal
      } else {
        advanceToNextLevel(); // Pool empty, skip
      }
    } catch (err) {
      console.error("Minor reward error:", err);
      advanceToNextLevel(); // Skip drop if error
    } finally {
      setIsSavingReward(false);
    }
  };

  const generateGrandPrize = async () => {
    setIsSavingReward(true);
    try {
      // Check for existing grand prize first
      const existing = await fetchUserCoupons(user.id);
      const gameGrand = existing.find(c => c.source === 'game_grand');
      
      if (gameGrand) {
        setGrandPrize({ code: gameGrand.coupon_code, text: gameGrand.reward_text || 'Grand Prize' });
      } else {
        const claimedCoupon = await claimRandomCouponFromPool(user.id, 'game_grand');
        if (claimedCoupon) {
          setGrandPrize({ code: claimedCoupon.coupon_code, text: claimedCoupon.reward_text || 'Grand Prize' });
        }
      }
    } catch (err) {
      console.error("Grand prize error:", err);
    } finally {
      setIsSavingReward(false);
    }
  };

  const resetLevel = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const restartProgress = () => {
    setLevel(1);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setIsCompleted(false);
    setGrandPrize(null);
    setMinorRewards([]);
    setLootDropData(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
      </div>
    );
  }

  // Not Logged In UI
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[80vh] bg-zinc-50">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-zinc-100 max-w-sm text-center">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            🔒
          </div>
          <h2 className="text-2xl font-black text-zinc-800 mb-4 tracking-tight">Login Required</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed font-medium">
            Please login to play the game and win exciting food coupons!
          </p>
          <Link 
            href="/login"
            className="block w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(220,38,38,0.2)] transition-all active:scale-95"
          >
            LOGIN TO PLAY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-4 bg-zinc-50 min-h-[85vh] relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-zinc-100 max-w-md w-full relative z-10">
        
        {/* Title */}
        <div className="text-center mb-6 border-b border-zinc-100 pb-4">
          <h1 className="text-xl font-black uppercase tracking-widest text-zinc-800">
            Play & Win <span className="text-red-600">Banalata</span>
          </h1>
        </div>

        {/* Progress Bar Header */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Stage {level} of {TOTAL_LEVELS}</p>
              <h2 className="text-2xl font-black text-zinc-800 leading-none">{difficultyNames[level - 1]}</h2>
            </div>
            <div className="text-right">
              {minorRewards.length > 0 && (
                <div className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                  🎁 {minorRewards.length} Found
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-500 rounded-full" 
              style={{ width: `${(level / TOTAL_LEVELS) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Completion / Reward View */}
        {isCompleted ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-6 animate-bounce drop-shadow-xl">🏆</div>
            <h3 className="text-3xl font-black text-zinc-800 mb-2 tracking-tight">Champion!</h3>
            <p className="text-zinc-500 font-medium mb-8">You beat the Banalata AI Level 10.</p>
            
            {isSavingReward ? (
              <div className="p-8 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-300 border-t-red-600 rounded-full animate-spin mb-4"></div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Unlocking Grand Prize...</div>
              </div>
            ) : grandPrize ? (
              <div className="space-y-4 mb-8">
                <div className="p-6 bg-gradient-to-br from-red-50 to-white rounded-3xl border-2 border-red-200 shadow-[0_10px_30px_rgba(220,38,38,0.1)] relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">🎁</div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 relative z-10">You Won:</p>
                  <p className="text-xl font-bold text-red-700 mb-2 relative z-10">{grandPrize.text}</p>
                  <div className="text-3xl sm:text-4xl font-black text-zinc-800 tracking-wider relative z-10">
                    {grandPrize.code}
                  </div>
                </div>

                {minorRewards.length > 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Bonus Rewards Found ({minorRewards.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {minorRewards.map((reward, idx) => (
                        <span key={idx} className="bg-white border border-yellow-200 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                          {reward.text} ({reward.code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-zinc-400 font-medium italic text-center">
                  *Show these codes at the restaurant counter to claim.
                </div>
              </div>
            ) : null}

            <button
              onClick={restartProgress}
              className="w-full bg-zinc-800 hover:bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-sm"
            >
              Play Again
            </button>
          </div>
        ) : (
          /* Game View */
          <div className="relative">
            
            {/* Loot Drop Overlay Modal */}
            {lootDropData && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl transition-all">
                <div className="text-center p-6 bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-400 rounded-3xl shadow-2xl max-w-[90%] transform scale-100 transition-transform">
                  <div className="text-5xl mb-4 animate-bounce">🎁</div>
                  <h4 className="text-xl font-black text-zinc-800 mb-1">Bonus Reward!</h4>
                  <p className="text-sm font-bold text-yellow-700 mb-4">{lootDropData.text}</p>
                  <div className="bg-white border-2 border-dashed border-yellow-300 py-3 px-4 rounded-xl text-lg font-black text-yellow-600 tracking-widest mb-6 shadow-inner">
                    {lootDropData.code}
                  </div>
                  <button 
                    onClick={advanceToNextLevel}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-3 rounded-xl shadow-md transition-transform active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Continue to Level {level + 1}
                  </button>
                </div>
              </div>
            )}

            {/* Status Display */}
            <div className={`text-center py-4 px-4 rounded-xl font-black mb-6 transition-all duration-300 transform ${
              winner === "X" ? "bg-green-50 text-green-600 border border-green-200" :
              winner === "O" ? "bg-red-50 text-red-600 border border-red-200" :
              isDraw ? "bg-zinc-100 text-zinc-500" :
              isThinking ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
              isXNext ? "bg-yellow-400 text-black shadow-md scale-105 border border-yellow-500 uppercase tracking-widest text-sm" :
              "bg-zinc-50 text-zinc-400 border border-transparent uppercase text-xs tracking-widest"
            }`}>
              {winner === "X" ? (isSavingReward ? "UNLOCKING REWARD..." : "YOU WON! LEVEL UP") : 
               winner === "O" ? "AI WON! TRY AGAIN" :
               isDraw ? "IT'S A DRAW" :
               isThinking ? "AI IS THINKING..." :
               isXNext ? "YOUR TURN (X)" : "WAITING..."}
            </div>

            {/* Mobile-Perfect Grid Board */}
            <div className={`grid grid-cols-3 gap-2 sm:gap-3 mb-6 transition-opacity duration-300 ${isThinking || isSavingReward ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
              {board.map((square, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={isThinking || winner || isDraw || isSavingReward}
                  className={`aspect-square w-full rounded-2xl text-4xl sm:text-5xl font-black flex items-center justify-center transition-all duration-200 border-2 ${
                    square === "X" ? "text-red-500 bg-red-50/50 border-red-200 shadow-[0_4px_0_rgba(254,226,226,1)]" : 
                    square === "O" ? "text-zinc-800 bg-zinc-50/50 border-zinc-200 shadow-[0_4px_0_rgba(228,228,231,1)]" : 
                    "bg-white border-zinc-100 shadow-[0_4px_0_rgba(244,244,245,1)] hover:border-red-300 hover:bg-red-50/30 active:translate-y-1 active:shadow-none"
                  } disabled:cursor-not-allowed`}
                >
                  {square}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {winner === "X" && !lootDropData && (
                <button
                  onClick={handleNextLevelSequence}
                  disabled={isSavingReward}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-transform active:scale-95 flex justify-center items-center gap-2"
                >
                  {isSavingReward ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>NEXT LEVEL <span className="text-xl leading-none">→</span></>
                  )}
                </button>
              )}

              {(winner === "O" || isDraw) && (
                <button
                  onClick={resetLevel}
                  className="w-full bg-zinc-800 hover:bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(39,39,42,0.2)] transition-transform active:scale-95"
                >
                  TRY AGAIN
                </button>
              )}

              <button
                onClick={restartProgress}
                className="w-full text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-black py-3 rounded-xl transition-all uppercase tracking-widest border border-transparent mt-2"
              >
                Reset Progress
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 flex gap-6 opacity-60">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 tracking-widest">
             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> YOU
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 tracking-widest">
             <div className="w-2 h-2 rounded-full bg-zinc-800 shadow-[0_0_8px_rgba(39,39,42,0.8)]"></div> BANALATA AI
          </div>
      </div>
    </div>
  );
}
