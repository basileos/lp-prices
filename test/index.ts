import { expect } from "chai";
import {
    calculatePrices,
    calculatePricesByLPAddresses,
    calculatePricesByPancakeStableLPAddresses
} from "../src/services/prices";
import {LiquidityPair} from "../src/common/types";

describe("calculatePrices", async () => {

    it("should calculate lp price from attendant token price", async () => {
        const res = await calculatePrices({
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
        expect(res).to.be.an("object");
        expect(res).to.have.all.keys("usd-coin", "usdc-wcro", "wrapped-cro");
    });
});

describe("calculatePricesByLPAddresses", async () => {
   it("should return LP and corresponding tokens info", async () => {
       const prices = await calculatePricesByLPAddresses({
           RPC_URL: "https://evm-cronos.crypto.org",
           MULTICALL_CONTRACT_ADDRESS: "0x1f3a7C91710C5d1Cc8ECBAC88c7F73A23ff90599",
           knownPrices: {'USDC': 1.0070314767133395},
           liquidityPairAddresses: [
               "0x0625A68D25d304aed698c806267a4e369e8Eb12a",//wcro-usdc
               "0x814920d1b8007207db6cb5a2dd92bf0b082bdba1",//vvs-usdc
               "0x482e0eeb877091cfca439d131321bde23ddf9bb5",//crona-usdc
               "0x722f19bd9A1E5bA97b3020c6028c279d27E4293C"//mmf-usdc
           ]
       });
       expect(prices).to.be.an("object");
   });

   it("Pancake stable LP case - should return LP and corresponding tokens info", async () => {
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
       expect(prices).to.be.an("object");
       expect(prices).to.have.all.keys("USDT-BUSD", "USDT-USDC");
   });
});
