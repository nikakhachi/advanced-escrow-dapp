import { FC, useContext } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import { EscrowStatus, EscrowType } from "../types";
import { Role } from "../types/enums";
import { shortenAddress } from "../utils";

interface EscrowCardProps {
  escrow: EscrowType;
}

export const EscrowCard: FC<EscrowCardProps> = ({ escrow }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const actionButtonClassName = "inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2";

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg border-x border-y border-[#00d395]">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">Status: {EscrowStatus[escrow.status]}</div>
        <p className="text-gray-600 text-base">Buyer: {shortenAddress(escrow.buyer)}</p>
        <p className="text-gray-600 text-base">Seller: {shortenAddress(escrow.seller)}</p>
        <p className="text-gray-600 text-base">Amount: {escrow.amount}</p>
        <p className="text-gray-600 text-base">Agent Fee: {escrow.agentFeePercentage}%</p>
      </div>
      {escrowAgentContext?.role && (
        <div className="px-6 pt-4 pb-2">
          {escrow.status === EscrowStatus.PENDNG_PAYMENT && (
            <>
              {escrowAgentContext?.role !== Role.VISITOR && (
                <button className={actionButtonClassName} onClick={() => escrowAgentContext?.archiveEscrow(escrow.id)}>
                  Archive
                </button>
              )}
              {escrowAgentContext?.metamaskAccount.toUpperCase() === escrow.buyer.toUpperCase() && (
                <button
                  className={actionButtonClassName}
                  onClick={() =>
                    escrowAgentContext?.depositEscrow(escrow.id, escrow.amount + (escrow.amount * escrow.agentFeePercentage) / 100)
                  }
                >
                  Deposit
                </button>
              )}
            </>
          )}
          {escrow.status === EscrowStatus.PENDING_APPROVAL && escrowAgentContext?.role !== Role.VISITOR ? (
            <>
              <button className={actionButtonClassName} onClick={() => escrowAgentContext?.cancelEscrow(escrow.id)}>
                Cancel
              </button>
              <button className={actionButtonClassName} onClick={() => escrowAgentContext?.approveEscrow(escrow.id)}>
                Approve
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
