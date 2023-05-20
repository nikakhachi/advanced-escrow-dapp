import { createContext, useState, PropsWithChildren, useEffect, useContext } from "react";
import { BigNumber, ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../constants";
import CONTRACT_JSON from "../constants/EscrowAgentContract.json";
import { EscrowStatus, EscrowType } from "../types";
import { SnackbarContext } from "./SnackbarContext";
import { Role } from "../types/enums";

type EscrowAgentContextType = {
  metamaskWallet: any;
  metamaskAccount: any;
  connectToWallet: () => Promise<void>;
  isLoading: boolean;
  getSigner: () => ethers.providers.JsonRpcSigner;
  isNetworkGoerli: boolean | undefined;
  getEscrows: () => Promise<void>;
  getAgentFeePercentage: () => Promise<void>;
  getWithdrawableFunds: () => Promise<void>;
  getAgents: () => Promise<void>;
  getAgentsWaitlist: () => Promise<void>;
  escrows: EscrowType[];
  agentFeePercentage: number;
  withdrawableFunds: number;
  agents: string[];
  agentsWaitlist: string[];
  initiateEscrow: (seller: string, buyer: string, depositAmountInETH: number) => Promise<void>;
  archiveEscrow: (escrowId: number) => Promise<void>;
  cancelEscrow: (escrowId: number) => Promise<void>;
  approveEscrow: (escrowId: number) => Promise<void>;
  depositEscrow: (escrowId: number, depositAmountInETH: number) => Promise<void>;
  withdrawFunds: (amount: number) => Promise<void>;
  applyAsAnAgent: () => Promise<void>;
  addAgent: (address: string) => Promise<void>;
  revokeAgent: (address: string) => Promise<void>;
  role: Role | null;
  setEventHandlers: () => void;
  updateAgentFeePercentage: (amount: number) => Promise<void>;
  areEscrowsLoading: boolean;
};

let metamaskWallet: ethers.providers.ExternalProvider | undefined;
if (typeof window !== "undefined") {
  // @ts-ignore
  metamaskWallet = window.ethereum;
}

const publicProvider = new ethers.providers.WebSocketProvider(import.meta.env.VITE_ALCHEMY_ENDPOINT);

export const EscrowAgentContext = createContext<EscrowAgentContextType | null>(null);

export const EscrowAgentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const snackbarContext = useContext(SnackbarContext);

  const [metamaskAccount, setMetamaskAccount] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState<ethers.Contract>();

  const [isNetworkGoerli, setIsNetworkGoerli] = useState<boolean>();

  const [escrows, setEscrows] = useState<EscrowType[]>([]);
  const [areEscrowsLoading, setAreEscrowsLoading] = useState(true);

  const [agentFeePercentage, setAgentFeePercentage] = useState(0);
  const [withdrawableFunds, setWithdrawableFunds] = useState(0);
  const [agents, setAgents] = useState<string[]>([]);
  const [agentsWaitlist, setAgentsWaitlist] = useState<string[]>([]);

  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    (async () => {
      const account = await findMetaMaskAccount();
      if (account !== null) {
        checkIfNetworkIsGoerli();
        setMetamaskAccount(account);
        setIsLoading(false);
      } else {
        setMetamaskAccount(undefined);
        setIsNetworkGoerli(undefined);
        setIsLoading(false);
      }
      (metamaskWallet as any).on("accountsChanged", (accounts: any[]) => {
        if (!accounts.length) {
          setMetamaskAccount(undefined);
          setIsNetworkGoerli(undefined);
          setRole(null);
        } else {
          setMetamaskAccount(accounts[0]);
        }
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (metamaskAccount) {
        const contract = getContract(getSigner());
        const owner = await contract.owner();
        if (owner.toUpperCase() === metamaskAccount.toUpperCase()) return setRole(Role.OWNER);
        if (agents.find((agent) => agent.toUpperCase() === metamaskAccount.toUpperCase())) return setRole(Role.AGENT);
        setRole(Role.VISITOR);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metamaskAccount, escrows.length]);

  useEffect(() => {
    (async () => {
      if (metamaskAccount) {
        fetchEverythingButEscrows();
      }
    })();
  }, [metamaskAccount]);

  const findMetaMaskAccount = async () => {
    try {
      if (!metamaskWallet || !metamaskWallet.request) return null;

      const accounts = await metamaskWallet.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        return account;
      } else {
        setIsLoading(false);
        console.error("No authorized account found");
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const connectToWallet = async () => {
    if (!metamaskWallet || !metamaskWallet.request) return null;

    const accounts = await metamaskWallet.request({
      method: "eth_requestAccounts",
    });

    setMetamaskAccount(accounts[0]);
    checkIfNetworkIsGoerli();
    return accounts[0];
  };

  const getSigner = () => {
    if (metamaskWallet && metamaskAccount) {
      const provider = new ethers.providers.Web3Provider(metamaskWallet);
      const signer = provider.getSigner();
      return signer;
    } else {
      throw alert("Connect to Wallet");
    }
  };

  const checkIfNetworkIsGoerli = async () => {
    if (metamaskWallet) {
      const provider = new ethers.providers.Web3Provider(metamaskWallet);
      const network = await provider.getNetwork();
      if (network.name === "goerli") {
        setIsNetworkGoerli(true);
      } else {
        setIsNetworkGoerli(false);
      }
      return network.name === "goerli";
    }
  };

  //
  //
  // CONTRACT FUNCTIONS BELOW
  //
  //

  const getContract = (signer?: ethers.Signer | ethers.providers.Provider): ethers.Contract => {
    if (contract) return contract;
    const fetchedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_JSON.abi, signer || publicProvider);
    if (signer) setContract(fetchedContract);
    return fetchedContract;
  };

  const getEscrows = async () => {
    try {
      setAreEscrowsLoading(true);
      const contract = getContract();
      const escrowsRaw = await contract.getAllEscrows();
      const escrows: EscrowType[] = escrowsRaw
        .map((item: any) => ({
          seller: item.seller,
          buyer: item.buyer,
          id: item.id.toNumber(),
          amount: Number(ethers.utils.formatEther(item.amount)),
          status: item.status,
          agentFeePercentage: item.agentFeePercentage,
          description: item.description,
          createdAt: new Date(item.createdAt.toNumber() * 1000),
          updatedAt: new Date(item.updatedAt.toNumber() * 1000),
        }))
        .sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf());
      setEscrows(escrows);
    } catch (error) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    } finally {
      setAreEscrowsLoading(false);
    }
  };

  const getAgentFeePercentage = async () => {
    const contract = getContract(getSigner());
    const agentFeePercentageRaw = await contract.agentFeePercentage();
    setAgentFeePercentage(agentFeePercentageRaw);
  };

  const getWithdrawableFunds = async () => {
    const contract = getContract(getSigner());
    const withdrawableFundsRaw = await contract.withdrawableFunds();
    setWithdrawableFunds(Number(ethers.utils.formatEther(withdrawableFundsRaw)));
  };

  const getAgents = async () => {
    const contract = getContract(getSigner());
    const agentsRaw = await contract.getAgents();
    setAgents(agentsRaw);
  };

  const getAgentsWaitlist = async () => {
    const contract = getContract(getSigner());
    const agentsWaitlistRaw = await contract.getAgentsWaitlist();
    setAgentsWaitlist(agentsWaitlistRaw);
  };

  const fetchEverythingButEscrows = async () => {
    getAgentFeePercentage();
    getWithdrawableFunds();
    getAgents();
    getAgentsWaitlist();
  };

  const initiateEscrow = async (seller: string, buyer: string, depositAmountInETH: number) => {
    try {
      if (seller.toUpperCase() === buyer.toUpperCase()) return snackbarContext?.open("Buyer and Seller must be different", "error");
      const contract = getContract(getSigner());
      const txn = await contract.initiateEscrow(buyer, seller, ethers.utils.parseEther(String(depositAmountInETH)));
      await txn.wait();
    } catch (error) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const archiveEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.archiveEscrow(escrowId);
      await txn.wait();
    } catch (error) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const cancelEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.cancelEscrow(escrowId);
      await txn.wait();
    } catch (error) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const approveEscrow = async (escrowId: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.ApproveEscrow(escrowId);
      await txn.wait();
    } catch (error) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const depositEscrow = async (escrowId: number, depositAmountInETH: number) => {
    try {
      const contract = getContract(getSigner());
      const amount = String(depositAmountInETH).length > 18 ? depositAmountInETH.toFixed(18) : String(depositAmountInETH);
      const txn = await contract.depositEscrow(escrowId, { value: ethers.utils.parseEther(amount) });
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      const escrowBuyerAddress = escrows.find((item) => item.id === escrowId)?.buyer;
      if (metamaskAccount?.toLowerCase() !== escrowBuyerAddress?.toLowerCase()) {
        return snackbarContext?.open("You should be the buyer to deposit to the escrow", "error");
      }
      snackbarContext?.open("Error", "error");
    }
  };

  const withdrawFunds = async (amount: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.withdrawFunds(ethers.utils.parseEther(String(amount)));
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const applyAsAnAgent = async () => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.applyForAgent();
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const addAgent = async (address: string) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.addAgent(address);
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const revokeAgent = async (address: string) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.revokeAgent(address);
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const updateAgentFeePercentage = async (amount: number) => {
    try {
      const contract = getContract(getSigner());
      const txn = await contract.changeAgentFeePercentage(amount);
      await txn.wait();
    } catch (error: any) {
      console.error(error);
      snackbarContext?.open("Error", "error");
    }
  };

  const setEventHandlers = () => {
    const contract = getContract();
    contract.provider.once("block", () => {
      contract.on("EscrowInitiated", (escrow: EscrowType) => {
        setEscrows((prevState) =>
          [
            {
              seller: escrow.seller,
              buyer: escrow.buyer,
              id: Number(escrow.id),
              amount: Number(ethers.utils.formatEther(escrow.amount)),
              status: escrow.status,
              agentFeePercentage: escrow.agentFeePercentage,
              description: escrow.description,
              createdAt: new Date((escrow.createdAt as any).toNumber() * 1000),
              updatedAt: new Date((escrow.createdAt as any).toNumber() * 1000),
            },
            ...prevState,
          ].sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf())
        );
        snackbarContext?.open("New Escrow has been created", "success");
      });
      const escrowStatusChangeHandler = async (id: BigNumber, timestamp: BigNumber, status: EscrowStatus) => {
        setEscrows((prevState) =>
          prevState
            .map((escrow) => {
              console.log("------");
              console.log(escrow.id === Number(id), escrow.id, Number(id));
              console.log("------");
              if (escrow.id === Number(id)) {
                console.log("ESAA, GLIJE");
                return { ...escrow, status, updatedAt: new Date(timestamp.toNumber() * 1000) };
              }
              return escrow;
            })
            .sort((a: EscrowType, b: EscrowType) => b.updatedAt.valueOf() - a.updatedAt.valueOf())
        );
        console.log("SHECVALA ESKROUEBII");
        if (status === EscrowStatus.APPROVED || status === EscrowStatus.CANCELED) {
          const withdrawableFundsRes = await contract.withdrawableFunds();
          setWithdrawableFunds(Number(ethers.utils.formatEther(withdrawableFundsRes)));
        }
      };
      contract.on("EscrowPaid", (id: BigNumber, timestamp: BigNumber) => {
        console.log("ESCROW PAID EVENT CAUGHT");
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.PENDING_APPROVAL);
        snackbarContext?.open("Escrow Deposited", "info");
      });
      contract.on("EscrowApproved", (id: BigNumber, timestamp: BigNumber) => {
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.APPROVED);
        snackbarContext?.open("Escrow Approved", "info");
      });
      contract.on("EscrowCanceled", (id: BigNumber, timestamp: BigNumber) => {
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.CANCELED);
        snackbarContext?.open("Escrow Canceled", "info");
      });
      contract.on("EscrowArchived", (id: BigNumber, timestamp: BigNumber) => {
        escrowStatusChangeHandler(id, timestamp, EscrowStatus.ARCHIVED);
        snackbarContext?.open("Escrow Achived", "info");
      });
      contract.on("FundsWithdrawn", (amount: BigNumber) => {
        setWithdrawableFunds((s) => s - Number(ethers.utils.formatEther(amount)));
        snackbarContext?.open("Funds withdraw", "info");
      });
      contract.on("AgentFeePercentageUpdated", (newAgentFeePercentage: number) => {
        setAgentFeePercentage(newAgentFeePercentage);
        snackbarContext?.open("Agent fee percentage updated", "info");
      });
      contract.on("AgentAdded", (address: string) => {
        setAgents((arr) => [...arr, address]);
        snackbarContext?.open("Agent added", "info");
      });
      contract.on("AgentRevoked", (address: string) => {
        setAgents((arr) => arr.filter((item) => item.toUpperCase() !== address.toUpperCase()));
        snackbarContext?.open("Agent Revoked", "info");
      });
    });
  };

  const value = {
    metamaskWallet,
    metamaskAccount,
    connectToWallet,
    isLoading,
    getSigner,
    isNetworkGoerli,
    getEscrows,
    getAgentFeePercentage,
    getWithdrawableFunds,
    getAgents,
    getAgentsWaitlist,
    escrows,
    agentFeePercentage,
    withdrawableFunds,
    agents,
    agentsWaitlist,
    initiateEscrow,
    cancelEscrow,
    archiveEscrow,
    approveEscrow,
    depositEscrow,
    withdrawFunds,
    applyAsAnAgent,
    addAgent,
    revokeAgent,
    role,
    setEventHandlers,
    updateAgentFeePercentage,
    areEscrowsLoading,
  };

  return <EscrowAgentContext.Provider value={value}>{children}</EscrowAgentContext.Provider>;
};
