import { FC, useContext } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";
import { Role } from "../types/enums";
import { shortenAddress } from "../utils";
import { ESCROW_ADDRESS } from "../contracts/escrow";
interface HeaderProps {}

export const Header: FC<HeaderProps> = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return (
    <div className="w-full justify-center flex flex-col items-center pt-12 pb-12">
      <p className="text-4xl font-semibold text-white">
        <span className="text-[#00d395]">Escrow</span> Application{" "}
        <span className="text-sm underline">
          <a href={`https://goerli.etherscan.io/address/${ESCROW_ADDRESS}`} target="_blank" rel="noreferrer">
            (ETHERSCAN)
          </a>
        </span>
      </p>
      {!escrowAgentContext?.metamaskWallet ? (
        <p>Metamask Wallet Missing</p>
      ) : escrowAgentContext?.isLoading ? (
        <p>Loading</p>
      ) : !escrowAgentContext?.metamaskAccount ? (
        <button onClick={escrowAgentContext?.connectToWallet} className="border-2 border-[#00d395] px-4 py-1 rounded-2xl mt-4">
          Connect the Wallet
        </button>
      ) : escrowAgentContext.isNetworkGoerli === undefined ? (
        <p>Loading</p>
      ) : escrowAgentContext.isNetworkGoerli === false ? (
        <p>
          Logged in as <span className="font-bold	">{shortenAddress(escrowAgentContext.metamaskAccount)} </span>-{" "}
          <u>Switch to Goerli network</u>
        </p>
      ) : (
        <p className="mt-2">
          Logged in as <span className="font-bold	">{shortenAddress(escrowAgentContext.metamaskAccount)}</span>
          {escrowAgentContext.role !== null ? ` (${Role[escrowAgentContext.role]})` : null}
        </p>
      )}
    </div>
  );
};
