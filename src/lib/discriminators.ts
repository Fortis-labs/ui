
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';

export interface DiscriminatorMultisigPosition {
  discriminator: Uint8Array<ArrayBuffer>;
  multisigAccountIndex: number;
  label: string;
}
export const MULTISIG_ACCOUNT_POSITIONS: DiscriminatorMultisigPosition[] = [
  {
    discriminator: multisig.MULTISIG_CREATE_DISCRIMINATOR,
    multisigAccountIndex: 0,
    label: 'CreateMultisigInstruction',
  },
  {
    discriminator: multisig.PROPOSAL_CREATE_DISCRIMINATOR,
    multisigAccountIndex: 0,
    label: 'ProposalCreateInstruction',
  },
  {
    discriminator: multisig.PROPOSAL_APPROVE_DISCRIMINATOR,
    multisigAccountIndex: 0,
    label: 'ProposalApproveInstruction',
  },
  {
    discriminator: multisig.PROPOSAL_EXECUTE_DISCRIMINATOR,
    multisigAccountIndex: 0,
    label: 'ProposalExecuteInstruction',
  },
  {
    discriminator: multisig.PROPOSAL_ACCOUNTS_CLOSE_DISCRIMINATOR,
    multisigAccountIndex: 0,
    label: 'ProposalAccountsCloseInstruction',
  },
];
export const identifyInstructionByDiscriminator = (
  instruction: TransactionInstruction,
  programId: PublicKey
) => {
  if ((!programId.equals(instruction.programId)) || !instruction.data) {
    return null;
  }

  const discrim: number = instruction.data[0]; // first byte as number
  const matches = MULTISIG_ACCOUNT_POSITIONS.find(
    (msp) => msp.discriminator[0] === discrim
  );
  return matches || null;
};
