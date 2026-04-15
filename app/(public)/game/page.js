"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { claimRandomCouponFromPool, fetchUserCoupons } from "@/lib/coupon";
import Link from "next/link";

export default function GamePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [level, setLevel] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rewardCode, setRewardCode] = useState(null);
  const [isSavingReward, setIsSavingReward] = useState(false);

  const difficultyNames = ["Beginner", "Intermediate", "Advanced", "Expert", "Impossible"];

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
    for (const [a, b, c] of lines) {
      const line = [squares[a], squares[b], squares[c]];
      if (line.filter(s => s === symbol).length === 2 && line.filter(s => s === null).length === 1) {
        return [a, b, c][line.indexOf(null)];
      }
    }
    for (const [a, b, c] of lines) {
      const line = [squares[a], squares[b], squares[c]];
      if (line.filter(s => s === opponentSymbol).length === 2 && line.filter(s => s === null).length === 1) {
        return [a, b, c][line.indexOf(null)];
      }
    }
    if (squares[4] === null) return 4;
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
    switch (currentLevel) {
      case 1: return getRandomMove(squares);
      case 2: return rand < 0.5 ? getRandomMove(squares) : getStrategicMove(squares, "O");
      case 3: return rand < 0.5 ? getStrategicMove(squares, "O") : getBestMove(squares);
      case 4: return rand < 0.25 ? getStrategicMove(squares, "O") : getBestMove(squares);
      case 5: return rand < 0.2 ? getStrategicMove(squares, "O") : getBestMove(squares);
      default: return getRandomMove(squares);
    }
  };

  // --- Game State Handlers ---
  useEffect(() => {
    if (!isXNext && !winner && !isDraw && !isCompleted && user) {
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
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner, isDraw, level, isCompleted, user]);

  const handleClick = (i) => {
    if (winner || board[i] || !isXNext || isThinking || isCompleted || !user) return;
    const nextBoard = board.slice();
    nextBoard[i] = "X";
    setBoard(nextBoard);
    setIsXNext(false);
  };

  const handleNextLevel = async () => {
    if (level < 5) {
      setLevel(level + 1);
      setBoard(Array(9).fill(null));
      setIsXNext(true);
    } else {
      setIsCompleted(true);
      await generateReward();
    }
  };

  const generateReward = async () => {
    if (!user || rewardCode) return;
    
    setIsSavingReward(true);
    try {
      // 1. Check for existing game coupons
      const existing = await fetchUserCoupons(user.id);
      const gameCoupon = existing.find(c => c.source === 'game');
      
      if (gameCoupon) {
        setRewardCode(gameCoupon.coupon_code);
      } else {
        // 2. Claim from pool OR generate new
        const claimedCode = await claimRandomCouponFromPool(user.id, 'game');
        setRewardCode(claimedCode);
      }
    } catch (err) {
      console.error("[Game] Reward error:", err);
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
    setRewardCode(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Not Logged In UI
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[80vh]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-dashed border-red-100 max-w-sm text-center">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-zinc-800 mb-4 tracking-tight">Login Required</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Please login to play the game and win exciting food coupons!
          </p>
          <Link 
            href="/login"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            LOGIN TO PLAY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-zinc-50 min-h-[80vh]">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-red-600 max-w-sm w-full relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
          <div 
            className="h-full bg-yellow-400 transition-all duration-700" 
            style={{ width: `${(level / 5) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mb-6 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Current Stage</span>
            <span className="text-xl font-black text-red-600">Level {level}/5</span>
          </div>
          <span className="bg-zinc-100 text-[10px] font-bold px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest">
            {difficultyNames[level - 1]}
          </span>
        </div>

        {/* Completion / Reward View */}
        {isCompleted && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-black text-zinc-800 mb-2">Congratulations!</h3>
            <p className="text-zinc-500 mb-6 text-sm">You've mastered the Banalata AI!</p>
            
            {isSavingReward ? (
              <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                <div className="animate-pulse text-zinc-400 font-bold">Unlocking Reward...</div>
              </div>
            ) : rewardCode ? (
              <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-400 mb-6 group relative">
                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Your Food Coupon</p>
                <div className="text-3xl font-black text-zinc-800 tracking-wider">
                  {rewardCode}
                </div>
                <div className="text-[9px] text-yellow-700 mt-2 font-medium italic">
                  *Show this code at the restaurant counter
                </div>
              </div>
            ) : null}

            <button
              onClick={restartProgress}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Status Display (During Game) */}
        {!isCompleted && (
          <div className={`text-center py-4 px-6 rounded-2xl font-black mb-8 shadow-sm transition-all duration-300 transform ${
            winner === "X" ? "bg-green-100 text-green-700 scale-105 border-2 border-green-500" :
            winner === "O" ? "bg-red-100 text-red-700" :
            isDraw ? "bg-zinc-100 text-zinc-500" :
            isThinking ? "bg-yellow-50 text-yellow-600 animate-pulse" :
            "bg-zinc-50 text-zinc-400 uppercase text-xs tracking-widest"
          }`}>
            {winner === "X" ? "YOU WON! LEVEL UP" : 
             winner === "O" ? "AI WON! TRY AGAIN" :
             isDraw ? "ITS A DRAW" :
             isThinking ? "AI IS THINKING..." :
             isXNext ? "YOUR TURN (X)" : "WAITING..."}
          </div>
        )}

        {/* Grid Board (During Game) */}
        {!isCompleted && (
          <div className={`grid grid-cols-3 gap-3 mb-8 transition-opacity duration-300 ${isThinking ? 'opacity-70' : 'opacity-100'}`}>
            {board.map((square, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={isThinking || winner || isDraw}
                className={`h-24 w-24 rounded-[1.25rem] text-4xl font-extrabold flex items-center justify-center transition-all duration-200 transform border-2 ${
                  square === "X" ? "text-red-600 bg-white border-red-500 shadow-[0_4px_0_#ef4444]" : 
                  square === "O" ? "text-zinc-800 bg-white border-zinc-300 shadow-[0_4px_0_#d4d4d8]" : 
                  "bg-zinc-50 border-zinc-100 hover:border-yellow-400 hover:scale-[1.03] active:scale-95"
                } disabled:cursor-not-allowed`}
              >
                {square}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons (During Game) */}
        {!isCompleted && (
          <div className="space-y-3">
            {winner === "X" && (
              <button
                onClick={handleNextLevel}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-[0_5px_0_#16a34a] transition-transform active:scale-95"
              >
                NEXT LEVEL →
              </button>
            )}

            {(winner === "O" || isDraw) && (
              <button
                onClick={resetLevel}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-[0_5px_0_#b91c1c] transition-transform active:scale-95"
              >
                TRY AGAIN
              </button>
            )}

            <button
              onClick={restartProgress}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 text-xs font-black py-3 rounded-2xl transition-opacity hover:opacity-80"
            >
              RESET PROGRESS
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 flex gap-4 opacity-50">
          <div className="flex items-center gap-1 text-[10px] font-bold">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> YOU (X)
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold">
             <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div> BANALATA AI (O)
          </div>
      </div>
    </div>
  );
}
