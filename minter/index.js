require('dotenv').config();
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
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

// load imported json
const importedFile = fs.readFileSync(path.resolve(__dirname, 'data', process.env.IMPORTED_JSON_FILE));
/** @type {string[]} */
const importedArray = JSON.parse(importedFile);

// run
async function run() {
	const sender = process.env.ADMIN_ADDRESS;
	const nonceStart = await rpcProvider.getTransactionCount(sender);
	console.log(`Minter Address(${sender}) Start Nonce: ${nonceStart}`);
	const estimatedGasPrice = await rpcProvider.getGasPrice();
	console.log(`GasPrice: ${estimatedGasPrice.toString()}`);

	const batchAmt = 20;
	const maxLength = importedArray.length;
	for (let i = 0; i < maxLength; i += batchAmt) {
		const step = Math.min(maxLength, i + batchAmt);
		const sliced = _.slice(importedArray, i, step);
		const txs = await Promise.all(_.map(sliced, async (address, sliceIdx) => {
			const currentNonce = nonceStart + i + sliceIdx;
			console.log(`Minting for (${address}) at nonce [${currentNonce}]...`);
			const tx = await contractIns.mint(address, ethers.BigNumber.from(1), ethers.BigNumber.from(1), 0x0, {
				gasPrice: estimatedGasPrice.mul(2),
				nonce: currentNonce,
			});
			console.log(`Tx Sent [Nonce: ${currentNonce}] hash: ${tx.hash}`);
			return tx;
		}));
		await Promise.all(_.map(txs, async (tx, sliceIdx) => {
			const currentNonce = nonceStart + i + sliceIdx;
			const result = await tx.wait();
			if (result) {
				console.log(`Tx InBlock [Nonce: ${currentNonce}] Block: ${result.blockNumber} status: ${result.status}`);
			}
			return result;
		}));
		console.log(`Progress: ${i + step}/${maxLength} - ${Math.floor((i + step) / maxLength * 10000) / 100}%`);
	}
}
run();
