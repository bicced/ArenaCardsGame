
export interface NFT {
  token_id: string;
  token_address: `0x${string}`;
  power: number;
  type: 'drawn' | 'owned';
  imageURL?: string;
}

export interface Player {
  address: `0x${string}`;
  name: string;
  picture: string;
  arenaId: string;
  nfts: NFT[];
}

export interface Game {
  id: string;
  player1: Player;
  player2?: Player;
  player1Deck?: NFT[];
  player2Deck?: NFT[];
  player1Power?: number;
  player2Power?: number;
  status: 'pending' | 'complete';
  result?: 'player1' | 'player2';
  createdAt: Date;
  completedAt?: Date;
}

export interface LeaderboardEntry {
  name: string;
  picture: string;
  arenaId: string;
  wins: number;
  score: number;
  losses: number;
  total: number;
}
