// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowBase.sol";
import "./EscrowAdmin.sol";

/**
 * @title Escrow Contract
 * @author Nika Khachiashvili
 * @dev Contract representing an escrow agent with additional administrative functions.
 */
contract EscrowAgent is EscrowBase, EscrowAdmin {
    /**
     * @dev Constructor function.
     * @param _agentFeePercentage The agent fee percentage.
     * @notice Sets the contract deployer as the default admin and agent and sets the fee percentage.
     */
    constructor(uint8 _agentFeePercentage) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(AGENT_ROLE, msg.sender);
        agentFeePercentage = _agentFeePercentage;
    }

    /**
     * @dev Initiates an escrow.
     * @param _buyer The address of the buyer.
     * @param _seller The address of the seller.
     * @param _amount The amount of the escrow.
     * @notice Only callable by an agent.
     */
    function initiateEscrow(
        address _buyer,
        address _seller,
        uint _amount
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        require(!_addressArrayContains(agents, _buyer), "Buyer is an agent"); /// @dev Make sure buyer isn't an agent
        require(!_addressArrayContains(agents, _seller), "Seller is an agent"); /// @dev Make sure seller isn't an agent
        /// @dev Make sure buyer isn't in the agents waitlist
        require(
            !_addressArrayContains(agentWaitlist, _buyer),
            "Buyer is in an agent waitlist"
        );
        /// @dev Make sure seller isn't in the agents waitlist
        require(
            !_addressArrayContains(agentWaitlist, _seller),
            "Seller is in an agent waitlist"
        );
        EscrowDocument memory escrow = EscrowDocument(
            escrows.length,
            _buyer,
            _seller,
            _amount,
            EscrowStatus.PENDING_PAYMENT,
            agentFeePercentage,
            block.timestamp,
            block.timestamp
        );
        escrows.push(escrow);
        emit EscrowInitiated(escrow);
    }

    /**
     * @dev Deposits funds into an escrow.
     * @param _escrowId The ID of the escrow.
     * @notice Only callable by the buyer of the escrow.
     */
    function depositEscrow(uint _escrowId) external payable nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        /// @dev Make sure the depositer is the buyer
        require(
            escrow.buyer == msg.sender,
            "Only buyer should deposit into an escrow"
        );
        /// @dev Make sure the escrow is waiting for the payment
        require(
            escrow.status == EscrowStatus.PENDING_PAYMENT,
            "Escrow is not accepting payments"
        );
        uint feeForAgent = (escrow.amount * escrow.agentFeePercentage) / 100;
        /// @dev Make sure the deposit contains escrow deposit + agent fee
        require(
            escrow.amount + feeForAgent == msg.value,
            "Deposit must be equal to amount including the agent fee"
        );
        escrow.status = EscrowStatus.PENDING_APPROVAL;
        escrow.updatedAt = block.timestamp;
        emit EscrowPaid(escrow.id, block.timestamp);
    }

    /**
     * @dev Approves an escrow.
     * @param _escrowId The ID of the escrow.
     * @notice Only callable by an agent.
     */
    function approveEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        /// @dev Make sure the escrow is ready to be approved
        require(
            escrow.status == EscrowStatus.PENDING_APPROVAL,
            "Escrow cannot be approved"
        );
        uint agentFee = (escrow.amount * escrow.agentFeePercentage) / 100;
        escrow.status = EscrowStatus.APPROVED;
        escrow.updatedAt = block.timestamp;
        withdrawableFunds += agentFee;
        (bool success, ) = payable(escrow.seller).call{value: escrow.amount}(
            ""
        );
        require(success, "Failed to send funds to seller");
        emit EscrowApproved(escrow.id, block.timestamp);
    }

    /**
     * @dev Cancels an escrow.
     * @param _escrowId The ID of the escrow.
     * @notice Only callable by an agent.
     */
    function cancelEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        /// @dev Make sure the escrow can be canceled
        /// @dev Agents can cancel only escrow which is waiting for approval
        require(
            escrow.status == EscrowStatus.PENDING_APPROVAL,
            "You can only cancel deposited Escrow"
        );
        escrow.status = EscrowStatus.CANCELED;
        escrow.updatedAt = block.timestamp;
        uint agentFee = (escrow.amount * escrow.agentFeePercentage) / 100;
        withdrawableFunds += agentFee;
        (bool success, ) = payable(escrow.buyer).call{value: escrow.amount}("");
        require(success, "Failed to send funds to buyer");
        emit EscrowCanceled(_escrowId, block.timestamp);
    }

    /**
     * @dev Archives an escrow.
     * @param _escrowId The ID of the escrow.
     * @notice Only callable by an agent.
     */
    function archiveEscrow(
        uint _escrowId
    ) external onlyRole(AGENT_ROLE) nonReentrant {
        EscrowDocument storage escrow = escrows[_escrowId];
        /// @dev Make sure the escrow can be archived
        /// @dev Agents can archive only escrow which hasn't been deposited yet
        require(
            escrow.status == EscrowStatus.PENDING_PAYMENT,
            "Can't archive active Escrow"
        );
        escrow.status = EscrowStatus.ARCHIVED;
        escrow.updatedAt = block.timestamp;
        emit EscrowArchived(_escrowId, block.timestamp);
    }
}
