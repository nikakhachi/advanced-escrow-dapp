import { Button, Typography } from "@mui/material";
import { useContext } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const ConnectMetamaskView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);
  return (
    <div className="w-full justify-center items-center flex flex-col pt-24 text-white">
      <p className="text-2xl">See the escrows, their statuses</p>
      <p className="text-2xl mt-2 mb-4">Deposit to your escrow or become an agent and initiate escows</p>
      <div>
        <button onClick={escrowAgentContext?.connectToWallet} className="border-2 border-[#00d395] px-16 py-4 rounded-2xl">
          Connect the Wallet
        </button>
      </div>
    </div>
  );
};
