
import { Keypair, PublicKey, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import {
    getMultisigCreateInstruction, MultisigCreateInstructionDataArgs
} from "../generated";
import * as pda from "../pda";
import * as utils from "../utils";
import { address, createKeyPairSignerFromBytes, TransactionSigner } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";

export async function multisigCreate({
    treasury,
    creator,
    multisigPda,
    threshold,
    members,
    createKey,
    rentCollector,
}: {
    treasury: PublicKey;
    creator: PublicKey;
    multisigPda: PublicKey
    threshold: number;
    members: PublicKey[];
    createKey: PublicKey;
    rentCollector: string | null;
}): Promise<TransactionInstruction> {

    const rentCollectorAddress =
        rentCollector && rentCollector.length > 0
            ? address(rentCollector)
            : null;

    const args: MultisigCreateInstructionDataArgs['args'] = {
        threshold,
        members: members.map((pk) =>
            fromLegacyPublicKey(pk)),
        rentCollector: rentCollectorAddress
            ? rentCollectorAddress
            : null,

    };
    let ix = getMultisigCreateInstruction({
        treasury: fromLegacyPublicKey(treasury),
        multisig: fromLegacyPublicKey(multisigPda),
        createKey: fromLegacyPublicKey(createKey),
        creator: fromLegacyPublicKey(creator),
        systemProgram: fromLegacyPublicKey(SystemProgram.programId),
        args,
    });
    return utils.toLegacyTransactionInstruction(ix, [2, 3]);

}
