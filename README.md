# 签名与多签原理学习

### ECDSA签名原理

签名：消息 + 私钥 + 随机数 —> 签名

验签：消息 + 签名 —> 公钥，对比公钥和签名者地址是否一致

签名分为交易签名和消息签名两种类型。

#### 交易签名：

签名过程：构造交易->RLP编码->哈希运算->私钥签名->打包签名->RLP编码

- 构造交易：交易结构为[chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data]。
- RLP编码：网络传输中json的序列化/反序列化方式不同，为保证交易数据传输后的编码一致性，使用RLP编码序列化方式。
- 哈希运算：使用Keccak256，输出bytes32哈希值。
- 私钥签名：使用ECDSA椭圆曲线签名算法进行私钥签名，输出(v、r、s)签名值。
- 打包签名：把交易和签名打包为[nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, v, r, s]，chainId已经被编码到v参数中，从交易数据中删除。
- RLP编码：对打包后的数据再次进行RLP编码。

验证过程：RLP解码->验证签名->对比公钥

- RLP解码：解码后的数据[nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, v, r, s]
- 验证签名：对消息[nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data]和签名[v, r, s]恢复出公钥，即签名者地址。
- 对比公钥：对比签名者与签名者公钥推导的地址是否一致。

安全问题：
- 增加chainId字段，防止跨链重放攻击。（EIP155标准）
- 增加Nonce字段，防止双花攻击。

交易类型：
- 单纯转账交易：to为目标地址，data为空。
- 部署合约交易：to为空，data合约创建字节码。
- 调用合约交易：to为合约地址，data为函数选择器+参数。
  
#### 消息签名：

签名过程：原始消息->打包和哈希->以太坊签名->私钥签名

- 原始消息：任意待签名消息
- 打包和哈希：对消息进行打包，再使用Keccak256，输出bytes32哈希值。
- 以太坊签名：添加以太坊消息前缀和再次哈希，输出bytes32哈希值。
- 私钥签名：使用ECDSA椭圆曲线签名算法进行私钥签名，输出(v、r、s)签名值。

验证过程：原始消息->打包和哈希->以太坊签名->验证签名->对比公钥

- 验证签名：使用消息和签名恢复出公钥。
- 对比公钥：对比签名者与签名者公钥推导的地址是否一致。

---

### 签名详细步骤

本次主要介绍消息签名。

原始消息：
```
let _account = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
let _tokenId = 0;
```

第1步：消息打包和哈希（bytes32）。
```
let messageHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [_account, _tokenId])
```

第2步：添加以太坊消息前缀和再次哈希（bytes32）。对上一步的数据添加"\x19Ethereum Signed Message:\n"和字节长度前缀，然后再次进行哈希运算。为了防止签名是可执行的交易。

```
let ethSignedmessageHash = ethers.solidityPackedKeccak256(['string', 'bytes32'], ["\x19Ethereum Signed Message:\n32", messageHash])
```

第3步：签名。ethers中提供了3种私钥签名方法。

- 使用ethers.signingKey签名。
  
  函数不会添加以太坊消息前缀，所以需要使用以太坊签名后的消息。

```
let signingKey = new ethers.SigningKey(privateKey);
let ethSignedmessageHashSigned = await signingKey.sign(ethSignedmessageHash);
```

- 使用ethers.Wallet签名。

  函数自动添加以太坊消息前缀，所以需要使用以太坊签名前的消息。

```
const wallet = new ethers.Wallet(privateKey);
let messageHashSigned = await wallet.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
```

- 使用ethers.getSigners签名。
  
  函数自动添加以太坊消息前缀，所以需要使用以太坊签名前的消息。

```
const [getSigners] = await ethers.getSigners();
let messageHashSigned2 = await getSigners.signMessage(Uint8Array.from(Buffer.from(messageHash.slice(2), 'hex')));
```

签名的消息由3个部分组成：signature(bytes65) = r(bytes32) + s(bytes32) + v(bytes1)

第4步：验签。使用solidity的ecrecover函数恢复公钥验签。

  函数不会添加以太坊消息前缀，所以需要使用以太坊签名后的消息。

```
address signer  = ecrecover(message, v, r, s);
```

signer是恢复出来的公钥，对比若与发送消息的地址一致，则验签OK。

---

### 函数汇总

- 打包+哈希：

  Ethers: ethers.solidityPackedKeccak256()

  Solidity: keccak256(abi.encodePacked())

- 恢复公钥：

  Ethers: ethers.SigningKey.recoverPublicKey()

  Solidity: ecrecover()

---

### metamask浏览器签名方法

metamask支持多种签名方法：

推荐方法：`personal_sign`, `eth_signTypedData_v4`

废弃方法：`eth_sign`, `eth_signTypedData_v1`, `eth_signTypedData_v3`

metamask浏览器签名方法演示：

metamask切换至对应账户，浏览器按F12打开开发者工具，在Console中输入如下命令，即可签名。

```
ethereum.enable()
message="0xdd54f25d0bbeae343a1dec3acce8dc5b3a0886bdb9c5e667f65d5bbbe11bc093"
ethereum.request({method:"personal_sign", params: [ethereum.selectedAddress, message]}).then(console.log)

打印：
0x31f898d6a67e3d8b5b1c4e8bc02313a592e0f0880856febaeba5730b5993631d484960b006dd26ba13298718cb5e7983a371afd4dd33a441612eca75f2ca79d21c
```

---

### 多签原理

理解了签名的原理后，多签就很简单了。

原理简单描述如下：

- 多签钱包是一个智能合约钱包。智能合约状态变量存储了所有多签Owner的地址和门限阈值。

- 智能合约处理逻辑：依次验证各Owner对交易的签名，验签完成数量>=门限阈值后，则验证OK，发起交易。

案例举例：

1. 创建一个2/3多签钱包，包含3个多签Owner，门限阈值为2。

2. 创建一笔交易，通知各Owner进行签名。

3. 验证各Owner的签名，当任意2个签名验证通过后，发起交易。

---

### 脚本调用

执行命令：

```
npx hardhat run .\scripts\Signature.ts --network localhost
```

打印输出：

```
ethers version:  6.9.2

部署合约...
合约地址: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
###############################################################

处理消息...

原始消息:       [ 'address', 'uint256' ] [ '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', 0 ]

打包和哈希消息:  0x1bf2c0ce4546651a1a2feb457b39d891a6b83931cc2454434f39961345ac378c

以太坊签名消息:  0xb42ca4636f721c7a331923e764587e98ec577cea1a185f60dfcc14dbb9bd900b
###############################################################

签名方法1：ethers.signingKey

signingKey地址:  undefined

SigningKey签名:  Signature { r: "0x6ae59cf47d4cfe0e7d1d13468bb6e9333c7e7894303df5549b6a0c27eb3e8605", s: "0x447627b19f79feef130a2094998c28a42e87e8ac5e0cec3936803e214ac040ab", yParity: 1, networkV: null }
r:  0x6ae59cf47d4cfe0e7d1d13468bb6e9333c7e7894303df5549b6a0c27eb3e8605 
s:  0x447627b19f79feef130a2094998c28a42e87e8ac5e0cec3936803e214ac040ab
v:  28
###############################################################

签名方法2：ethers.Wallet

wallet地址:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Wallet签名:     0x6ae59cf47d4cfe0e7d1d13468bb6e9333c7e7894303df5549b6a0c27eb3e8605447627b19f79feef130a2094998c28a42e87e8ac5e0cec3936803e214ac040ab1c
###############################################################

签名方法3：ethers.getSigners

getSigners地址:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

getSigners签名:  0x6ae59cf47d4cfe0e7d1d13468bb6e9333c7e7894303df5549b6a0c27eb3e8605447627b19f79feef130a2094998c28a42e87e8ac5e0cec3936803e214ac040ab1c
###############################################################

Ethers恢复公钥...

Ethers恢复公钥(未压缩)： 0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5

Ethers恢复公钥(压缩后)： 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
###############################################################

Solidity恢复公钥...

Solidity恢复公钥：   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

### 其他知识

#### solidity

函数中若存在状态描述符：pure/view/payable, 调用函数获取返回值。

函数中不存在状态描述符：pure/view/payable, 调用函数获取交易回执。

#### EthersV5 VS EthersV6

ethers v6版本接口变更很大，可从v6官方文档中Migrating from v5章节查看具体变更点。

---

### 参考文档

[ABI 在线编码](https://abi.hashex.org/)

[EthersV5 官方文档](https://docs.ethers.org/v5/)

[EthersV6 官方文档](https://docs.ethers.org/v6/)

[MetaMask 签名方法](https://docs.metamask.io/wallet/concepts/signing-methods/)

[WTF Solidity极简入门: 37. 数字签名](https://www.wtf.academy/solidity-application/Signature/)

[WTF Solidity极简入门: 50. 多签钱包](https://www.wtf.academy/solidity-application/MultisigWallet/)

[以太坊上的几种签名: eth_sign, personal_sign, eth_signTypedData](https://mirror.xyz/rbtree.eth/y2oMRSSKy3kI-fYL9P2nAmJUXhxV1P2x4vAy_7D9-MM)
