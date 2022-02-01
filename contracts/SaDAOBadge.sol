// contracts/SaDAOBadge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./utils/ContextMixin.sol";

contract SaDAOBadge is ERC1155, AccessControl, Pausable, ContextMixin, ERC1155Supply {
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _base_uri;
    string private _contract_cid;
    mapping(uint256 => bytes) private _metadataHash; // ipfs hash
    mapping(uint256 => bool) private _metadataCreated; // flag for ipfs

    constructor() ERC1155("ipfs://{id}") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        _base_uri = "ipfs://";
        _contract_cid = "bafkreidvk5wppllxgfvdf3bwlom6kds4cl7il3k7lpherudy35ga6ogecq";
    }

    function uri(uint256 _tokenID)
        public
        view
        override(ERC1155)
        returns (string memory)
    {
        require(_metadataCreated[_tokenID], "id does not exist");

       return string(
           abi.encodePacked(
               _base_uri,
               _metadataHash[_tokenID]
            )
        );
    }

    function setURI(string memory newuri)
        public
        onlyRole(URI_SETTER_ROLE)
    {
        _setURI(newuri);
    }

    function _setURI(string memory newuri)
        internal
        override(ERC1155)
    {
        _base_uri = newuri;
    }

    function setContractMeta(string memory newcid)
        public
        onlyRole(URI_SETTER_ROLE)
    {
        _contract_cid = newcid;
    }

    function contractURI()
        public
        view
        returns (string memory)
    {
       return string(abi.encodePacked(_base_uri, _contract_cid));
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function create(uint256 id, string memory hash)
        public
        onlyRole(MINTER_ROLE)
    {
        require(!_metadataCreated[id], "id already used");

        _metadataHash[id] = bytes(hash);
        _metadataCreated[id] = true;
    }

    function wasCreated(uint256 id) public view returns(bool) {
        return _metadataCreated[id];
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        require(_metadataCreated[id], "id does not exist");

        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        for (uint256 i = 0; i < ids.length; i++) {
            require(_metadataCreated[ids[i]], "id does not exist");
        }

        _mintBatch(to, ids, amounts, data);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        whenNotPaused
        override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        // if OpenSea's ERC1155 Proxy Address is detected, auto-return true
       if (_operator == address(0x207Fa8Df3a17D96Ca7EA4f2893fcdCb78a304101)) {
            return true;
        }
        // otherwise, use the default ERC1155.isApprovedForAll()
        return ERC1155.isApprovedForAll(_owner, _operator);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /** @dev Meta-transactions override for OpenSea. */

    function _msgSender() internal override view returns (address) {
        return ContextMixin.msgSender();
    }
}
