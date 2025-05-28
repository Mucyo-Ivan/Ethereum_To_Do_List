module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 6721975,    // Gas limit used for deploys
      gasPrice: 20000000000 // 20 gwei
    }
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.0",    // Match the solidity version used in your contracts
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}