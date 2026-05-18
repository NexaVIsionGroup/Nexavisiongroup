import VerifyClient from './VerifyClient';

export const metadata = { title: 'Identity Verification — NexaVision Group' };

export default function VerifyPage({ params }: { params: { token: string } }) {
  return <VerifyClient token={params.token} />;
}