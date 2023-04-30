import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button, CircularProgress } from "@mui/material";
import { FC, useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

interface ApplyingAsAgentDialogProps {
  open: boolean;
  handleClose: () => void;
}

export const ApplyingAsAgentDialog: FC<ApplyingAsAgentDialogProps> = ({ handleClose, open }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await escrowAgentContext?.applyAsAnAgent();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Apply as an Agent?</DialogTitle>
      <DialogContent>
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
