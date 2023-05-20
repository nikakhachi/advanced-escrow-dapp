// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowBase.sol";

contract EscrowAdmin is EscrowBase {
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
        payable(owner()).transfer(_amount);
        emit FundsWithdrawn(withdrawableFunds);
        withdrawableFunds -= _amount;
    }

    function addAgent(address _agent) external onlyOwner {
        require(
            !_addressArrayContains(agents, _agent),
            "Address is already an agent"
        );
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

    function revokeAgent(address _agent) external onlyOwner {
        revokeRole(AGENT_ROLE, _agent);
        for (uint i = 0; i < agents.length; i++) {
            if (agents[i] == _agent) {
                agents[i] = agents[agents.length - 1];
                agents.pop();
            }
        }
        emit AgentRevoked(_agent);
    }
}
