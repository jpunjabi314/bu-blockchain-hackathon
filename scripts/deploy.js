const hre = require("hardhat");

async function main() {
  // 1. Define your constructor arguments
  // These are placeholders. You MUST change them!
  const participants = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Example address 1
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Example address 2
  ];
  const requiredAmount = hre.ethers.parseEther("0.1"); // 0.1 ETH

  // 2. Get the ContractFactory and deploy
  const GroupSavingsPool = await hre.ethers.getContractFactory("GroupSavingsPool");
  const pool = await GroupSavingsPool.deploy(participants, requiredAmount);

  await pool.waitForDeployment();

  console.log(
    `GroupSavingsPool deployed to: ${pool.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});