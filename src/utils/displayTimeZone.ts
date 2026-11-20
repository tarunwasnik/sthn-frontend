let activeDisplayTimeZone: string | null = null;

export function setActiveDisplayTimeZone(timeZone: string | null): void {
  activeDisplayTimeZone = timeZone;
}

export function getActiveDisplayTimeZone(): string | undefined {
  return activeDisplayTimeZone ?? undefined;
}
