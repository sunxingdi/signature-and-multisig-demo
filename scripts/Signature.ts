import { ethers } from "hardhat";

console.log("\n", "ethers version: ", ethers.version);

// hardhat本地网络内置账户：0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; 

async function main() {

  console.log("\n", "部署合约...");
  const SignatureContract = await ethers.getContractFactory("Signature");
  const SigContract = await SignatureContract.deploy();
  console.log("合约地址:", SigContract.target);

  // console.log("\n", "设置过滤器，监听事件...")
  // const filter = SigContract.filters.recoverSignerEvent();
  // // SigContract.on(filter, (eventArgs) => { //实时监听
  // SigContract.once(filter, (eventArgs) => {  //只监听一次
  //   console.log('Event:', eventArgs.args);
  // });

  console.log("###############################################################")
  console.log("\n", "处理消息...")
  let _account = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
  let _tokenId = 0;
  console.log("\n", "原始消息:      ", ['address', 'uint256'], [_account, _tokenId]);

  let messageHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [_account, _tokenId])
  console.log("\n", "打包和哈希消息: ", messageHash);

  let ethSignedmessageHash = ethers.solidityPackedKeccak256(['string', 'bytes32'], ["\x19Ethereum Signed Message:\n32", messageHash])
  console.log("\n", "以太坊签名消息: ", ethSignedmessageHash);

  console.log("###############################################################")
  console.log("\n", "签名方法1：ethers.signingKey")
  let signingKey = new ethers.SigningKey(privateKey);
  console.log("\n", "signingKey地址: ", signingKey.address)

  let ethSignedmessageHashSigned = await signingKey.sign(ethSignedmessageHash);
  console.log("\n", "SigningKey签名: ", ethSignedmessageHashSigned)

  let { r, s, v } = ethSignedmessageHashSigned
  console.log("r: ", r, "\ns: ", s, "\nv: ", v)

  console.log("###############################################################")
  console.log("\n", "签名方法2：ethers.Wallet")
  const wallet = new ethers.Wallet(privateKey);
  console.log("\n", "wallet地址:    ", wallet.address)

  let messageHashSigned = await wallet.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
  console.log("\n", "Wallet签名:    ", messageHashSigned)

  console.log("###############################################################")
  console.log("\n", "签名方法3：ethers.getSigners")
  const [getSigners] = await ethers.getSigners();
  console.log("\n", "getSigners地址: ", getSigners.address)
  
  let messageHashSigned2 = await getSigners.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
  console.log("\n", "getSigners签名: ", messageHashSigned2)    

  console.log("###############################################################")
  console.log("\n", "Ethers恢复公钥...")
  const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(ethSignedmessageHash, messageHashSigned);
  console.log("\n", "Ethers恢复公钥(未压缩)：", recoveredPublicKey)
  const compressedPublicKey = ethers.computeAddress(recoveredPublicKey);
  console.log("\n", "Ethers恢复公钥(压缩后)：", compressedPublicKey)

  console.log("###############################################################")
  console.log("\n", "Solidity恢复公钥...")
  const Signer = await SigContract.recoverSigner(
    ethSignedmessageHash,
    messageHashSigned,
  );
  console.log("\n", "Solidity恢复公钥：  ", Signer)




  // const receipt = await Signer.wait();
  // console.log('Transaction Receipt:', receipt); 
  // console.log('Transaction Receipt:', receipt);  
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
