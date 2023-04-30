import { useContext, useEffect, useState } from "react";
import { EscrowCard } from "../components/EscrowCard";
import { InitiateEscrowDialog } from "../components/InitiateEscrowDialog";
import { WithdrawFundsDialog } from "../components/WithdrawFundsDialog";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);
  const [initiateEscrowDialogOpen, setInitiateEscrowDialogOpen] = useState(false);
  const [withdrawFundsDialogOpen, setWithdrawFundsDialogOpen] = useState(false);

  const handleClose = () => {
    setInitiateEscrowDialogOpen(false);
    setWithdrawFundsDialogOpen(false);
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
      <button onClick={() => setWithdrawFundsDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl mr-2">
        Withdraw Funds
      </button>
      <button onClick={() => setInitiateEscrowDialogOpen(true)} className="text-lg border-2 border-[#00d395] px-8 py-2 rounded-2xl">
        Initiate an Escrow
      </button>
      <div className="mt-12 flex flex-wrap gap-4">
        {escrowAgentContext.escrows.map((escrow) => (
          <EscrowCard escrow={escrow} key={escrow.id} />
        ))}
      </div>
      <InitiateEscrowDialog open={initiateEscrowDialogOpen} handleClose={handleClose} />
      <WithdrawFundsDialog open={withdrawFundsDialogOpen} handleClose={handleClose} />
    </div>
  ) : (
    <></>
  );
};
