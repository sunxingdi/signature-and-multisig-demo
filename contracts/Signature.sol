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

    function getMessageHash(string memory _message) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    /// @param @dev 计算以太坊签名
    /// @param hash 消息
    /*
    * 遵从以太坊签名标准：https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
    * 以及`EIP191`:https://eips.ethereum.org/EIPS/eip-191`
    * 添加"\x19Ethereum Signed Message:\n32"字段，防止签名的是可执行交易。
    */
    function ethSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        // 哈希的长度为32
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    // @dev 从message和签名_signature中恢复signer地址
    function recoverSigner(
            // string memory message,
            bytes32 message,
            bytes memory _signature
        ) public pure returns (address){

        // 检查签名长度，65是标准r,s,v签名的长度
        require(_signature.length == 65, "invalid signature length");

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

        // 使用ecrecover(全局函数)：利用 message 和 r,s,v 恢复 signer 地址
        address signer  = ecrecover(message, v, r, s);

        // emit recoverSignerEvent(message,message,r,s,v,signer);

        return signer;
    }    
}