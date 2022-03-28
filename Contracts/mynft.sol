//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Image {
        string name;
        string color;
        string description;
        string tokenURI;
        string price;
        string dateTime;
        address to;
    }
    Image[] public Imagelist;
    mapping(address => mapping(string => uint256)) public invetments;

    constructor() ERC721("snapper", "snap") {}

    function mintNFT(
        string memory name,
        string memory color,
        string memory description,
        string memory price,
        string memory dateTime,
        address to,
        address recipient,
        string memory tokenURI
    ) public returns (uint256) {
        _tokenIds.increment();
        Imagelist.push(
            Image(name, color, description, tokenURI, price, dateTime, to)
        );
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}

