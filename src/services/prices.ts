import {
  CalcPricesByAddressesInput, CalcPricesByPancakeStableLPsInput,
  CalcPricesInput,
  LiquidityPair,
  LiquidityPairWithBalance,
  TokenWithBalance
} from "../common/types";

import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import EventEmitter from 'events';
import {AbiItem} from "web3-utils";
import {getLiquidityPairByAddress, getPancakeStableLiquidityPairByAddress} from "./token";
import {getMultiCall} from "./multicall";
import PairABI from "../abis/Pair.json";
const eventEmitter = new EventEmitter();

const calcTokenPrice = (knownPrice: number, knownToken: TokenWithBalance, unknownToken: TokenWithBalance) => {
  const valuation = knownToken.balance.dividedBy(knownToken.decimals).multipliedBy(knownPrice);
  const price = valuation.multipliedBy(unknownToken.decimals).dividedBy(unknownToken.balance);

  return {
    price: price.toNumber(),
    weight: unknownToken.balance.dividedBy(unknownToken.decimals).toNumber(),
  };
};

const calcLpPrice = (liquidityPair: LiquidityPairWithBalance, tokenPrices: {[key: string]: number}) => {
  const lp0 = liquidityPair.token0.balance
    .multipliedBy(tokenPrices[liquidityPair.token0.id])
    .dividedBy(liquidityPair.token0.decimals);
  const lp1 = liquidityPair.token1.balance
    .multipliedBy(tokenPrices[liquidityPair.token1.id])
    .dividedBy(liquidityPair.token1.decimals);
  return lp0.plus(lp1).multipliedBy(liquidityPair.decimals).dividedBy(liquidityPair.totalSupply).toNumber();
};

const calculateLPPrices = (prices: {[key: string]: number} = {}, lps: LiquidityPairWithBalance[] = []) => {
  const lpPrices: {[key: string]: number} = {};
  const weights: {[key: string]: number} = {};
  const unsolved = lps.slice();
  let solving = true;
  while (solving) {
    solving = false;

    for (let i = unsolved.length - 1; i >= 0; i--) {
      const liquidityPair = unsolved[i];

      let knownToken: TokenWithBalance; let
        unknownToken: TokenWithBalance;
      if (liquidityPair.token0.id in prices) {
        knownToken = liquidityPair.token0;
        unknownToken = liquidityPair.token1;
      } else if (liquidityPair.token1.id in prices) {
        knownToken = liquidityPair.token1;
        unknownToken = liquidityPair.token0;
      } else {
        eventEmitter.emit("unsolved", liquidityPair.id)
        continue;
      }

      const { price, weight } = calcTokenPrice(
        prices[knownToken.id],
        knownToken,
        unknownToken,
      );
      if (weight > (weights[unknownToken.id] || 0)) {
        // eslint-disable-next-line no-param-reassign
        prices[unknownToken.id] = price;
        weights[unknownToken.id] = weight;
      }
      lpPrices[liquidityPair.id] = calcLpPrice(liquidityPair, prices);

      unsolved.splice(i, 1);
      solving = true;
    }
  }
  return {
    ...prices,
    ...lpPrices,
  };
};

const getLPsInfo = async (RPC_URL: string, MULTICALL_CONTRACT_ADDRESS: string, liquidityPairs: LiquidityPair[])=> {
  const web3 = new Web3(RPC_URL);
  const multiCall = getMultiCall(RPC_URL, MULTICALL_CONTRACT_ADDRESS);
  const calls = [];
  for (const liquidutyPair of liquidityPairs) {
    const contract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.address
    );
    const tokenZeroContract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.token0.address
    );
    const tokenOneContract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.token1.address
    );
    calls.push(
        ...[
          {[liquidutyPair.id]: contract.methods.totalSupply()},
          {[liquidutyPair.id]: tokenZeroContract.methods.balanceOf(liquidutyPair.address)},
          {[liquidutyPair.id]: tokenOneContract.methods.balanceOf(liquidutyPair.address)}
        ]
    )
  }
  const results = (await multiCall.all([calls]))[0];
  const supplyAndBalances: { [key: string]: any } = {};
  for (let i = 0; i < results.length; i += 3) {
    const lpId = Object.keys(results[i])[0];
    supplyAndBalances[lpId] = {
      totalSupply: results[i][lpId],
      token0Balance: results[i + 1][lpId],
      token1Balance: results[i + 2][lpId],
    };
  }
  return supplyAndBalances;
};

const getPancakeStableLPsInfo = async (RPC_URL: string, MULTICALL_CONTRACT_ADDRESS: string, liquidityPairs: LiquidityPair[]) => {
  const web3 = new Web3(RPC_URL);
  const multiCall = getMultiCall(RPC_URL, MULTICALL_CONTRACT_ADDRESS);
  const calls = [];
  for (const liquidutyPair of liquidityPairs) {
    const contract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.address
    );
    const tokenZeroContract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.token0.address
    );
    const tokenOneContract = new web3.eth.Contract(
        PairABI as AbiItem[],
        liquidutyPair.token1.address
    );
    calls.push(
        ...[
          {[liquidutyPair.id]: contract.methods.totalSupply()},
          {[liquidutyPair.id]: tokenZeroContract.methods.balanceOf(liquidutyPair.address)},
          {[liquidutyPair.id]: tokenOneContract.methods.balanceOf(liquidutyPair.address)}
        ]
    )
  }
  const results = (await multiCall.all([calls]))[0];
  const supplyAndBalances: { [key: string]: any } = {};
  for (let i = 0; i < results.length; i += 3) {
    const lpId = Object.keys(results[i])[0];
    supplyAndBalances[lpId] = {
      totalSupply: results[i][lpId],
      token0Balance: results[i + 1][lpId],
      token1Balance: results[i + 2][lpId],
    };
  }
  return supplyAndBalances;
};

/**
 * Calculates UniswapV2Pair token and component token prices, e.g.
 * having usdc token price as input, calculates usdc-btc and btc prices
 * @param params: CalcPricesInput
 */
export const calculatePrices = async (params: CalcPricesInput): Promise<{[key: string]: number}> => {
  const { RPC_URL, MULTICALL_CONTRACT_ADDRESS, knownPrices, liquidityPairs } = params;
  if (liquidityPairs.every((lp) => !!lp.totalSupply) ) {
    return calculateLPPrices(knownPrices, liquidityPairs as LiquidityPairWithBalance[]);
  } else {
    const lpsInfo = await getLPsInfo(RPC_URL, MULTICALL_CONTRACT_ADDRESS, liquidityPairs);
    const liquidityPairsWithBalances: LiquidityPairWithBalance[] = liquidityPairs.map((lp) => ({
      ...lp,
      totalSupply: new BigNumber(lpsInfo[lp.id].totalSupply),
      token0: {
        ...lp.token0,
        balance: new BigNumber(lpsInfo[lp.id].token0Balance),
      },
      token1: {
        ...lp.token1,
        balance: new BigNumber(lpsInfo[lp.id].token1Balance),
      },
    } as LiquidityPairWithBalance));
    return calculateLPPrices(knownPrices, liquidityPairsWithBalances);
  }

};

export const calculatePricesByLPAddresses = async (params: CalcPricesByAddressesInput): Promise<{[key: string]: number}> => {
  return calculatePrices({
    ...params,
    liquidityPairs: (await getLiquidityPairByAddress({
      RPC_URL: params.RPC_URL,
      MULTICALL_CONTRACT_ADDRESS: params.MULTICALL_CONTRACT_ADDRESS,
      liquidityPairAddresses: params.liquidityPairAddresses,
    })),
  });
}

export const calculatePricesByPancakeStableLPAddresses = async (params: CalcPricesByPancakeStableLPsInput): Promise<{[key: string]: number}> => {
  return calculatePrices({
    ...params,
    liquidityPairs: (await getPancakeStableLiquidityPairByAddress({
      RPC_URL: params.RPC_URL,
      MULTICALL_CONTRACT_ADDRESS: params.MULTICALL_CONTRACT_ADDRESS,
      liquidityPairAddresses: params.liquidityPairAddresses,
    })),
  });
}

