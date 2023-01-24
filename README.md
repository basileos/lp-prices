# lp-prices
 - web3 utility library, that calculates Uniswap v2, PancakeStableLP liquidity pair price
 - It needs some starting point price, e.g. to calculate USDT-WCRO pair price, you have to provide known price, usually it's stable coin price from reliable source.
 - Accuracy directly depends on number of provided prices and pairs 

## Usage
### Uniswap V2 LP price
```ts
const prices = await calculatePrices({
    RPC_URL: "https://evm-cronos.crypto.org",
    MULTICALL_CONTRACT_ADDRESS: "0x1f3a7C91710C5d1Cc8ECBAC88c7F73A23ff90599",
    knownPrices: {'usd-coin': 1.0025238795902849},
    liquidityPairs: [
        {
            "id": "usdc-wcro",
            "address": "0x0625A68D25d304aed698c806267a4e369e8Eb12a",
            "decimals": "1e18",
            "token0": {
                "id": "wrapped-cro",
                "address": "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23",
                "decimals": "1e18"
            },
            "token1": {
                "id": "usd-coin",
                "address": "0xc21223249ca28397b4b6541dffaecc539bff0c59",
                "decimals": "1e6"
            }
        } as LiquidityPair
    ]
});
```

### PancakeStableLP price
```ts
const prices = await calculatePricesByPancakeStableLPAddresses({
    RPC_URL: "https://bsc-dataseed.binance.org",
    MULTICALL_CONTRACT_ADDRESS: "0xab18f375d0bf2362e9e6af5c2f3d6f9624ba8f37",
    knownPrices: {'USDT': 1.0070314767133395},
    liquidityPairAddresses: [
        {
            stableSwapRouterAddress: "0x169f653a54acd441ab34b73da9946e2c451787ef",
            LPAddress: "0x36842f8fb99d55477c0da638af5ceb6bbf86aa98"
        },//usdt-busd
        {
            stableSwapRouterAddress: "0x3EFebC418efB585248A0D2140cfb87aFcc2C63DD",
            LPAddress: "0xee1bcc9F1692E81A281b3a302a4b67890BA4be76"
        },//usdt-usdc
    ]
});
```
