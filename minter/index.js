require('dotenv').config();
const ethers = require('ethers');

const isTestnet = process.env.NETWORK === 'testnet';

// init signer
const rpcProvider = new ethers.providers.JsonRpcProvider({
	url: `https://polygon-${isTestnet ? 'mumbai' : 'mainnet'}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
	user: '',
	password: process.env.INFURA_PROJECT_SECRET,
});
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, rpcProvider);

// init contract
const CONTRACT_ADDRESS = isTestnet
	? '0x183fAa87F04fF47DDb3eAF0a4975545d80bd291a'
	: '0xFb1cf58656b90e23e226e3D584aF56585E1531E6';
const CONTRACT_ABI = require('./json/SaDAOBadge.abi.json');
const contractIns = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// run
async function run() {
	require('./scripts/batchMint')(contractIns, rpcProvider);
}
run();
