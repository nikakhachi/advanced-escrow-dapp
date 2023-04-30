// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowBase.sol";
import "./EscrowAdmin.sol";

contract EscrowAgent is EscrowBase, EscrowAdmin {
    constructor(uint8 _agentFeePercentage) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(AGENT_ROLE, msg.sender);
        agentFeePercentage = _agentFeePercentage;
    }

    function initiateEscrow(
        address _buyer,
        address _seller,
        uint _amount
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        require(!_addressArrayContains(agents, _buyer), "Buyer is an agent");
        require(!_addressArrayContains(agents, _seller), "Seller is an agent");
        require(
            !_addressArrayContains(agentWaitlist, _buyer),
            "Buyer is in an agent waitlist"
        );
        require(
            !_addressArrayContains(agentWaitlist, _seller),
            "Seller is in an agent waitlist"
        );
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
        uint feeForAgent = (escrow.amount * escrow.agentFeePercentage) / 100;
        require(
            escrow.amount + feeForAgent == msg.value,
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
}
