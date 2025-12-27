
import { Keypair, PublicKey, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import {
    getProposalAccountsCloseInstruction, Proposal,
    ProposalAccountsCloseInstructionDataArgs
} from "../generated";
import * as pda from "../pda";
import * as utils from "../utils";
import { address, createKeyPairSignerFromBytes, TransactionSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";

export async function ProposalAccountsClose({
    rentCollector,
    multisigPda,
    transactionIndex,
}: {
    rentCollector: PublicKey;
    multisigPda: PublicKey
    transactionIndex: bigint;
}): Promise<TransactionInstruction> {


    let proposalPda = pda.getProposalPda({ multisigPda: multisigPda, transactionIndex: transactionIndex });
    let txPda = pda.getTransactionPda({ multisigPda: multisigPda, index: transactionIndex });
    console.log("tx pda", txPda[0].toString());
    console.log("proposal pda", proposalPda[0].toString());
    let ix = getProposalAccountsCloseInstruction({
        multisig: fromLegacyPublicKey(multisigPda),
        proposal: fromLegacyPublicKey(proposalPda[0]),
        transaction: fromLegacyPublicKey(txPda[0]),
        rentCollector: fromLegacyPublicKey(rentCollector),
        systemProgram: fromLegacyPublicKey(SystemProgram.programId),
    });
    return utils.toLegacyTransactionInstruction(ix, []);

}
