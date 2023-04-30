import { useContext, useEffect } from "react";
import { Container, CircularProgress, Grid } from "@mui/material";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

export const HomeView = () => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  return <Container sx={{ paddingTop: "1rem" }}>Home View</Container>;
};
