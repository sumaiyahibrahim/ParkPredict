/** Only display safe labels supplied by the gateway; never display raw UIDs. */
export function displayRfidVehicle(label: string | null | undefined): string {
  if (!label) return '';
  return label.slice(0, 40);
}
