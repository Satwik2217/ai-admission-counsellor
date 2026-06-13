interface SlotConfig {
  openingTime: string;
  closingTime: string;
  duration: number;
  maxBookings: number;
  workingDays: number[];
}

interface ExistingBooking {
  time: string;
  count: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  maxBookings: number;
}

export function generateTimeSlots(
  date: Date,
  config: SlotConfig,
  existing: ExistingBooking[]
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  if (!config.workingDays.includes(dayOfWeek)) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const [openHour, openMin] = config.openingTime.split(":").map(Number);
  const [closeHour, closeMin] = config.closingTime.split(":").map(Number);

  const openMinutes = openHour * 60 + (openMin || 0);
  const closeMinutes = closeHour * 60 + (closeMin || 0);

  for (let m = openMinutes; m + config.duration <= closeMinutes; m += config.duration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

    const booking = existing.find((b) => b.time === timeStr);
    const bookedCount = booking?.count || 0;

    slots.push({
      time: timeStr,
      available: bookedCount < config.maxBookings,
      bookedCount,
      maxBookings: config.maxBookings,
    });
  }

  return slots;
}
