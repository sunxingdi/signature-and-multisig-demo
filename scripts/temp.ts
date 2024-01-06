import { ethers } from "hardhat";
// import { Contract, providers } from "ethers";

const provider = new ethers.JsonRpcProvider()
const abiCoder = new ethers.AbiCoder();
console.log("\n", "ethers version: ", ethers.version);

async function main() {

  const SignatureContract = await ethers.getContractFactory("Signature");

  console.log("\n", "部署合约...");
  const SigContract = await SignatureContract.deploy();

  console.log("合约地址:", SigContract.target);

  const txHash = "0x1bf2c0ce4546651a1a2feb457b39d891a6b83931cc2454434f39961345ac378c";

  console.log("交易编码：  ", txHash)

  console.log("\n", "以太坊签名哈希...")
  const ethSignedHash = await SigContract.toEthSignedHash(txHash);
  console.log("以太坊签名：", ethSignedHash)

  console.log("\n\n###############################################################");
  //签名方法2：###############################################################
  const privateKey = '0x227dbb8586117d55284e26620bc76534dfbd2394be34cf4a09cb775d593b6f2b'; // hardhat本地网络内置账户私钥
  const wallet = new ethers.Wallet(privateKey); // 创建钱包对象
  
  // console.log("私钥：", privateKey)
  // console.log("公钥：", wallet.address)
  // console.log("消息：", txHash)
  // console.log("以太坊签名：", ethSignedHash)

  // const msg_address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";


  // 打包信息
  const msg = ethers.keccak256("I will pay Bob 1 ETH.");

  console.log("\n\n");
  // console.log(`编码：`, abiCoder.encode(['address', 'uint256'], [msg_address, 0]));
  console.log(`消息：${msg}`);

  // 构造可签名信息
  const message = Uint8Array.from(Buffer.from(msg));

  const signedTransaction = await wallet.signMessage(msg);
  console.log("消息1:", msg);
  console.log("签名1:", signedTransaction);
  const signedTransaction2 = await wallet.signMessage(message);
  console.log("消息2:", message);  
  console.log("签名2:", signedTransaction2);

  // const signedTransaction2 = await ethers.signMessage("hello123", privateKey);
  // console.log("签名方法2：  ", signedTransaction);
  // console.log("账户地址2：  ", wallet.address)

  // ethers.recoverPublicKey(messageHash, { v, r, s });

}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
