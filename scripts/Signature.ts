import { ethers } from "hardhat";

console.log("\n", "ethers version: ", ethers.version);

// hardhat本地网络内置账户私钥，0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; 

async function main() {

  const SignatureContract = await ethers.getContractFactory("Signature");

  console.log("\n", "部署合约...");
  const SigContract = await SignatureContract.deploy();
  console.log("合约地址:", SigContract.target);

  console.log("\n", "设置过滤器，监听事件...")
  const filter = SigContract.filters.recoverSignerEvent();
  // SigContract.on(filter, (eventArgs) => {
  SigContract.once(filter, (eventArgs) => {
    console.log('Event:', eventArgs.args);
  });

  console.log("\n", "获取账户...")
  const [fromSigner, toSigner] = await ethers.getSigners();

  console.log("###############################################################")

  let _account = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
  let _tokenId = 0;
  console.log("\n", "原始消息:          ", ['address', 'uint256'], [_account, _tokenId]);

  let messageHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [_account, _tokenId])
  console.log("\n", "消息哈希:          ", messageHash);

  let ethSignedmessageHash = ethers.solidityPackedKeccak256(['string', 'bytes32'], ["\x19Ethereum Signed Message:\n32", messageHash])
  console.log("\n", "以太坊签名消息哈希: ", ethSignedmessageHash);

  //#################################################################################
  let signingKey = new ethers.SigningKey(privateKey);

  let ethSignedmessageHashSigned = await signingKey.sign(ethSignedmessageHash);
  console.log("\n", "SigningKey签名:  ", ethSignedmessageHashSigned)

  let { r, s, v } = ethSignedmessageHashSigned
  console.log("r: ", r, "\ns: ", s, "\nv: ", v)

  //#################################################################################
  const wallet = new ethers.Wallet(privateKey);
  console.log("\n", "walletAddress: ", wallet.address)

  let messageHashSigned = await wallet.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
  console.log("\n", "Wallet签名:           ", messageHashSigned)
  
  let messageHashSigned2 = await fromSigner.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
  console.log("\n", "fromSigner签名:           ", messageHashSigned2)    

  //#########################################################################
  console.log("\n", "验证签名恢复公钥...")
  const Signer = await SigContract.recoverSigner(
    ethSignedmessageHash,
    messageHashSigned,
  );
  console.log("恢复公钥：  ", Signer)

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
