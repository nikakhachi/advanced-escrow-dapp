import { useContext, useEffect } from "react";
import { EscrowAgentContext } from "./contexts/EscrowAgentContext";
import { Header } from "./components/Header";
import { FunctionButtons } from "./components/FunctionButtons";
import { EscrowCard } from "./components/EscrowCard";
import { CircularProgress } from "@mui/material";
import { EscrowStatus } from "./types";
import React from "react";

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
      <div className="mt-12 flex flex-wrap gap-4 pl-4">
        {escrowAgentContext?.areEscrowsLoading ? (
          <CircularProgress color="inherit" />
        ) : (
          <>
            {Object.keys(EscrowStatus).map((item, index) =>
              Number.isNaN(Number(item)) ? (
                <React.Fragment key={item}>
                  <p className="w-full text-xl mt-4">Status: {item}</p>
                  {escrowAgentContext?.escrows
                    .filter((escrow) => EscrowStatus[escrow.status] === item)
                    .map((escrow) => (
                      <EscrowCard escrow={escrow} key={escrow.id} />
                    ))}
                </React.Fragment>
              ) : (
                <React.Fragment key={index}></React.Fragment>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
