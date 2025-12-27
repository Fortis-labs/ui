
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
    getProposalApproveInstruction, Proposal,
    ProposalApproveInstructionDataArgs
} from "../generated";
import * as pda from "../pda";
import * as utils from "../utils";
import { address, createKeyPairSignerFromBytes, TransactionSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";

export async function proposalApprove({
    member,
    multisigPda,
    transactionIndex,

}: {
    member: PublicKey;
    multisigPda: PublicKey
    transactionIndex: bigint;
}): Promise<TransactionInstruction> {

    const args: ProposalApproveInstructionDataArgs['args'] = {

    };
    let proposalPda = pda.getProposalPda({ multisigPda: multisigPda, transactionIndex: transactionIndex });
    let ix = getProposalApproveInstruction({
        multisig: fromLegacyPublicKey(multisigPda),
        proposal: fromLegacyPublicKey(proposalPda[0]),
        member: fromLegacyPublicKey(member),
        args,
    });
    return utils.toLegacyTransactionInstruction(ix, [2]);

}
