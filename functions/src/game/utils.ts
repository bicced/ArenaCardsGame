import db from "../config/firebaseInit";
import { createArenaPost, getArenaUser, getWalletNFTs, sendAVAX } from "../api";
import { RAF1_CONTRACT_ADDRESS, RAF1_DECK, RAF2_CONTRACT_ADDRESS, RAF2_DECK, RAFBOT_CONTRACT_ADDRESS, RAFBOT_DECK } from "../config/gameConfigs";
import { Transaction } from '@google-cloud/firestore';
import { Game, LeaderboardEntry, NFT, Player } from "../types";

const OWNED_DECK_SIZE = 3;
const TOTAL_DECK_SIZE = 28;
const WINNER_PAYOUT_AMOUNT = 190000000000000000; // 0.19 AVAX

export const handleGame = async (fromAddress: `0x${string}`): Promise<{ message: string }> => {
  const maxRetries = 5;
  let attempt = 0;
  let success = false;

  const { twitter_pfp_url, twitter_handle, arena_uuid } = await getArenaUser(fromAddress);
  const userNFTs = await getWalletNFTs(fromAddress);

  while (attempt < maxRetries && !success) {
    try {
      await db.runTransaction(async (transaction: Transaction) => {
        const waitingGameSnapshot = await transaction.get(
          db.collection('games').where('status', '==', 'pending').limit(1)
        );

        if (waitingGameSnapshot.empty) {
          await initiateNewGame(transaction, fromAddress, twitter_handle, twitter_pfp_url, arena_uuid, userNFTs);
          return { message: 'Game initiated, waiting for opponent.' };
        } else {
          await startExistingGame(transaction, waitingGameSnapshot.docs[0], fromAddress, twitter_handle, twitter_pfp_url, arena_uuid, userNFTs);
          return { message: 'Game completed.' };
        }
      });
      success = true;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error("Transaction failed: ", error);
        return { message: 'Failed to initiate game.' };
      }
    }
  }

  if (!success) {
    console.error('Failed to initiate game.');
    return { message: 'Failed to initiate game.' };
  }

  return { message: 'Game initiated.' };
};

export const initiateNewGame = async (
  transaction: Transaction,
  fromAddress: `0x${string}`,
  twitter_handle: string,
  twitter_pfp_url: string,
  arena_uuid: string,
  userNFTs: NFT[]
): Promise<void> => {
  console.log('No waiting game found. Initiating new game.');
  const newGameRef = db.collection('games').doc();
  const newGame: Game = {
    id: newGameRef.id,
    player1: {
      address: fromAddress,
      name: twitter_handle,
      picture: twitter_pfp_url,
      arenaId: arena_uuid,
      nfts: userNFTs,
    },
    status: 'pending',
    createdAt: new Date(),
  };
  transaction.set(newGameRef, newGame);
};

export const startExistingGame = async (
  transaction: Transaction,
  gameDoc: FirebaseFirestore.QueryDocumentSnapshot,
  fromAddress: `0x${string}`,
  twitter_handle: string,
  twitter_pfp_url: string,
  arena_uuid: string,
  userNFTs: NFT[]
): Promise<void> => {
  console.log('Found waiting game. Initiating game.');
  const usedCards = new Set<string>();

  const gameData = gameDoc.data() as Game;
  const player1Data = gameData.player1;
  const player2Data = {
    address: fromAddress,
    name: twitter_handle,
    picture: twitter_pfp_url,
    arenaId: arena_uuid,
    nfts: userNFTs,
  }

  const player1Deck = generateDeck(player1Data.nfts, usedCards);
  const player1Power = calculateDeckPower(player1Deck);

  const player2Deck = generateDeck(player2Data.nfts, usedCards);
  const player2Power = calculateDeckPower(player2Deck);

  const result: 'player1' | 'player2' = player1Power > player2Power ? 'player1' : 'player2';

  const updatedGame: Partial<Game> = {
    player2: player2Data,
    player1Deck,
    player2Deck,
    player1Power,
    player2Power,
    status: 'complete',
    completedAt: new Date(),
    result
  };

  transaction.update(gameDoc.ref, updatedGame);

  await updateLeaderboard(player1Data, result === 'player1');
  await updateLeaderboard(player2Data, result === 'player2');
  await sendWinningAmount(gameDoc.id, result === 'player1' ? player1Data.address : fromAddress, WINNER_PAYOUT_AMOUNT);
  await createArenaPost(player1Data, player2Data, player1Deck, player2Deck, player1Power, player2Power, result === 'player1' ? player1Data.name : player2Data.name);
};

export async function sendWinningAmount(gameId: string, winnerAddress: `0x${string}`, amount: number) {
  const transactionRef = db.collection('transactionAttempts').doc(gameId);
  try {
    await sendAVAX(winnerAddress, amount);
    await transactionRef.set({ completed: true }, { merge: true });
    console.log('Winning amount sent successfully.');
  } catch (error) {
    console.error('Failed to send winning amount:', error);
  }
}

export const calculateDeckPower = (deck: NFT[]): number => deck.reduce((acc, nft) => acc + nft.power, 0);

export const updateLeaderboard = async (
  player: Player,
  win: boolean
): Promise<void> => {
  const playerRef = db.collection('leaderboard').doc(player.address);
  await db.runTransaction(async (transaction: Transaction) => {
    const playerDoc = await transaction.get(playerRef);

    if (!playerDoc.exists) {
      const newEntry: LeaderboardEntry = {
        name: player.name,
        picture: player.picture,
        arenaId: player.arenaId,
        score: win ? 3 : 1,
        wins: win ? 1 : 0,
        losses: win ? 0 : 1,
        total: 1,
      } as LeaderboardEntry;
      transaction.set(playerRef, newEntry);
    } else {
      const data = playerDoc.data() as LeaderboardEntry;
      const updatedEntry: Partial<LeaderboardEntry> = {
        name: player.name,
        picture: player.picture,
        arenaId: player.arenaId,
        score: win ? data.score + 3 : data.score + 1,
        wins: win ? data.wins + 1 : data.wins,
        losses: win ? data.losses : data.losses + 1,
        total: data.total + 1,
      };
      transaction.update(playerRef, updatedEntry);
    }
  });
};

export const generateDeck = (nfts: NFT[], usedCards: Set<string>): NFT[] => {
  const combinedDeckEntries = [
    ...Object.entries(RAF1_DECK).map(([tokenId, power]) => ({ tokenId, power, tokenAddress: RAF1_CONTRACT_ADDRESS })),
    ...Object.entries(RAF2_DECK).map(([tokenId, power]) => ({ tokenId, power, tokenAddress: RAF2_CONTRACT_ADDRESS })),
    ...Object.entries(RAFBOT_DECK).map(([tokenId, power]) => ({ tokenId, power, tokenAddress: RAFBOT_CONTRACT_ADDRESS })),
  ];

  nfts.forEach(nft => {
    nft.power = assignPowerToNFT(nft.token_id, nft.token_address);
    nft.imageURL = assignImageURL(nft.token_id, nft.token_address);
  });

  const sortedNFTs = nfts.sort((a, b) => b.power - a.power);
  const selectedNFTs = sortedNFTs.filter(nft => !usedCards.has(`${nft.token_address}-${nft.token_id}`)).slice(0, OWNED_DECK_SIZE);
  selectedNFTs.forEach(nft => usedCards.add(`${nft.token_address}-${nft.token_id}`));

  while (selectedNFTs.length < TOTAL_DECK_SIZE) {
    const randomIndex = Math.floor(Math.random() * combinedDeckEntries.length);
    const { tokenId, power, tokenAddress } = combinedDeckEntries[randomIndex];

    if (!usedCards.has(`${tokenAddress}-${tokenId}`)) {
      selectedNFTs.push({
        token_id: tokenId,
        token_address: tokenAddress,
        power: power,
        type: 'drawn',
        imageURL: assignImageURL(tokenId, tokenAddress),
      });
      usedCards.add(`${tokenAddress}-${tokenId}`);
    }
  }
  return selectedNFTs;
};

export const assignPowerToNFT = (tokenId: string, tokenAddress: string): number => {
  const powerMapping: { [key: string]: { [tokenId: string]: number } } = {
    [RAF1_CONTRACT_ADDRESS]: RAF1_DECK,
    [RAF2_CONTRACT_ADDRESS]: RAF2_DECK,
    [RAFBOT_CONTRACT_ADDRESS]: RAFBOT_DECK,
  };
  return powerMapping[tokenAddress]?.[tokenId] ?? 0;
};

const BASE_URL = 'https://thou-bad-difference.quicknode-ipfs.com/ipfs';
// const BASE_URL = 'https://ipfs.io/ipfs';

const IMAGE_CID = {
  RAF1: [
    'bafybeiankhvbr3qumqhj2gmqgnqbk4ugalpazfrzbnl2u65dj6tx2v3dx4',
    'bafybeibqqaa3kdn4cja2qqol4zwawvnba5bvsvepdhyz77pulbpjlvxkoq',
  ],
  RAF2: [
    'bafybeif7gqlqxfxkanye57zuv7efgtho4vff4z3rbvy25xcsi3hem3m4k4',
    'bafybeiclntfmoj3js67prt5w2o6lptekoqbfxbiqseqpqt2qedubl5rkyu',
    'bafybeidfatdm2aq4xvkhqzmgl4pv3mxjbjydhy3lxbt2jimykqng7qsdo4',
    'bafybeiarupge3w5if6nq3rcsy5kkrutqgnljglpqonv4wh4z7cxsonpm4u',
    'bafybeif5lo2amrhla3j6tcdzafh6c7dniwqkhesouy4xc3wavwohcrtvpe',
    'bafybeih67fklqcmzrq6pwfribfyfyombn3k2giqauityou4lm4ugxbl5hu',
  ],
  RAFBOT: 'bafybeib33ztzbqxzxsd7b3bqpm4uxhkgftvspzkrg7w5bk5siwjiwldtfq',
};

export const assignImageURL = (tokenId: string, tokenAddress: string): string => {
  const id = parseInt(tokenId);

  if (tokenAddress === RAF1_CONTRACT_ADDRESS) {
    return `${BASE_URL}/${IMAGE_CID.RAF1[id > 0 && id <= 200 ? 0 : 1]}/${tokenId}`;
  }
  else if (tokenAddress === RAF2_CONTRACT_ADDRESS) {
    const index = Math.ceil(id / 200) - 1;
    return `${BASE_URL}/${IMAGE_CID.RAF2[index]}/${tokenId}`;
  }
  else if (tokenAddress === RAFBOT_CONTRACT_ADDRESS) {
    return `${BASE_URL}/${IMAGE_CID.RAFBOT}/${tokenId}`;
  }

  return '';
};


