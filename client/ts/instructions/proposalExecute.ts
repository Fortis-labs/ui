
import { Keypair, PublicKey, TransactionInstruction, Connection, AddressLookupTableAccount } from "@solana/web3.js";
import {
    getProposalExecuteInstruction, ProposalExecuteInstructionDataArgs, getVaultTransactionMessageCodec, getVaultTransactionCodec
} from "../generated";
import * as pda from "../pda";
import * as utils from "../utils";
import { address, createKeyPairSignerFromBytes, TransactionSigner, AccountMeta, AccountRole, Address, WritableSignerAccount, WritableAccount, ReadonlyAccount, ReadonlySignerAccount } from "@solana/kit";
import { fromLegacyPublicKey } from "@solana/compat";
export async function proposalExecute({
    connection,
    member,
    multisigPda,
    transactionIndex,
}: {
    connection: Connection;
    member: PublicKey;
    multisigPda: PublicKey
    transactionIndex: bigint;
}): Promise<{
    instruction: TransactionInstruction;
    lookupTableAccounts: AddressLookupTableAccount[];
}> {
    let transactionPda = await pda.getTransactionPda({ multisigPda: multisigPda, index: transactionIndex });
    let proposalPda = await pda.getProposalPda({ multisigPda: multisigPda, transactionIndex: transactionIndex });
    let vaultPda = await pda.getVaultPda({ multisigPda: multisigPda });
    const txAccount = await connection.getAccountInfo(new PublicKey(transactionPda[0]));

    if (!txAccount) {
        throw new Error('Transaction account not found');
    }

    const transactionAccount =
        getVaultTransactionCodec().decode(txAccount.data);
    const { accountMetas, lookupTableAccounts } =
        await utils.accountsForTransactionExecute({
            connection,
            message: transactionAccount.message,
            ephemeralSignerBumps: [...transactionAccount.ephemeralSignerBumps],
            vaultPda: vaultPda[0],
            transactionPda: transactionPda[0]
        });

    let ix = getProposalExecuteInstruction({
        multisig: fromLegacyPublicKey(multisigPda),
        proposal: fromLegacyPublicKey(proposalPda[0]),
        transaction: fromLegacyPublicKey(transactionPda[0]),
        member: fromLegacyPublicKey(member),
    });
    // Convert only additional accounts to Kinobi type
    const additionalAccounts = accountMetas.map(am => {
        return {
            address: address(am.pubkey.toBase58()),
            role: am.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY,
        } as WritableAccount<string> | ReadonlyAccount<string>;
    });

    // Append them
    ix.accounts.push(...additionalAccounts);

    return { instruction: utils.toLegacyTransactionInstruction(ix, [3]), lookupTableAccounts };

}
