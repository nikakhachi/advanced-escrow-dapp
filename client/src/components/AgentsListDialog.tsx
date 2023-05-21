import { Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText } from "@mui/material";
import { FC } from "react";
interface AgentsListDialogProps {
  open: boolean;
  handleClose: () => void;
  agentAddresses: string[];
  title: string;
}

export const AgentsListDialog: FC<AgentsListDialogProps> = ({ handleClose, open, agentAddresses, title }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div className="mb-4">
          Agents:
          {!agentAddresses.length ? (
            " N/A"
          ) : (
            <ul className="list-disc">
              {agentAddresses.map((agentAddress) => (
                <li key={agentAddress}>{agentAddress}</li>
              ))}
            </ul>
          )}
        </div>
        <DialogContentText>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
