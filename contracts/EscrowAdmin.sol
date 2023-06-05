// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowBase.sol";

/**
 * @title Escrow Contract
 * @author Nika Khachiashvili
 * @dev Contract for administrative functions related to escrow.
 */
contract EscrowAdmin is EscrowBase {
    /**
     * @dev Changes the agent fee percentage.
     * @param _newFeePercentage The new agent fee percentage.
     * @notice Only callable by the contract owner.
     */
    function changeAgentFeePercentage(
        uint8 _newFeePercentage
    ) external onlyOwner {
        agentFeePercentage = _newFeePercentage;
        emit AgentFeePercentageUpdated(_newFeePercentage);
    }

    /**
     * @dev Withdraws funds from the contract.
     * @param _amount The amount of funds to withdraw.
     * @notice Only callable by the contract owner.
     */
    function withdrawFunds(uint _amount) external onlyOwner nonReentrant {
        /// @dev Make sure contract has enough ETH
        require(
            _amount <= address(this).balance,
            "Not enough ETH to withdraw on contract"
        );
        /// @dev Make sure contract has enough withdrawable funds
        require(
            _amount <= withdrawableFunds,
            "Not enough ETH in withdrawable funds"
        );
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Failed to withdraw funds");
        emit FundsWithdrawn(_amount);
        withdrawableFunds -= _amount;
    }

    /**
     * @dev Adds an agent.
     * @param _agent The address of the agent to add.
     * @notice Only callable by the contract owner.
     */
    function addAgent(address _agent) external onlyOwner {
        /// @dev Make sure the address isn't already an agent
        require(
            !_addressArrayContains(agents, _agent),
            "Address is already an agent"
        );

        /// @dev If address is in waitlist array
        /// @dev Remove from there, because they will become an agent
        if (_addressArrayContains(agentWaitlist, _agent)) {
            for (uint i = 0; i < agentWaitlist.length; i++) {
                if (agentWaitlist[i] == _agent) {
                    agentWaitlist[i] = agentWaitlist[agentWaitlist.length - 1];
                    agentWaitlist.pop();
                }
            }
        }
        grantRole(AGENT_ROLE, _agent);
        agents.push(_agent);
        emit AgentAdded(_agent);
    }

    /**
     * @dev Revokes agent privileges from an address.
     * @param _agent The address of the agent to revoke.
     * @notice Only callable by the contract owner.
     */
    function revokeAgent(address _agent) external onlyOwner {
        revokeRole(AGENT_ROLE, _agent);
        /// @dev Pop the address from the agents list
        for (uint i = 0; i < agents.length; i++) {
            if (agents[i] == _agent) {
                agents[i] = agents[agents.length - 1];
                agents.pop();
            }
        }
        emit AgentRevoked(_agent);
    }
}
