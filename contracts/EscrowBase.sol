// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EscrowBase is Ownable, AccessControl, ReentrancyGuard {
    uint8 public agentFeePercentage;
    uint public withdrawableFunds;

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    address[] public agentWaitlist;
    address[] public agents;

    event EscrowInitiated(EscrowDocument escrowDocument);
    event EscrowPaid(uint escrowId, uint timestamp);
    event EscrowApproved(uint escrowId, uint timestamp);
    event EscrowCanceled(uint escrowId, uint timestamp);
    event EscrowArchived(uint escrowId, uint timestamp);
    event AgentAdded(address newAgent);
    event AgentRevoked(address newAgent);
    event AgentFeePercentageUpdated(uint8 newAgentFeePercentage);
    event FundsWithdrawn(uint amount);

    enum EscrowStatus {
        PENDNG_PAYMENT,
        PENDING_APPROVAL,
        APPROVED,
        CANCELED,
        ARCHIVED
    }

    struct EscrowDocument {
        uint id;
        address buyer;
        address seller;
        uint amount;
        EscrowStatus status;
        uint8 agentFeePercentage;
        uint createdAt;
        uint updatedAt;
    }

    EscrowDocument[] escrows;

    function getAllEscrows() external view returns (EscrowDocument[] memory) {
        return escrows;
    }

    function getEscrowById(
        uint _escrowId
    ) external view returns (EscrowDocument memory) {
        return escrows[_escrowId];
    }

    function getAgents() public view returns (address[] memory) {
        return agents;
    }

    function getAgentsWaitlist() public view returns (address[] memory) {
        return agentWaitlist;
    }

    function _addressArrayContains(
        address[] memory _array,
        address _address
    ) internal pure returns (bool) {
        for (uint i = 0; i < _array.length; i++) {
            if (_array[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function applyForAgent() external nonReentrant {
        require(msg.sender != owner(), "Owner can't ask for becoming an agent");
        require(
            !_addressArrayContains(agentWaitlist, msg.sender),
            "Address is already in an agent whitelist"
        );
        require(
            !_addressArrayContains(agents, msg.sender),
            "Address is already an agent"
        );
        agentWaitlist.push(msg.sender);
    }
}
