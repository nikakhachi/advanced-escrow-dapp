import { useContext, useEffect, useState } from "react";
import { AddAgentDialog } from "../components/AddAgentDialog";
import { AgentsListDialog } from "../components/AgentsListDialog";
import { ApplyingAsAgentDialog } from "../components/ApplyingAsAgentDialog";
import { EscrowCard } from "../components/EscrowCard";
import { InitiateEscrowDialog } from "../components/InitiateEscrowDialog";
import { RevokeAgentDialog } from "../components/RevokeAgentDialog";
import { WithdrawFundsDialog } from "../components/WithdrawFundsDialog";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import { Role } from "../types/enums";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);
  const [initiateEscrowDialogOpen, setInitiateEscrowDialogOpen] = useState(false);
  const [withdrawFundsDialogOpen, setWithdrawFundsDialogOpen] = useState(false);
  const [applyingAsAgentDialogOpen, setApplyingAsAgentDialogOpen] = useState(false);
  const [agentsListDialogOpen, setAgentsListDialogOpen] = useState(false);
  const [agentsWaitlistDialogOpen, setAgentsWaitlistDialogOpen] = useState(false);
  const [addAgentDialogOpen, setAddAgentDialogOpen] = useState(false);
  const [revokeAgentDialogOpen, setRevokeAgentDialogOpen] = useState(false);

  const handleClose = () => {
    setInitiateEscrowDialogOpen(false);
    setWithdrawFundsDialogOpen(false);
    setApplyingAsAgentDialogOpen(false);
    setAgentsWaitlistDialogOpen(false);
    setAgentsListDialogOpen(false);
    setAddAgentDialogOpen(false);
    setRevokeAgentDialogOpen(false);
  };

  useEffect(() => {
    escrowAgentContext?.getEscrows();
    escrowAgentContext?.getAgentFeePercentage();
    escrowAgentContext?.getWithdrawableFunds();
    escrowAgentContext?.getAgents();
    escrowAgentContext?.getAgentsWaitlist();
  }, []);

  return escrowAgentContext ? (
    <div>
      {escrowAgentContext.role === Role.VISITOR && (
        <button onClick={() => setApplyingAsAgentDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
          Apply as an Agent
        </button>
      )}
      {escrowAgentContext.role === Role.OWNER && (
        <>
          <button onClick={() => setAddAgentDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
            Add Agent
          </button>
          <button onClick={() => setRevokeAgentDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
            Revoke Agent
          </button>{" "}
          <button onClick={() => setWithdrawFundsDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
            Withdraw Funds
          </button>
        </>
      )}
      {escrowAgentContext.role !== Role.VISITOR && (
        <button onClick={() => setInitiateEscrowDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl">
          Initiate an Escrow
        </button>
      )}
      <br />
      <button onClick={() => setAgentsListDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2 mt-4">
        Active Agents
      </button>
      <button onClick={() => setAgentsWaitlistDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
        Waitlist Agents
      </button>
      <div className="mt-12 flex flex-wrap gap-4">
        {escrowAgentContext.escrows.map((escrow) => (
          <EscrowCard escrow={escrow} key={escrow.id} />
        ))}
      </div>
      <InitiateEscrowDialog open={initiateEscrowDialogOpen} handleClose={handleClose} />
      <WithdrawFundsDialog open={withdrawFundsDialogOpen} handleClose={handleClose} />
      <ApplyingAsAgentDialog open={applyingAsAgentDialogOpen} handleClose={handleClose} />
      <AgentsListDialog
        open={agentsListDialogOpen}
        handleClose={handleClose}
        title="Active Agents List"
        agentAddresses={escrowAgentContext.agents}
      />
      <AgentsListDialog
        open={agentsWaitlistDialogOpen}
        handleClose={handleClose}
        title="Waitlist Agents List"
        agentAddresses={escrowAgentContext.agentsWaitlist}
      />
      <AddAgentDialog open={addAgentDialogOpen} handleClose={handleClose} />
      <RevokeAgentDialog open={revokeAgentDialogOpen} handleClose={handleClose} />
    </div>
  ) : (
    <></>
  );
};
