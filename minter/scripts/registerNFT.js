// const _ = require('lodash');
const ethers = require('ethers');

/**
 * register NFT
 * @param {import("ethers").Contract} contractIns contract instance
 * @param {import("ethers").providers.JsonRpcProvider} rpcProvider rpc provider
 */
module.exports = function(contractIns, rpcProvider) {
	const sender = process.env.ADMIN_ADDRESS;
	return async function(id, hash) {
		const nonceStart = await rpcProvider.getTransactionCount(sender);
		console.log(`Sender Address(${sender}) Start Nonce: ${nonceStart}`);
		const estimatedGasPrice = await rpcProvider.getGasPrice();
		console.log(`GasPrice: ${estimatedGasPrice.toString()}`);

		const tx = await contractIns.create(ethers.BigNumber.from(id), String(hash), {
			gasPrice: ethers.BigNumber.from(Math.ceil(estimatedGasPrice.toNumber() * 1.1)),
			nonce: nonceStart,
		});
		console.log(`Tx Sent [Nonce: ${nonceStart}] hash: ${tx.hash}`);
		const result = await tx.wait();
		if (result) {
			console.log(`Tx InBlock [Nonce: ${nonceStart}] Block: ${result.blockNumber} status: ${result.status}`);
		}
		return result;
	};
};
