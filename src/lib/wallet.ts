import { AXIOS_INSTANCE } from '@/lib/api';

export const googleWalletEnabled =
  process.env.NEXT_PUBLIC_WALLET_GOOGLE === '1';
export const appleWalletEnabled =
  process.env.NEXT_PUBLIC_WALLET_APPLE === '1';

export async function openGoogleWallet(ticketId: string): Promise<void> {
  const res = await AXIOS_INSTANCE.get<{ saveUrl: string }>(
    `/api/v1/me/tickets/${ticketId}/wallet/google`,
  );
  window.open(res.data.saveUrl, '_blank', 'noopener');
}

export async function downloadApplePass(
  ticketId: string,
  shortCode: string,
): Promise<void> {
  const res = await AXIOS_INSTANCE.get<Blob>(
    `/api/v1/me/tickets/${ticketId}/wallet/apple`,
    { responseType: 'blob' },
  );
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${shortCode}.pkpass`;
  a.click();
  URL.revokeObjectURL(url);
}
