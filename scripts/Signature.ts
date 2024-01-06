import { ethers } from "hardhat";
// import { Contract, providers } from "ethers";

const provider = new ethers.JsonRpcProvider()
const abiCoder = new ethers.AbiCoder();
console.log("\n", "ethers version: ", ethers.version);

// const privateKey = '0x227dbb8586117d55284e26620bc76534dfbd2394be34cf4a09cb775d593b6f2b'; // hardhat本地网络内置账户私钥
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {

  const SignatureContract = await ethers.getContractFactory("Signature");

  console.log("\n", "部署合约...");
  const SigContract = await SignatureContract.deploy();
  console.log("合约地址:", SigContract.target);

  // console.log("\n", "设置过滤器，监听事件...")
  // const filter = SigContract.filters.recoverSignerEvent();
  // // SigContract.on(filter, (eventArgs) => {
  // SigContract.once(filter, (eventArgs) => {
  //   console.log('Event:', eventArgs);
  // });

  console.log("\n", "获取账户...")
  const [fromSigner, toSigner] = await ethers.getSigners();

  console.log("\n", "构造交易...")
  // const transaction = {
  //   // from: fromSigner.address, //交易数据不需要传递from, 可以从签名中恢复
	// 	to: toSigner.address,
	// 	value: ethers.parseEther('10'),
	// 	data: '0x',
	// 	gasLimit: '22000',
	// 	maxFeePerGas: ethers.parseUnits('20', 'gwei'),
  //   maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei'),
  //   // nonce: await provider.getTransactionCount(fromAddress), //获取真实nonce
	// 	nonce: 9527,
	// 	type: 2,
	// 	chainId: await provider.getNetwork().then(network => network.chainId)
  // }
  const transaction = {
		to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
		value: ethers.parseEther('1'),
		data: '0xE0A293E08F72454CEd99E1769c3ebd21fD2C20a1',
		gasLimit: '22000',
		maxFeePerGas: ethers.parseUnits('20', 'gwei'),
		maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei'),
		nonce: 1,
		type: 2,
		chainId: 31337, // 31337
}  
  console.log(transaction);

  console.log("\n", "交易序列化...")
  let serializedTransaction = await ethers.Transaction.from(transaction).unsignedSerialized
  console.log("交易序列化: ", serializedTransaction);

  console.log("\n", "计算交易哈希...")
  let hash = ethers.keccak256(serializedTransaction)
  console.log("交易哈希: ", hash);

  console.log("\n", "对交易哈希签名...")
  let signingKey = new ethers.SigningKey(privateKey)
  let signature = await signingKey.sign(hash)
  
  // let wallet = new ethers.Wallet(privateKey); // 创建钱包对象

  console.log("交易签名: ", signature);
  let { v, r, s } = signature
  console.log("v: ", v, "\nr: ", r, "\ns: ", s);

  //私钥签名：###############################################################
  
  // const wallet = new ethers.Wallet(privateKey); // 创建钱包对象
  // let signedTransaction = await wallet.signTransaction(transaction)

  // console.log("签名交易：\n", signedTransaction);


  //#########################################################################
  // console.log("\n", "验证签名恢复公钥...")
  // const Signer = await SigContract.recoverSigner(
  //   toAddress,
  //   value,
  //   data,
  //   nonce,
  //   chainId,
  //   signedTransaction //签名
  // );
  // console.log("恢复公钥：  ", Signer)

  // const receipt = await Signer.wait();
  // console.log('Transaction Receipt:', receipt);  
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
