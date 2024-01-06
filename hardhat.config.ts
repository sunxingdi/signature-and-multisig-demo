import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/accounts";

// dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      // evmVersion: "paris",
      evmVersion: "istanbul",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
