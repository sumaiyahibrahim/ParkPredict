export type CopilotAction = 'activity' | 'extend' | 'predictions' | 'ev' | 'airport' | 'booking' | 'history';
export type CopilotContext = { location: string; available: number; capacity: number; vehicle: string; ev: boolean; accessible: boolean; activeParking: boolean; savedSessions: number; mappedPlaces: number; sensorSummary?: { mode: 'demo'|'live'; available: number; occupied: number; total: number; connected: boolean } };
export function answerParkingQuestion(question: string, context: CopilotContext): { text: string; action?: CopilotAction } {
  const q=question.trim().toLowerCase();
  if(/find my car|locate my car|where.*parked|find.*vehicle/.test(q)) return context.activeParking
    ? {text:'I found your active parking timer. Open My parking to see the saved lot and elapsed time. The app does not track your vehicle with GPS.',action:'activity'}
    : {text:'There is no active parking timer yet. Start one from a parking result after you park; it saves the lot and vehicle in this browser.',action:'activity'};
  if(/extend|session.*time|more time/.test(q)) return context.activeParking
    ? {text:'Your active timer can be extended by one hour from My parking. This only changes your self-reported timer; it does not extend a real reservation.',action:'extend'}
    : {text:'There is no active parking timer to extend. Start a timer from a lot card first.',action:'activity'};
  if(/cheap|cheapest|lowest price|price/.test(q)) return {text:'Open Predictions to compare the nearby listings with the 100-point ranking. Prices missing from OpenStreetMap are treated as unknown; the White Town demo rate is fictional.',action:'predictions'};
  if(/ev charger|ev charging|electric vehicle|charging station/.test(q)) return {text:'I can filter mapped listings that explicitly tag EV charging. Open Find parking and enable EV charging; missing tags do not prove that a charger is absent.',action:'ev'};
  if(/airport/.test(q)) return {text:'I can search the Puducherry Airport area. The search returns mapped parking listings and does not verify long-term access or availability.',action:'airport'};
  if(/history|previous|past parking|last park/.test(q)) return {text:`There are ${context.savedSessions} saved parking session${context.savedSessions===1?'':'s'} on this device. Open My parking to review completed sessions.`,action:'history'};
  if(/book|reserv|ticket|payment/.test(q)) return {text:'The Pondicherry lot has a preview-only sample ticket. It does not hold a bay or take payment. Use the demo booking control on the lot card.',action:'booking'};
  if(/occup|space|bay|free|avail|accuracy|accur|live|sensor|rfid|tag/.test(q)) {
    const sensors=context.sensorSummary;
    if(sensors?.total) return {text:`${sensors.mode==='demo'?'The simulated RFID demo':'The connected IoT feed'} reports ${sensors.available} empty and ${sensors.occupied} occupied of ${sensors.total} monitored bays${sensors.connected?'':' · gateway disconnected'}. The reading is occupancy only; it does not confirm a reservation.`,action:'predictions'};
    return {text:'No IoT bay readings are currently available. Mapped OpenStreetMap listings provide locations, not live occupancy. Select Demo to view sample sensors or connect the ESP32 gateway for hardware readings.',action:'predictions'};
  }
  if(/vehicle|car|suv|two.?wheel|accessible/.test(q)) return {text:`Your current demo vehicle is ${context.vehicle}${context.ev?', with EV charging requested':''}${context.accessible?', with accessible parking requested':''}. Change these needs from the vehicle profile button.`,action:'predictions'};
  return {text:`I can help with finding your parked car, extending a timer, cheap parking, EV charging, airport parking, parking history, and the White Town demo. This assistant uses keyword rules and app data; it does not call an LLM.`,action:'activity'};
}
