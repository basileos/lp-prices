import {
    GetPancakeStableTokensInput,
    GetTokensInput,
    LiquidityPair, LiquidityPairWithBalance,
    Token
} from "../common/types";
import {getMultiCall} from "./multicall";
const Web3 = require('web3');
import PairABI from "../abis/Pair.json";
import PancakeStableSwapABI from "../abis/PancakeStableSwap.json";
import BigNumber from "bignumber.js";

export const getLiquidityPairByAddress = async (params: GetTokensInput): Promise<LiquidityPair[]> => {
    const { RPC_URL, MULTICALL_CONTRACT_ADDRESS, liquidityPairAddresses } = params;
    const multiCall = getMultiCall(RPC_URL, MULTICALL_CONTRACT_ADDRESS);
    const lpCalls: any[] = [];
    const web3 = new Web3(RPC_URL);
    for (const liquidityPairAddress of liquidityPairAddresses) {
        const contract = new web3.eth.Contract(
            PairABI,
            liquidityPairAddress
        );
        lpCalls.push(
            ...[
                {[liquidityPairAddress]: contract.methods.decimals()},
                {[liquidityPairAddress]: contract.methods.token0()},
                {[liquidityPairAddress]: contract.methods.token1()}
            ]
        )
    }
    const results = (await multiCall.all([lpCalls]))[0];
    const lps = [];
    for (let i = 0; i < results.length; i += 3) {
        const lpAddress = Object.keys(results[i])[0];
        lps.push({
            address: lpAddress,
            decimals: `1e${results[i][lpAddress]}`,
            token0: {
                address: results[i + 1][lpAddress]
            },
            token1: {
                address: results[i + 2][lpAddress]
            }
        })
    }
    const tokenCalls: any[] = [];
    for (const lp of lps) {
        const tokenZeroContract = new web3.eth.Contract(
            PairABI,
            lp.token0.address
        );
        const tokenOneContract = new web3.eth.Contract(
            PairABI,
            lp.token1.address
        );
        tokenCalls.push(
            ...[
                {[lp.token0.address]: tokenZeroContract.methods.decimals()},
                {[lp.token0.address]: tokenZeroContract.methods.symbol()},
            ]
        );
        tokenCalls.push(
            ...[
                {[lp.token1.address]: tokenOneContract.methods.decimals()},
                {[lp.token1.address]: tokenOneContract.methods.symbol()},
            ]
        );
    }
    const tokenResults = (await multiCall.all([tokenCalls]))[0];
    const tokens: {[key: string]: Token} = {}; // TODO refactor to array, token addresses can be the same in different pairs
    for (let i = 0; i < tokenResults.length; i += 2) {
        const tokenAddress = Object.keys(tokenResults[i])[0];
        tokens[tokenAddress] = {
            address: tokenAddress,
            decimals: `1e${tokenResults[i][tokenAddress]}`,
            id: tokenResults[i + 1][tokenAddress],
        }
    }
    return lps.map((lp) => {
        const token0 = tokens[lp.token0.address];
        const token1 = tokens[lp.token1.address];
        return {
            id: `${token0.id}-${token1.id}`,
            ...lp,
            token0,
            token1

        } as LiquidityPair
    });
}

export const getPancakeStableLiquidityPairPrices = async (params: GetPancakeStableTokensInput): Promise<{[key: string]: number}> => {
    const { RPC_URL, MULTICALL_CONTRACT_ADDRESS, liquidityPairAddresses } = params;
    const multiCall = getMultiCall(RPC_URL, MULTICALL_CONTRACT_ADDRESS);
    const lpCalls: any[] = [];
    const web3 = new Web3(RPC_URL);
    for (const liquidityPair of liquidityPairAddresses) {
        const contract = new web3.eth.Contract(
            PairABI,
            liquidityPair.LPAddress
        );
        const stableSwapRouter = new web3.eth.Contract(
            PancakeStableSwapABI,
            liquidityPair.stableSwapRouterAddress
        );
        lpCalls.push(
            ...[
                {[liquidityPair.LPAddress]: contract.methods.decimals()},
                {[liquidityPair.LPAddress]: stableSwapRouter.methods.get_virtual_price()},
                {[liquidityPair.LPAddress]: stableSwapRouter.methods.coins(0)},
                {[liquidityPair.LPAddress]: stableSwapRouter.methods.coins(1)},
            ]
        )
    }
    const results = (await multiCall.all([lpCalls]))[0];
    const lps = [];
    for (let i = 0; i < results.length; i += 4) {
        const lpAddress = Object.keys(results[i])[0];
        lps.push({
            address: lpAddress,
            decimals: `1e${results[i][lpAddress]}`,
            price: new BigNumber(results[i + 1][lpAddress]),
            token0: {
                address: results[i + 2][lpAddress],
            },
            token1: {
                address: results[i + 3][lpAddress],
            }
        })
    }
    const tokenCalls: any[] = [];
    for (let i = 0; i < lps.length; i++){
        const lp = lps[i];
        const tokenZeroContract = new web3.eth.Contract(
            PairABI,
            lp.token0.address
        );
        const tokenOneContract = new web3.eth.Contract(
            PairABI,
            lp.token1.address
        );
        tokenCalls.push(
            ...[
                {[lp.token0.address]: tokenZeroContract.methods.symbol()},
                {[lp.token1.address]: tokenOneContract.methods.symbol()},
            ]
        );
    }
    const tokenResults = (await multiCall.all([tokenCalls]))[0];
    return lps.reduce((previousValue, currentValue) => {
        const token0 = tokenResults.find((item) => Object.keys(item)[0] === currentValue.token0.address);
        const token1 = tokenResults.find((item) => Object.keys(item)[0] === currentValue.token1.address);
        return {
            ...previousValue,
            [`${token0[currentValue.token0.address]}-${token1[currentValue.token1.address]}`]: currentValue.price.dividedBy(currentValue.decimals).toNumber()
        }
    }, {});
}
