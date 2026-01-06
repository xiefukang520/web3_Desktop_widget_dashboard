export type Exchange = "binance" | "okx";
export type WatchItem = { id: string; base: string; quote: string; ex: Exchange };
export type Price = { last: number; changePct: number };
export type SymbolItem = WatchItem & { symbol: string };



