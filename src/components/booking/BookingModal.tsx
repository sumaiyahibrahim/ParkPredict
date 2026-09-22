import React, { useState } from 'react';
import { ParkingLot, Vehicle, Booking } from '../../types';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  Clock, 
  Car, 
  Zap, 
  ShieldCheck, 
  Tag, 
  Check, 
  ChevronRight, 
  ArrowRight, 
  Info 
} from 'lucide-react';

interface BookingModalProps {
  lot: ParkingLot;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ lot, onClose }) => {
  const { vehicles, user, createBooking, showToast } = useApp();

  // Booking states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('18:00');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || 'veh-temp'
  );
  const [selectedSpotFloor, setSelectedSpotFloor] = useState<string>('Level 1');
  const [selectedSpotBay, setSelectedSpotBay] = useState<string>('Bay B-14');
  const [promoCode, setPromoCode] = useState<string>('PARKSMART');
  const [isPromoApplied, setIsPromoApplied] = useState<boolean>(true);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || {
    id: 'veh-custom',
    name: 'Standard Car',
    makeModel: 'Personal Vehicle',
    plateNumber: 'TN 01 AB 1234',
    type: 'sedan',
    isEv: false,
    isDefault: true,
  };

  // Pricing calculations
  const baseRate = lot.hourlyRate;
  const durationCharge = baseRate * durationHours;
  const serviceTax = Math.round(durationCharge * 0.05); // 5% GST
  const discountAmount = isPromoApplied ? Math.min(30, Math.round(durationCharge * 0.2)) : 0;
  const totalAmount = Math.max(0, durationCharge + serviceTax - discountAmount);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'PARKSMART' || promoCode.trim().toUpperCase() === 'FIRSTTRIP') {
      setIsPromoApplied(true);
      showToast('Promo code applied successfully!', 'success');
    } else {
      showToast('Invalid promo code. Try "PARKSMART".', 'warning');
      setIsPromoApplied(false);
    }
  };

  const handleConfirmBooking = () => {
    const now = new Date();
    const [h, m] = selectedTime.split(':');
    const startObj = new Date(selectedDate);
    startObj.setHours(parseInt(h, 10), parseInt(m, 10));

    const endObj = new Date(startObj.getTime() + durationHours * 3600000);
    const expectedEndTime = endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newBooking: Booking = {
      id: 'bk-' + Date.now(),
      bookingRef: 'PP-CHN-' + Math.floor(1000 + Math.random() * 9000),
      lotId: lot.id,
      lotName: lot.name,
      lotAddress: lot.address,
      userId: user.id,
      vehicle: selectedVehicle,
      date: selectedDate,
      arrivalTime: selectedTime,
      durationHours,
      expectedEndTime,
      spotFloor: selectedSpotFloor,
      spotNumber: selectedSpotBay,
      pricing: {
        baseRate,
        durationHours,
        durationCharge,
        serviceTax,
        discountAmount,
        totalAmount,
      },
      promoCode: isPromoApplied ? promoCode.toUpperCase() : undefined,
      status: 'upcoming',
      qrCodeData: `PARKPREDICT|${lot.id}|${selectedSpotBay}|${selectedVehicle.plateNumber}`,
      createdAt: now.toISOString(),
      navigationCoordinates: lot.coordinates,
    };

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0FAF9A', '#3B82F6', '#102A43'],
      });
    } catch {
      // Ignore if canvas not available
    }

    createBooking(newBooking);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111C2D] rounded-3xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brandTeal uppercase tracking-wider">
              Guaranteed Spot Reservation
            </span>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              {lot.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Step 1: Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Arrival Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Arrival Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandTeal"
                />
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Stay Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 8].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => setDurationHours(hrs)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                    durationHours === hrs
                      ? 'bg-brandTeal border-brandTeal text-white shadow-glow-teal'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {hrs === 8 ? 'Full Day' : `${hrs} hr${hrs > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Vehicle
              </label>
              <span className="text-[11px] text-brandTeal font-medium">
                {vehicles.length} in garage
              </span>
            </div>
            <div className="space-y-2">
              {vehicles.map((veh) => (
                <label
                  key={veh.id}
                  onClick={() => setSelectedVehicleId(veh.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedVehicleId === veh.id
                      ? 'bg-brandTeal/10 border-brandTeal dark:border-brandTeal text-navy-800 dark:text-teal-200 ring-1 ring-brandTeal'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {veh.isEv ? <Zap className="w-4 h-4 text-emerald-500" /> : <Car className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {veh.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {veh.makeModel} • {veh.plateNumber}
                      </div>
                    </div>
                  </div>
                  {selectedVehicleId === veh.id && (
                    <div className="w-5 h-5 rounded-full bg-brandTeal text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Spot Preference / Zone Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Reserved Spot Assignment
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Auto-Optimized
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Floor Level</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSpotFloor}</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Designated Bay</span>
                <span className="font-bold text-brandTeal">{selectedSpotBay}</span>
              </div>
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Promo Code (e.g. PARKSMART)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-brandTeal"
              />
            </div>
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Apply
            </button>
          </div>

          {/* Itemized Price Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Parking Charge ({durationHours} hrs × ₹{baseRate}/hr)</span>
              <span>₹{durationCharge}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Facility & Service Tax (5% GST)</span>
              <span>₹{serviceTax}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Promo Discount (PARKSMART)</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
              <span>Total Payable</span>
              <span className="text-base text-brandTeal font-heading font-extrabold">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* Guarantee & Cancellation Terms */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              15-minute holding grace period guaranteed. Free cancellation up to 15 mins before arrival time.
            </span>
          </div>

        </div>

        {/* Modal Bottom Confirm CTA */}
        <div className="p-4 bg-white dark:bg-[#111C2D] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Guaranteed Price</span>
            <div className="text-xl font-heading font-extrabold text-navy-800 dark:text-white">
              ₹{totalAmount}
            </div>
          </div>

          <button
            onClick={handleConfirmBooking}
            className="px-6 py-3 rounded-2xl bg-brandTeal hover:bg-brandTeal-hover text-white text-xs font-bold transition-all shadow-glow-teal flex items-center gap-2"
          >
            <span>Confirm & Generate Pass</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
