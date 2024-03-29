import BigNumber from "bignumber.js";

export type Token  = {
    id: string;
    address: string;
    decimals: string;
}

export type TokenWithBalance = Token & {
    balance: BigNumber;
}

export type LiquidityPair = Token & {
    totalSupply: never;
    token0: Token;
    token1: Token;
}

export type LiquidityPairWithBalance = LiquidityPair & {
    totalSupply: BigNumber;
    token0: TokenWithBalance;
    token1: TokenWithBalance;
}

export type CalcPricesInput  = {
    RPC_URL: string,
    MULTICALL_CONTRACT_ADDRESS: string,
    knownPrices: {},
    liquidityPairs: LiquidityPair[]
}

export type CalcPricesByAddressesInput =  Omit<CalcPricesInput, "liquidityPairs"> & {
    liquidityPairAddresses: string[];
}

export type CalcPricesByPancakeStableLPsInput =  Omit<CalcPricesInput, "liquidityPairs"> & {
    liquidityPairAddresses: { stableSwapRouterAddress: string; LPAddress: string }[];
}

export interface GetTokensInput {
    RPC_URL: string,
    MULTICALL_CONTRACT_ADDRESS: string,
    liquidityPairAddresses: string[];
}

export type GetPancakeStableTokensInput = Omit<GetTokensInput, "liquidityPairAddresses"> & {
    liquidityPairAddresses: { stableSwapRouterAddress: string; LPAddress: string }[];
}
