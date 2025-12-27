
import { Keypair, PublicKey, TransactionInstruction, TransactionMessage, AddressLookupTableAccount, SystemProgram } from "@solana/web3.js";
import {
    getProposalCreateInstruction, ProposalCreateInstructionDataArgs
} from "../generated";
import * as pda from "../pda";
import * as utils from "../utils";
import { address, createKeyPairSignerFromBytes, TransactionSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
export async function proposalCreate({
    creator,
    multisigPda,
    ephemeralSigners,
    votingDeadline,
    transactionMessage,
    addressLookupTableAccounts,
    transactionIndex,

}: {
    creator: PublicKey;
    multisigPda: PublicKey
    ephemeralSigners: number;
    votingDeadline: bigint;
    transactionMessage: TransactionMessage;
    addressLookupTableAccounts: AddressLookupTableAccount[];
    transactionIndex: bigint;
}): Promise<TransactionInstruction> {
    const transactionMessageBytes = await
        utils.transactionMessageToMultisigTransactionMessageBytes({
            message: transactionMessage,
            addressLookupTableAccounts,
        });

    const args: ProposalCreateInstructionDataArgs['args'] = {
        ephemeralSigners,
        votingDeadline,
        transactionMessage: transactionMessageBytes,

    };
    let txPda = await pda.getTransactionPda({ multisigPda: multisigPda, index: transactionIndex });
    let proposalPda = await pda.getProposalPda({ multisigPda: multisigPda, transactionIndex: transactionIndex });
    let ix = getProposalCreateInstruction({
        multisig: fromLegacyPublicKey(multisigPda),
        transaction: fromLegacyPublicKey(txPda[0]),
        creator: fromLegacyPublicKey(creator),
        proposal: fromLegacyPublicKey(proposalPda[0]),
        systemProgram: fromLegacyPublicKey(SystemProgram.programId),
        args,
    });
    return utils.toLegacyTransactionInstruction(ix, [2]);

}
