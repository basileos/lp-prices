const Web3 = require('web3');
import {MultiCall} from 'eth-multicall';

export const getMultiCall = (RPC_URL: string, multiCallAddress: string) => {
  const web3 = new Web3(RPC_URL);
  return new MultiCall(web3, multiCallAddress);
};

