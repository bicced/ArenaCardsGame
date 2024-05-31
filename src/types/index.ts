
export interface GameRecord {
  player1: Player;
  player2?: Player;
  player1Power: number;
  player2Power: number;
  player1Deck: NFT[];
  player2Deck: NFT[];
  result?: 'player1' | 'player2';
  status: Status;
}

export interface Player {
  name: string;
  picture: string;
  address: string;
  arenaId: string;
  nfts: NFT[];
}

export interface NFT {
  token_id: string;
  power: number;
  type: string;
  imageURL: string;
}

export interface GameModalProps {
  selectedGame: GameRecord;
  setShowModal: (show: boolean) => void;
}

const enum Status {
  complete = 'complete',
  pending = 'pending',
}

