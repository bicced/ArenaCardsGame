import * as functions from 'firebase-functions';
import Moralis from 'moralis';
import axios from "axios";
import { EvmChain, EvmAddress } from "@moralisweb3/common-evm-utils";
import { RAF1_CONTRACT_ADDRESS, RAF2_CONTRACT_ADDRESS } from '../config/gameConfigs';
import { NFT, Player } from '../types';
import { assignPowerToNFT } from '../game/utils';
import { FetchRequest, JsonRpcProvider, Wallet } from 'ethers';

const GAME_CONTRACT_ADDRESSES = [EvmAddress.create(RAF1_CONTRACT_ADDRESS), EvmAddress.create(RAF2_CONTRACT_ADDRESS)];

const MORALIS_API_KEY = functions.config().moralis.api_key;
const BOT_PRIVATE_KEY = functions.config().bot.private_key;
const ARENA_AUTH_TOKEN = functions.config().arena.auth_token;
const QUICKNODE_API_KEY = functions.config().quicknode.api_key;
const AVALANCHE_RPC_URL = "https://still-rough-needle.avalanche-mainnet.quiknode.pro/9969ba8dd626bebfca1cd81ff6c2300ec80f2289/ext/bc/C/rpc/";

const fetchRequest = new FetchRequest(AVALANCHE_RPC_URL);
fetchRequest.setHeader("Authorization", `Bearer ${QUICKNODE_API_KEY}`);

const customHttpProvider = new JsonRpcProvider(fetchRequest);

const wallet = new Wallet(BOT_PRIVATE_KEY, customHttpProvider);

Moralis.start({apiKey: MORALIS_API_KEY});

export const getWalletNFTs = async (address: string): Promise<NFT[]> => {
  try {
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      chain: EvmChain.AVALANCHE,
      address: EvmAddress.create(address),
      tokenAddresses: GAME_CONTRACT_ADDRESSES,
      format: "decimal",
      mediaItems: false
    });
    
    return response.raw.result.map((nft: any): NFT => {
      return {
        token_id: nft.token_id,
        token_address: nft.token_address,
        type: "owned",
        power: assignPowerToNFT(nft.token_id, nft.token_address)
      }
    });
  } catch (e) {
    console.error(e);
  }
  return [];
}

export const getArenaUser = async (address: string) => {
  try {
    const response = await axios.get(`https://api.arenabook.xyz/user_info?user_address=eq.${address}`);
  
    if (response.status === 200 && response.data.length === 1) {
      const {twitter_pfp_url, twitter_handle, arena_uuid} = response.data[0];
      return {twitter_pfp_url, twitter_handle, arena_uuid};
    }
  }
  catch (err) {
    console.error('Failed to get Arena username:', err);
  }
  return {twitter_pfp_url: null, twitter_handle: address, arena_uuid: null};
}


export async function sendAVAX(address: `0x${string}`, amountInAVAX: number) {
  try {
    const amountBigInt = BigInt(amountInAVAX);

    const tx = {
      to: address,
      value: amountBigInt,
    };

    const transactionResponse = await wallet.sendTransaction(tx);
    console.log("Transaction sent:", transactionResponse.hash);

    // Wait for the transaction to be mined
    const receipt = await transactionResponse.wait();
    console.log("Transaction mined:", receipt);
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
}

export async function createArenaPost(player1: Player, player2: Player, player1Deck: NFT[], player2Deck: NFT[], player1Power: number, player2Power: number, winner: string) {
  const message = `
    Arena House of Cards new game round! \n
    @${player1.name} challenged @${player2.name}, and the one with best hand won! \n
    Congrats @${winner}, your cards are the best!
    ${player1.name} Power: ${player1Power} \n
    ${player2.name} Power: ${player2Power}
  `;

  const headers = { "Content-Type": 'application/json', "Authorization": `Bearer ${ARENA_AUTH_TOKEN}` }

  const payload = {
    content: message,
    files: [{"url": "https://i.ibb.co/98g8SXv/download-1.jpg","isLoading": false, "fileType": "image"}],
    privacyType: 0
  }

  await axios.post('https://api.starsarena.com/threads', payload, { headers: headers })
}

