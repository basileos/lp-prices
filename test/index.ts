import { expect } from "chai";
import {calculatePrices, calculatePricesByLPAddresses} from "../src/services/prices";

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
                }
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
});
