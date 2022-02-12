const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

/**
 * Batch mint method
 * @param {import("ethers").Contract} contractIns contract instance
 * @param {import("ethers").providers.JsonRpcProvider} rpcProvider rpc provider
 */
module.exports = function(contractIns, rpcProvider) {
	const sender = process.env.ADMIN_ADDRESS;
	// load imported json
	const importedFile = fs.readFileSync(path.resolve(__dirname, '../data', process.env.IMPORTED_JSON_FILE));
	/** @type {string[]} */
	const importedArray = JSON.parse(importedFile);

	return async function(id) {
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
				const tx = await contractIns.mint(address, ethers.BigNumber.from(id), ethers.BigNumber.from(1), 0x0, {
					gasPrice: estimatedGasPrice.mul(1.1),
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
			console.log(`Progress: ${step}/${maxLength} - ${Math.floor((step) / maxLength * 10000) / 100}%`);
		}
	};
};
