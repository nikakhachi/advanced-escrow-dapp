import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button, CircularProgress } from "@mui/material";
import { FC, useContext, useState } from "react";
import { EscrowAgentContext } from "../contexts/EscrowAgentContext";

interface AddAgentDialogProps {
  open: boolean;
  handleClose: () => void;
}

export const AddAgentDialog: FC<AddAgentDialogProps> = ({ handleClose, open }) => {
  const escrowAgentContext = useContext(EscrowAgentContext);

  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await escrowAgentContext?.addAgent(address);
    setAddress("");
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add an agent</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-1.5 my-8">
          <TextField
            label="Address"
            disabled={isLoading}
            size="small"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
