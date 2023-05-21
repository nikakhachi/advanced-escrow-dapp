import { FC, useContext } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import { Role } from "../types/enums";
import { shortenAddress } from "../utils";
interface HeaderProps {}

export const Header: FC<HeaderProps> = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return (
    <div className="w-full justify-center flex flex-col items-center pt-12 pb-12">
      <p className="text-4xl font-semibold text-white">
        <span className="text-[#00d395]">Escrow</span> Application
      </p>
      {escrowAgentContext?.isLoading ? (
        <p>Loading</p>
      ) : !escrowAgentContext?.isNetworkGoerli ? (
        <p>Switch to Goerli network</p>
      ) : escrowAgentContext?.metamaskAccount ? (
        <p className="mt-2">
          Logged in as <span className="font-bold	">{shortenAddress(escrowAgentContext.metamaskAccount)}</span>
          {escrowAgentContext.role !== null ? ` (${Role[escrowAgentContext.role]})` : null}
        </p>
      ) : !escrowAgentContext?.metamaskWallet ? (
        <p>Metamask Wallet Missing</p>
      ) : (
        <button onClick={escrowAgentContext?.connectToWallet} className="border-2 border-[#00d395] px-4 py-1 rounded-2xl mt-4">
          Connect the Wallet
        </button>
      )}
    </div>
  );
};
