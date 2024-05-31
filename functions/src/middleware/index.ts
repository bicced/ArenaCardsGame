import * as functions from 'firebase-functions';
import { Request, Response, NextFunction } from "express";
import web3 from 'web3';

const MORALIS_STREAM_SECRET = functions.config().moralis.stream_secret;

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const providedSignature = req.headers["x-signature"];
  if (!providedSignature) {
    return res.status(400).send("Signature not provided");
  }

  const body = JSON.stringify(req.body);
  const hash = web3.utils.sha3(body + MORALIS_STREAM_SECRET);

  if (hash !== providedSignature) {
    return res.status(401).send("Invalid Signature");
  }

  return next();
};
