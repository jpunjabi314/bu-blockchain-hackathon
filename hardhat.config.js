require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    // This is the default network, it runs in-memory
    hardhat: {},
    // Example config for a test network like Sepolia
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // Get this from Infura/Alchemy
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Optional: for verifying your contract on Etherscan
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};