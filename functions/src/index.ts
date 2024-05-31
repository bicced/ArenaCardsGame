import * as functions from 'firebase-functions';
import { getGames, getLeaderboard, transactionDetected } from './game';
import cors from 'cors';
import express from 'express';
import { verifySignature } from './middleware';

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({
  origin: "*",
}))

app.use(express.json());

app.post('/transaction', [verifySignature], transactionDetected);

app.get('/games', [], getGames);

app.get('/leaderboard', [], getLeaderboard);

exports.api = functions.https.onRequest(app);