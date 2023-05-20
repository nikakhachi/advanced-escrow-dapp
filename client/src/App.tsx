import { useContext, useEffect } from "react";
import { EscrowAgentContext } from "./contexts/EscrowAgentContext";
import { Header } from "./components/Header";
import { FunctionButtons } from "./components/FunctionButtons";
import { EscrowCard } from "./components/EscrowCard";
import { CircularProgress } from "@mui/material";

function App() {
  const escrowAgentContext = useContext(EscrowAgentContext);

  useEffect(() => {
    escrowAgentContext?.getEscrows();
    escrowAgentContext?.setEventHandlers();
  }, []);

  return (
    <div className="bg-black  text-white">
      <Header />
      <FunctionButtons />
      <div className="mt-12 flex flex-wrap gap-4">
        {escrowAgentContext?.areEscrowsLoading ? (
          <CircularProgress color="inherit" />
        ) : (
          escrowAgentContext?.escrows.map((escrow) => <EscrowCard escrow={escrow} key={escrow.id} />)
        )}
      </div>
    </div>
  );
}

export default App;
