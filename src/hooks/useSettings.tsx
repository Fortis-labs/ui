import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
// top level
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
const DEFAULT_PROGRAM_ID = multisig.FORTIS_MULTISIG_PROGRAM_ADDRESS;

const getProgramId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('x-program-id-v4') || DEFAULT_PROGRAM_ID;
  }
  return DEFAULT_PROGRAM_ID;
};

export const useProgramId = () => {
  const queryClient = useQueryClient();

  const { data: programId } = useSuspenseQuery({
    queryKey: ['programId'],
    queryFn: () => Promise.resolve(getProgramId()),
  });

  const setProgramId = useMutation({
    mutationFn: (newProgramId: string) => {
      localStorage.setItem('x-program-id-v4', newProgramId);
      return Promise.resolve(newProgramId);
    },
    onSuccess: (newProgramId) => {
      queryClient.setQueryData(['programId'], newProgramId);
    },
  });
  return { programId, setProgramId };
};
// explorer url
export const DEFAULT_EXPLORER_URL = 'https://explorer.solana.com';

