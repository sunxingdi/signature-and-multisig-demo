# 签名与多签原理学习

### ECDSA签名原理

签名：消息 + 私钥 + 随机数 —> 签名

验签：消息 + 签名 —> 公钥，对比公钥和签名者地址是否一致

签名分为交易签名和消息签名两种类型，原理类似，本次主要介绍消息签名。

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

### 签名详细步骤

原始消息：
```
let _account = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
let _tokenId = 0;
```

第1步：进行消息打包和哈希（bytes32）。一般消息比较大，直接对消息进行签名需要消耗更多的gas，对消息的哈希值进行签名可以节省gas。
```
let messageHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [_account, _tokenId])
```

第2步：添加以太坊消息前缀和再次哈希（bytes32）。对上一步的数据添加"\x19Ethereum Signed Message:\n"和字节长度前缀，然后再次进行哈希运算。为了防止签名是可执行的交易。



ABI在线编码：https://abi.hashex.org/

https://www.wtf.academy/solidity-application/Signature/

https://www.wtf.academy/solidity-application/MultisigWallet/

https://mirror.xyz/rbtree.eth/y2oMRSSKy3kI-fYL9P2nAmJUXhxV1P2x4vAy_7D9-MM

https://mirror.xyz/wtfacademy.eth/pVjNv3xzVoOB1AtsXNsZ01b6FZy-iVbdNZsv0qVQ7Qo

https://docs.ethers.org/v6/
https://docs.ethers.org/v5/

工具：https://app.mycrypto.com/

TODO:
1、整体签名和验签原理
2、三种签名方式对比
3、浏览器调试命令行调用小狐狸钱包签名
4、多签合约钱包原理
5、solidity函数状态修饰符影响返回值和回执场景区别
6、代码中ethersV5和V6的注意点，Migrating from v5页签查看关注点
7、补充修改代码注释