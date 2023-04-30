import { useContext, useEffect } from "react";
import { Container, CircularProgress, Grid } from "@mui/material";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <h1 className="text-3xl font-bold text-blue-600">Install & Setup Vite + React + Typescript + Tailwind CSS 3</h1>
    </div>
  );
};
