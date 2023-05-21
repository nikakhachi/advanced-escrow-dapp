export enum EscrowStatus {
  PENDING_PAYMENT,
  PENDING_APPROVAL,
  APPROVED,
  CANCELED,
  ARCHIVED,
}

export type EscrowType = {
  seller: string;
  buyer: string;
  id: number;
  amount: number;
  status: EscrowStatus;
  agentFeePercentage: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};
