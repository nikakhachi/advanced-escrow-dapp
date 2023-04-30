import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button, CircularProgress } from "@mui/material";
import { FC, useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

interface UpdateAgentFeePercentageProps {
  open: boolean;
  handleClose: () => void;
}

export const UpdateAgentFeePercentage: FC<UpdateAgentFeePercentageProps> = ({ handleClose, open }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await escrowAgentContext?.updateAgentFeePercentage(amount);
    setAmount(0);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Update agent fee percentage</DialogTitle>
      <DialogContent>
        <DialogContentText>Current: {escrowAgentContext?.agentFeePercentage}%</DialogContentText>
        <div className="flex flex-col gap-1.5 my-8">
          <TextField
            disabled={isLoading}
            size="small"
            type="number"
            fullWidth
            label="New Percentage"
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
