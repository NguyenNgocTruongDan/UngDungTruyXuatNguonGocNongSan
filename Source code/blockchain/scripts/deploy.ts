import { ethers } from 'hardhat';

async function main() {
  const contractName = process.env.CONTRACT_NAME || 'Traceability';

  console.log(`Deploying ${contractName} contract...\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('Deployer:', deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  const factory = await ethers.getContractFactory(contractName);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log(`${contractName} deployed to:`, address);
  console.log('\nSave this address to the API .env file:');
  console.log(`CONTRACT_ADDRESS=${address}`);

  if (contractName !== 'Traceability') {
    console.log(
      '\nWarning: the current API is wired to Traceability.sol ABI and methods.'
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
