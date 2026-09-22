import { SEED_PARKING_LOTS } from '../../data/seedParkingLots';
import { ParkingSession } from '../../types';

export interface AssistantAction {
  label: string;
  actionType: 'view_lot' | 'reserve' | 'navigate' | 'extend_session' | 'find_car' | 'open_predictions' | 'open_bookings';
  payload?: any;
}

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actions?: AssistantAction[];
  highlightLotId?: string;
}

export class ParkingCopilotService {
  public static processQuery(
    query: string,
    activeSession: ParkingSession | null
  ): AssistantMessage {
    const q = query.toLowerCase().trim();
    const id = 'msg-' + Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Check for "Find car" / "Where is my car"
    if (q.includes('where') && (q.includes('car') || q.includes('parked')) || q.includes('find my car') || q.includes('lost my car')) {
      if (activeSession && activeSession.savedCarLocation) {
        const loc = activeSession.savedCarLocation;
        return {
          id,
          sender: 'assistant',
          text: `Your car is safely parked at **${loc.lotName}** on **Floor ${loc.floorLevel}**, Section **${loc.sectionPillar}**, Spot **${loc.spotNumber}**.\n\n` +
                (loc.notes ? `*Note recorded:* "${loc.notes}"` : ''),
          timestamp,
          actions: [
            { label: '🧭 Open Walking Compass', actionType: 'find_car' },
            { label: 'End Session', actionType: 'extend_session' }
          ]
        };
      } else if (activeSession) {
        return {
          id,
          sender: 'assistant',
          text: `You have an active session at **${activeSession.lotName}** (Spot ${activeSession.spotFloor || 'B1'} - ${activeSession.spotNumber || '14'}). Would you like to record exact pillar/floor details?`,
          timestamp,
          actions: [
            { label: 'Save Car Spot', actionType: 'find_car' }
          ]
        };
      } else {
        return {
          id,
          sender: 'assistant',
          text: `You don't have an active parking session recorded right now. Once you arrive at a parking deck, tap **Save My Parking Location** to pin your floor and bay!`,
          timestamp,
          actions: [
            { label: 'Find Nearby Parking', actionType: 'view_lot', payload: 'lot-vr-mall' }
          ]
        };
      }
    }

    // 2. Check for "Extend session" / "Remaining time"
    if (q.includes('extend') || q.includes('time left') || q.includes('more time')) {
      if (activeSession && activeSession.status === 'active') {
        const plannedEnd = new Date(activeSession.plannedEndTime);
        const minsLeft = Math.max(0, Math.round((plannedEnd.getTime() - Date.now()) / 60000));
        return {
          id,
          sender: 'assistant',
          text: `You have **${minsLeft} minutes remaining** at **${activeSession.lotName}**. The lot currently has moderate turnover, so extending your bay is permitted.`,
          timestamp,
          actions: [
            { label: 'Extend +15 Min (₹15)', actionType: 'extend_session', payload: 15 },
            { label: 'Extend +30 Min (₹25)', actionType: 'extend_session', payload: 30 },
            { label: 'Extend +1 Hour (₹45)', actionType: 'extend_session', payload: 60 }
          ]
        };
      } else {
        return {
          id,
          sender: 'assistant',
          text: `You do not have an active parking session running. You can reserve ahead or start a session when you arrive at any verified facility.`,
          timestamp,
          actions: [
            { label: 'Browse Smart Lots', actionType: 'view_lot', payload: 'lot-vr-mall' }
          ]
        };
      }
    }

    // 3. Cheap parking / VR Mall / Mall queries
    if (q.includes('vr mall') || (q.includes('cheap') && q.includes('mall'))) {
      const vrMall = SEED_PARKING_LOTS.find(l => l.id === 'lot-vr-mall')!;
      const annaTower = SEED_PARKING_LOTS.find(l => l.id === 'lot-anna-tower')!;
      return {
        id,
        sender: 'assistant',
        text: `I compared options around VR Mall Chennai:\n\n` +
              `1. **${vrMall.name}**: Direct mall access, 16 EV fast chargers, ₹50/hr. Predicted to fill up by 6:00 PM.\n` +
              `2. **${annaTower.name}**: Only 4 mins away, **₹30/hr** (Save ₹20/hr!), with **58% availability**.\n\n` +
              `Recommendation: Choose Anna Nagar Tower Park for savings, or VR Mall Smart Deck for direct undercover shopping.`,
        timestamp,
        highlightLotId: 'lot-anna-tower',
        actions: [
          { label: 'Reserve Anna Tower (₹30/hr)', actionType: 'reserve', payload: 'lot-anna-tower' },
          { label: 'View VR Mall Deck (₹50/hr)', actionType: 'view_lot', payload: 'lot-vr-mall' },
          { label: 'Check 24h Prediction', actionType: 'open_predictions', payload: 'lot-vr-mall' }
        ]
      };
    }

    // 4. EV Charging query
    if (q.includes('ev') || q.includes('electric') || q.includes('charger') || q.includes('charging')) {
      return {
        id,
        sender: 'assistant',
        text: `Found **4 high-speed EV parking hubs** in Chennai:\n\n` +
              `• **VR Mall Smart Deck**: 16 CCS2 60kW DC Fast Chargers on Level B1.\n` +
              `• **Phoenix Marketcity**: 20 Fast Chargers at Pillar P4.\n` +
              `• **OMR IT Corridor Tech Park**: 12 dedicated solar EV bays with priority access.\n` +
              `• **Chennai Airport T2 MLCP**: 24/7 chargers on Ground Floor.`,
        timestamp,
        actions: [
          { label: 'View VR Mall EV Hub', actionType: 'view_lot', payload: 'lot-vr-mall' },
          { label: 'View Phoenix EV Hub', actionType: 'view_lot', payload: 'lot-phoenix-velachery' },
          { label: 'Filter EV Spots on Map', actionType: 'view_lot' }
        ]
      };
    }

    // 5. Airport / Long term parking
    if (q.includes('airport') || q.includes('flight') || q.includes('overnight')) {
      const airport = SEED_PARKING_LOTS.find(l => l.id === 'lot-airport-t2')!;
      return {
        id,
        sender: 'assistant',
        text: `**Chennai Airport T2 MLCP** provides 24/7 covered security, automated FastTag tolling, and direct indoor skywalk connecting T1 and T2.\n\n` +
              `• **Rate:** ₹70/hr or ₹500/full day.\n` +
              `• **Prediction:** Flight waves at 7 PM create high demand; reserving at least 2 hours ahead is advised.`,
        timestamp,
        highlightLotId: airport.id,
        actions: [
          { label: 'Reserve Airport Spot', actionType: 'reserve', payload: airport.id },
          { label: 'View Airport Forecast', actionType: 'open_predictions', payload: airport.id }
        ]
      };
    }

    // 6. Cancellation / Rules / Pricing
    if (q.includes('cancel') || q.includes('rule') || q.includes('refund') || q.includes('policy')) {
      return {
        id,
        sender: 'assistant',
        text: `**ParkPredict Fair Parking Guarantee:**\n\n` +
              `• **Free Cancellation:** Cancel up to 15-30 minutes prior to scheduled arrival for a 100% instant refund.\n` +
              `• **15-Minute Grace Window:** We hold your reserved bay for 15 minutes past your arrival time without penalty.\n` +
              `• **Transparent Billing:** Zero hidden surge charges. You only pay for exact session duration.`,
        timestamp,
        actions: [
          { label: 'View My Bookings', actionType: 'open_bookings' }
        ]
      };
    }

    // Default intelligent response
    return {
      id,
      sender: 'assistant',
      text: `I'm your **ParkPredict Copilot**. I can help you find optimal spots, analyze arrival forecasts, extend active sessions, or locate your parked car.\n\nTry asking me:\n• *"Cheap parking near VR Mall for 3 hours"*\n• *"Where did I park my car?"*\n• *"Show EV chargers with high availability"*\n• *"Best time to park at Phoenix Marketcity"*`,
      timestamp,
      actions: [
        { label: 'Find Best Match Near Me', actionType: 'view_lot', payload: 'lot-anna-tower' },
        { label: 'Check Availability Predictions', actionType: 'open_predictions' }
      ]
    };
  }
}
