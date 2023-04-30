import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button, CircularProgress } from "@mui/material";
import { FC, useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

interface InitiateEscrowDialogProps {
  open: boolean;
  handleClose: () => void;
}

export const InitiateEscrowDialog: FC<InitiateEscrowDialogProps> = ({ handleClose, open }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await escrowAgentContext?.initiateEscrow(seller, buyer, amount);
    setBuyer("");
    setSeller("");
    setAmount(0);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Initiate an Escrow</DialogTitle>
      <DialogContent>
        <DialogContentText>Agent Fee: {escrowAgentContext?.agentFeePercentage}%</DialogContentText>
        <div className="flex flex-col gap-1.5 my-8">
          <TextField
            disabled={isLoading}
            size="small"
            label="Buyer's Address"
            fullWidth
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          />
          <TextField
            disabled={isLoading}
            size="small"
            label="Seller's Address"
            fullWidth
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
          />
          <TextField
            disabled={isLoading}
            size="small"
            type="number"
            label="Deposit Amount in ETH"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <DialogContentText>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={isLoading} onClick={handleClose}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleConfirm} autoFocus>
          Confirm
        </Button>
        {isLoading && <CircularProgress size="1rem" />}
      </DialogActions>
    </Dialog>
  );
};
