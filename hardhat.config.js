require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const privateKey = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    localhost: {},
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: privateKey.split(",")
    }
  }
};
