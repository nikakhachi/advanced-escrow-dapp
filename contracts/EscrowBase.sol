// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Escrow Contract
 * @author Nika Khachiashvili
 * @dev Base contract for escrow functionality.
 */
contract EscrowBase is Ownable, AccessControl, ReentrancyGuard {
    uint8 public agentFeePercentage; /// @dev Percentage that contract takes from the escrow deposit
    uint public withdrawableFunds; /// @dev Total funds available for withdrawal

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE"); /// @dev Role identifier for agents

    address[] public agentWaitlist; /// @dev List of addresses waiting to become agents
    address[] public agents; /// @dev List of current agents

    event EscrowInitiated(EscrowDocument escrowDocument); /// @dev Event emitted when an escrow is initiated
    event EscrowPaid(uint escrowId, uint timestamp); /// @dev Event emitted when an escrow is deposited
    event EscrowApproved(uint escrowId, uint timestamp); /// @dev Event emitted when an escrow is approved
    event EscrowCanceled(uint escrowId, uint timestamp); /// @dev Event emitted when an escrow is canceled
    event EscrowArchived(uint escrowId, uint timestamp); /// @dev Event emitted when an escrow is archived
    event AgentAdded(address newAgent); /// @dev Event emitted when a new agent is added
    event AgentRevoked(address newAgent); // Event emitted when an agent is revoked
    event AgentFeePercentageUpdated(uint8 newAgentFeePercentage); /// @dev Event emitted when the agent fee percentage is updated
    event FundsWithdrawn(uint amount); /// @dev Event emitted when funds are withdrawn
    event AgentApplied(address appliedAgent); /// @dev Event emitted when an address applies to become an agent

    /// @dev Enum to describe the status of escrow
    enum EscrowStatus {
        PENDING_PAYMENT,
        PENDING_APPROVAL,
        APPROVED,
        CANCELED,
        ARCHIVED
    }

    /// @dev Escrow object struct
    struct EscrowDocument {
        uint id; // Escrow ID
        address buyer; // Buyer's address
        address seller; // Seller's address
        uint amount; // Escrow amount
        EscrowStatus status; // Current status of the escrow
        uint8 agentFeePercentage; // Agent fee percentage for the escrow
        uint createdAt; // Creation timestamp of the escrow
        uint updatedAt; // Last update timestamp of the escrow
    }

    EscrowDocument[] escrows; /// @dev Array of all escrow documents

    /**
     * @dev Returns all escrow documents.
     * @return escrows Array containing all escrows
     */
    function getAllEscrows() external view returns (EscrowDocument[] memory) {
        return escrows;
    }

    /**
     * @dev Returns the escrow document with the given ID.
     * @param _escrowId The ID of the escrow.
     * @return The EscrowDocument struct representing the escrow.
     */
    function getEscrowById(
        uint _escrowId
    ) external view returns (EscrowDocument memory) {
        return escrows[_escrowId];
    }

    /**
     * @dev Returns the list of current agents.
     * @return agents The array of addresses representing the current agents.
     */
    function getAgents() public view returns (address[] memory) {
        return agents;
    }

    /**
     * @dev Returns the list of addresses waiting to become agents.
     * @return agentWaitlist The array of addresses representing the agent waitlist.
     */
    function getAgentsWaitlist() public view returns (address[] memory) {
        return agentWaitlist;
    }

    /**
     * @dev Checks if an address is present in the given array.
     * @param _array The array to check.
     * @param _address The address to check for.
     * @return boolean True if the address is present in the array, false otherwise.
     */
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

    /**
     * @dev Allows an address to apply for becoming an agent.
     */
    function applyForAgent() external nonReentrant {
        require(msg.sender != owner(), "Owner can't ask for becoming an agent"); /// @dev Make sure owner isn't making the request
        /// @dev Make sure the msg.sender isn't already in waitlist
        require(
            !_addressArrayContains(agentWaitlist, msg.sender),
            "Address is already in an agent whitelist"
        );
        /// @dev Make sure the msg.sender isn't alreafy an agent
        require(
            !_addressArrayContains(agents, msg.sender),
            "Address is already an agent"
        );
        agentWaitlist.push(msg.sender);
        emit AgentApplied(msg.sender);
    }
}
