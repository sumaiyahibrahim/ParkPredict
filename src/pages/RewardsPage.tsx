import React from 'react';
import { useApp } from '../context/AppContext';
import { Gift, Zap, TrendingDown, Award, Sparkles, Check, ArrowRight } from 'lucide-react';

export const RewardsPage: React.FC = () => {
  const { user, showToast } = useApp();

  const handleRedeem = (name: string, cost: number) => {
    if (user.ecoPoints < cost) {
      showToast(`You need ${cost} EcoPoints to unlock this perk.`, 'warning');
      return;
    }
    showToast(`Perk unlocked: ${name}! Code active for your next booking.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            EcoRewards Mobility Club
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl">
            {user.ecoPoints} EcoPoints Available
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md">
            Earn points every time you park off-peak, charge an electric vehicle, or arrive during green prediction windows.
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center relative z-10">
          <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-1">
            Current Tier
          </span>
          <div className="text-xl font-heading font-black text-white">
            {user.loyaltyTier}
          </div>
          <span className="text-[10px] text-emerald-100 block mt-0.5">
            {user.tripsCount} Completed Smart Trips
          </span>
        </div>
      </div>

      {/* How To Earn EcoPoints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">EV Smart Charging</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn +50 EcoPoints each time you reserve an EV rapid charging slot.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Off-Peak Parking</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn +30 EcoPoints by arriving before or after peak congestion hours.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Spot Verification</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn +15 EcoPoints by verifying spot cleanliness & accuracy after parking.
          </p>
        </div>
      </div>

      {/* Available Rewards Vouchers */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
          Redeemable Rewards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: '1-Hour Free Off-Peak Parking',
              cost: 150,
              desc: 'Valid on weekday mornings before 11:30 AM at any participating Chennai deck.',
              code: 'ECO1HR',
            },
            {
              title: '₹50 FastTag Recharge Credit',
              cost: 250,
              desc: 'Direct auto-credit applied to your linked vehicle FastTag account.',
              code: 'FASTTAG50',
            },
            {
              title: 'Free EV Top-Up Session (15 kWh)',
              cost: 300,
              desc: 'Complimentary DC fast charging voucher at VR Mall or Phoenix Marketcity.',
              code: 'FREECHARGE',
            },
            {
              title: 'Weekend Mall Parking Pass (25% Off)',
              cost: 200,
              desc: 'Save 25% on Saturday or Sunday multi-level deck reservations.',
              code: 'WEEKEND25',
            },
          ].map((perk, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-[#111C2D] border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    {perk.title}
                  </h4>
                  <span className="text-xs font-bold text-brandTeal bg-brandTeal/10 px-2.5 py-1 rounded-full">
                    {perk.cost} pts
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {perk.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Promo: {perk.code}</span>
                <button
                  onClick={() => handleRedeem(perk.title, perk.cost)}
                  className="px-4 py-2 rounded-xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal"
                >
                  Redeem Voucher
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
