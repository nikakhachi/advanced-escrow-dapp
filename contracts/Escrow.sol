// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Escrow is Ownable, AccessControl, ReentrancyGuard {
    uint8 public agentFeePercentage;
    uint public withdrawableFunds;

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    constructor(uint8 _agentFeePercentage) {
        grantRole(AGENT_ROLE, msg.sender);
        agentFeePercentage = _agentFeePercentage;
    }

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

    function initiateEscrow(
        address _buyer,
        address _seller,
        uint _amount
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument memory escrow = EscrowDocument(
            escrows.length,
            _buyer,
            _seller,
            _amount,
            EscrowStatus.PENDNG_PAYMENT,
            agentFeePercentage,
            block.timestamp,
            block.timestamp
        );
        escrows.push(escrow);
        emit EscrowInitiated(escrow);
    }

    function depositEscrow(uint _escrowId) external payable nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        require(
            escrow.buyer == msg.sender,
            "Only buyer should deposit into an escrow"
        );
        require(
            escrow.status == EscrowStatus.PENDNG_PAYMENT,
            "Escrow is not accepting payments"
        );
        require(
            escrow.amount * (escrow.agentFeePercentage / 100 + 1) == msg.value,
            "Deposit must be equal to amount including the agent fee"
        );
        escrow.status = EscrowStatus.PENDING_APPROVAL;
        escrow.updatedAt = block.timestamp;
        emit EscrowPaid(escrow.id, block.timestamp);
    }

    function ApproveEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.PENDING_APPROVAL,
            "Escrow cannot be approved"
        );
        uint agentFee = (escrow.amount * escrow.agentFeePercentage) / 100;
        escrow.status = EscrowStatus.APPROVED;
        escrow.updatedAt = block.timestamp;
        withdrawableFunds += agentFee;
        payable(escrow.seller).transfer(escrow.amount);
        emit EscrowApproved(escrow.id, block.timestamp);
    }

    function cancelEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.PENDING_APPROVAL,
            "You can only reject deposited Escrow"
        );
        escrow.status = EscrowStatus.CANCELED;
        escrow.updatedAt = block.timestamp;
        payable(escrow.buyer).transfer(escrow.amount);
        emit EscrowCanceled(_escrowId, block.timestamp);
    }

    function archiveEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.PENDNG_PAYMENT,
            "Can't archive active Escrow"
        );
        escrow.status = EscrowStatus.ARCHIVED;
        escrow.updatedAt = block.timestamp;
        emit EscrowArchived(_escrowId, block.timestamp);
    }

    function changeAgentFeePercentage(
        uint8 _newFeePercentage
    ) external onlyOwner {
        agentFeePercentage = _newFeePercentage;
        emit AgentFeePercentageUpdated(_newFeePercentage);
    }

    function withdrawFunds(uint _amount) external onlyOwner {
        require(
            _amount <= address(this).balance,
            "Not enough ETH to withdraw on contract"
        );
        require(
            _amount <= withdrawableFunds,
            "Not enough ETH in withdrawable funds"
        );
        payable(owner()).transfer(withdrawableFunds);
        emit FundsWithdrawn(withdrawableFunds);
        withdrawableFunds = 0;
    }

    function addAgent(address _agent) external onlyOwner {
        grantRole(AGENT_ROLE, _agent);
        emit AgentAdded(_agent);
    }

    function revokeAgent(address _agent) external onlyOwner {
        revokeRole(AGENT_ROLE, _agent);
        emit AgentRevoked(_agent);
    }
}
