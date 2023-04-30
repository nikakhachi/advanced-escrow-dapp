import { useContext, useEffect } from "react";
import { EscrowCard } from "../components/EscrowCard";
import { FunctionButtons } from "../components/FunctionButtons";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  useEffect(() => {
    escrowAgentContext?.getEscrows();
    escrowAgentContext?.getAgentFeePercentage();
    escrowAgentContext?.getWithdrawableFunds();
    escrowAgentContext?.getAgents();
    escrowAgentContext?.getAgentsWaitlist();
    escrowAgentContext?.setEventHandlers();
  }, []);

  return escrowAgentContext ? (
    <div>
      <FunctionButtons />
      <div className="mt-12 flex flex-wrap gap-4">
        {escrowAgentContext.escrows.map((escrow) => (
          <EscrowCard escrow={escrow} key={escrow.id} />
        ))}
      </div>
    </div>
  ) : (
    <></>
  );
};
