import db from "../config/firebaseInit";
import { Request, Response } from "express";
import { handleGame } from "./utils";

const GAME_BOT_ADDRESS = "0x4b8cd2acf930c82e49a38248b09a20ecfaec9a81"; //make lowercase in stream
const ARENA_CONTRACT_ADDRESS = "0xc605c2cf66ee98ea925b1bb4fea584b71c00cc4c"; //make lowercase in stream

const GAME_DEPOSIT_AMOUNT = 100000000000000000; // 0.1 AVAX

export const transactionDetected = async (req: Request, res: Response) => {
  console.log('Transaction detected');
  const {confirmed, txs } = req.body;

  if (confirmed) { //Work off of unconfirmed transactions for now (speed)
    console.log('Ignore confirmed transaction');
    return res.status(200).send('Success');
  }

  if (!txs || txs.length === 0) {
    console.log('No transactions found');
    return res.status(200).send('Success');
  }
    
  const { fromAddress, value, hash } = txs[0];

  console.log(`Transaction from: ${fromAddress} with value: ${value} and hash: ${hash}`);
  
  const amount = parseInt(value);

  if ([ARENA_CONTRACT_ADDRESS, GAME_BOT_ADDRESS].includes(fromAddress.toLowerCase())) { //Should be filtered by stream - if not make updates
    console.log('Ignore outgoing transaction'); 
    return res.status(200).send('Success');
  }

  if (amount !== GAME_DEPOSIT_AMOUNT) { 
    console.log('Invalid amount');
    return res.status(200).send('Success');
  }

  await handleGame(fromAddress);

  return res.status(200).send('Success');
};

export const getGames = async (req: Request, res: Response) => {
  console.log('Get Games');
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const lastVisibleId = req.query.lastVisibleId?.toString() || null;

    let query = db.collection('games')
      .orderBy('createdAt', 'desc')
      .limit(pageSize);

    if (lastVisibleId) {
      const lastVisibleSnapshot = await db.collection('games').doc(lastVisibleId).get();
      if (lastVisibleSnapshot.exists) {
        query = query.startAfter(lastVisibleSnapshot);
      }
    }

    const gamesSnapshot = await query.get();
    const games = gamesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const totalSnapshot = await db.collection('games').get();
    const total = totalSnapshot.size;

    return res.status(200).send({ data: games, total: total, lastVisibleId: games[games.length - 1]?.id || null, message: 'Success' });
  } catch (error) {
    console.error('Failed to get games:', error);
    return res.status(500).send({ message: 'Failed to get games.' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  console.log('Get Leaderboard');
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const lastVisibleId = req.query.lastVisibleId?.toString() || null;

    let query = db.collection('leaderboard')
      .orderBy('score', 'desc')
      .limit(pageSize);

    if (lastVisibleId) {
      const lastVisibleSnapshot = await db.collection('leaderboard').doc(lastVisibleId).get();
      if (lastVisibleSnapshot.exists) {
        query = query.startAfter(lastVisibleSnapshot);
      }
    }

    const leaderboardSnapshot = await query.get();
    const leaderboard = leaderboardSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const totalSnapshot = await db.collection('leaderboard').get();
    const total = totalSnapshot.size;

    return res.status(200).send({ data: leaderboard, total: total, message: 'Success' });
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return res.status(500).send({ message: 'Failed to get leaderboard.' });
  }
};


