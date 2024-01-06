// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract Signature {

    event recoverSignerEvent(
        bytes32 txHash,        //交易哈希
        bytes32 ethSignedHash, //以太坊签名
        bytes32 r,
        bytes32 s,
        uint8 v,
        address signer
    );

    function encodeTransactionData(
        address to,        //目标地址
        uint256 value,     //支付ETH
        bytes memory data, //calldata
        uint256 nonce,     //交易次数
        uint256 chainid     //链ID
    ) public pure returns (bytes32) {
        bytes32 txHash =
            keccak256(
                abi.encodePacked(
                    to,
                    value,
                    keccak256(data),
                    nonce,
                    chainid
                )
            );

        return txHash;
    }


    /// @param @dev 计算以太坊签名
    /// @param hash 消息
    /*
    * 遵从以太坊签名标准：https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
    * 以及`EIP191`:https://eips.ethereum.org/EIPS/eip-191`
    * 添加"\x19Ethereum Signed Message:\n32"字段，防止签名的是可执行交易。
    */
    function toEthSignedHash(bytes32 hash) public pure returns (bytes32) {
        // 哈希的长度为32
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    // @dev 从_msgHash和签名_signature中恢复signer地址
    function recoverSigner(
            address to,
            uint256 value,
            bytes memory data,
            uint256 nonce,
            uint256 chainid,
            
            bytes memory _signature
        ) public returns (address){

        // 检查签名长度，65是标准r,s,v签名的长度
        require(_signature.length == 65, "invalid signature length");

        //交易数据编码+以太坊签名

        bytes32 txHash = encodeTransactionData (
                to,
                value,
                data,
                nonce,
                chainid
            );

        bytes32 ethSignedHash = toEthSignedHash(txHash);

        bytes32 r;
        bytes32 s;
        uint8 v;

        // 目前只能用assembly (内联汇编)来从签名中获得r,s,v的值
        assembly {
            /*
            前32 bytes存储签名的长度 (动态数组存储规则)
            add(sig, 32) = sig的指针 + 32
            等效为略过signature的前32 bytes
            mload(p) 载入从内存地址p起始的接下来32 bytes数据
            */
            // 读取长度数据后的32 bytes
            r := mload(add(_signature, 0x20))
            // 读取之后的32 bytes
            s := mload(add(_signature, 0x40))
            // 读取最后一个byte
            v := byte(0, mload(add(_signature, 0x60)))
        }

        // 使用ecrecover(全局函数)：利用 msgHash 和 r,s,v 恢复 signer 地址
        address signer  = ecrecover(ethSignedHash, v, r, s);

        emit recoverSignerEvent(txHash,ethSignedHash,r,s,v,signer);

        // return signer;
    }    
}