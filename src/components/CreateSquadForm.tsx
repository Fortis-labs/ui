import { Button } from './ui/button';
import { Input } from './ui/input';
import { createMultisig } from '../lib/createSquad';
import { Keypair, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { CheckSquare, Copy, ExternalLink, PlusCircleIcon, XIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { isPublickey } from '@/lib/isPublickey';
import { ValidationRules, useSquadForm } from '@/lib/hooks/useSquadForm';
import { useMultisigData } from '@/hooks/useMultisigData';
import { useMultisigAddress } from '@/hooks/useMultisigAddress';
import { Link } from "react-router-dom";

interface MemberAddresses {
  count: number;
  memberData: PublicKey[];
}

interface CreateSquadFormData {
  members: MemberAddresses;
  threshold: number;
  rentCollector: string;
  configAuthority: string;
  createKey: string;
}

export default function CreateSquadForm({ }: {}) {
  const { publicKey, connected, sendTransaction } = useWallet();

  const { connection, programId } = useMultisigData();
  const { setMultisigAddress } = useMultisigAddress();
  const validationRules = getValidationRules();

  const { formState, handleChange, onSubmit } = useSquadForm<{
    signature: string;
    multisig: string;
  }>(
    {
      threshold: 1,
      rentCollector: '',
      configAuthority: '',
      createKey: '',
      members: {
        count: 0,
        memberData: [],
      },
    },
    validationRules
  );

  async function submitHandler() {
    if (!connected) throw new Error('Please connect your wallet.');
    try {
      const createKey = Keypair.generate();

      const { transaction, multisig } = await createMultisig(
        connection,
        publicKey!,
        formState.values.members.memberData,
        formState.values.threshold,
        createKey.publicKey,
        formState.values.rentCollector,
      );

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        signers: [createKey],
      });
      console.log('Transaction signature', signature);
      toast.loading('Confirming...', {
        id: 'create',
      });

      let sent = false;
      const maxAttempts = 10;
      const delayMs = 1000;
      for (let attempt = 0; attempt <= maxAttempts && !sent; attempt++) {
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === 'confirmed') {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          sent = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      setMultisigAddress.mutate(multisig.toBase58());

      return { signature, multisig: multisig.toBase58() };
    } catch (error: any) {
      console.error(error);
      return error;
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  return (
    <>
      <div className="grid grid-cols-8 gap-4 mb-6">
        {/* Members input */}
        <div className="col-span-6 flex-col space-y-2">
          <label htmlFor="members" className="font-medium">
            Members <span className="text-red-600">*</span>
          </label>

          {formState.values.members.memberData.map((member: PublicKey, i: number) => (
            <div key={i} className="grid grid-cols-3 items-center gap-2">
              <div className="relative col-span-2">
                <Input
                  defaultValue={member ? member.toBase58() : ''}
                  placeholder={`Member key ${i + 1}`}
                  onChange={(e) => {
                    handleChange('members', {
                      count: formState.values.members.count,
                      memberData: formState.values.members.memberData.map((m: PublicKey, index: number) => {
                        if (index === i) {
                          let newKey: PublicKey | null = null;
                          try {
                            if (e.target.value) {
                              newKey = new PublicKey(e.target.value);
                            }
                          } catch {
                            console.error('Invalid public key input');
                          }
                          return { ...m, key: newKey };
                        }
                        return m;
                      }),
                    });
                  }}
                />

                {i > 0 && (
                  <XIcon
                    onClick={() => {
                      handleChange('members', {
                        count: formState.values.members.count,
                        memberData: formState.values.members.memberData.filter(
                          (_: PublicKey, index: number) => index !== i
                        ),
                      });
                    }}
                    className="absolute inset-y-3 right-2 w-4 h-4 text-zinc-400 hover:text-zinc-600"
                  />
                )}
              </div>
            </div>
          ))}



          {formState.errors.members && (
            <div className="mt-1.5 text-red-500 text-xs">{formState.errors.members}</div>
          )}
        </div>

        {/* Threshold input */}
        <div className="col-span-4 flex-col space-y-2">
          <label htmlFor="threshold" className="font-medium">
            Threshold <span className="text-red-600">*</span>
          </label>
          <Input
            type="number"
            placeholder="Approval threshold for execution"
            defaultValue={formState.values.threshold}
            onChange={(e) => handleChange('threshold', parseInt(e.target.value))}
          />
          {formState.errors.threshold && (
            <div className="mt-1.5 text-red-500 text-xs">{formState.errors.threshold}</div>
          )}
        </div>

        {/* Optional fields */}
        <div className="col-span-4 flex-col space-y-2">
          <label htmlFor="rentCollector" className="font-medium">
            Rent Collector
          </label>
          <Input
            type="text"
            placeholder="Optional rent collector"
            defaultValue={formState.values.rentCollector}
            onChange={(e) => handleChange('rentCollector', e.target.value)}
          />
        </div>
        <div className="col-span-4 flex-col space-y-2">
          <label htmlFor="configAuthority" className="font-medium">
            Config Authority
          </label>
          <Input
            type="text"
            placeholder="Optional config authority"
            defaultValue={formState.values.configAuthority}
            onChange={(e) => handleChange('configAuthority', e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={() =>
          toast.promise(onSubmit(submitHandler), {
            id: 'create',
            duration: 10000,
            loading: 'Building Transaction...',
            success: (res) => (
              <div className="w-full flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col space-y-0.5">
                    <p className="font-semibold">
                      Squad Created:{' '}
                      <span className="font-normal">
                        {res.multisig.slice(0, 4) + '...' + res.multisig.slice(-4)}
                      </span>
                    </p>
                    <p className="font-light">Your new Squad has been set as active.</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Copy
                    onClick={() => {
                      navigator.clipboard.writeText(res.multisig);
                      toast.success('Copied address!');
                    }}
                    className="w-4 h-4 hover:text-stone-500"
                  />
                  <Link
                    to={`https://explorer.solana.com/address/${res.multisig}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 hover:text-stone-500" />
                  </Link>
                </div>
              </div>
            ),
            error: (e) => `Failed to create squad: ${e}`,
          })
        }
      >
        Create Squad
      </Button>
    </>

  );
}

function getValidationRules(): ValidationRules {
  return {
    threshold: async (value: number) => {
      if (value < 1) return 'Threshold must be greater than 0';
      return null;
    },
    rentCollector: async (value: string) => {
      const valid = isPublickey(value);
      if (!valid) return 'Rent collector must be a valid public key';
      return null;
    },
    configAuthority: async (value: string) => {
      const valid = isPublickey(value);
      if (!valid) return 'Config authority must be a valid public key';
      return null;
    },
    members: async (value: { count: number; memberData: PublicKey[] }) => {
      if (value.count < 1) return 'At least one member is required';

      const valid = await Promise.all(
        value.memberData.map(async (member) => {
          if (member == null) return 'Invalid Member Key';
          const valid = isPublickey(member.toBase58());
          if (!valid) return 'Invalid Member Key';
          return null;
        })
      );

      if (valid.includes('Invalid Member Key')) {
        let index = valid.findIndex((v) => v === 'Invalid Member Key');
        return `Member ${index + 1} is invalid`;
      }

      return null;
    },
  };
}
