
'use client';

import { useActionState } from 'react';
import {
  approveVendorApplication,
  rejectVendorApplication,
  type AdminActionResult,
} from '@/src/server/actions/admin';

const initialState: AdminActionResult = {
  success: false,
  message: '',
};

type Props = {
  applicationId: string;
  emailVerified: boolean;
};

export function VendorApplicationReview({
  applicationId,
  emailVerified,
}: Props) {
  const [approveState, approveAction, isApproving] = useActionState(
    approveVendorApplication,
    initialState
  );

  const [rejectState, rejectAction, isRejecting] = useActionState(
    rejectVendorApplication,
    initialState
  );

  return (
    <div className="space-y-3">
      {!emailVerified && (
        <p className="text-sm text-amber-700">
          This applicant must verify their email before approval.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <form action={approveAction}>
          <input
            type="hidden"
            name="applicationId"
            value={applicationId}
          />
          <button
            type="submit"
            disabled={!emailVerified || isApproving || isRejecting}
            className="rounded-lg bg-[#1F7A5A] px-4 py-2 font-semibold text-white transition hover:bg-[#123C32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A5A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        </form>

        <form action={rejectAction}>
          <input
            type="hidden"
            name="applicationId"
            value={applicationId}
          />
          <button
            type="submit"
            disabled={isApproving || isRejecting}
            className="rounded-lg border border-[#C54A4A] px-4 py-2 font-semibold text-[#C54A4A] transition hover:bg-[#C54A4A] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C54A4A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
        </form>
      </div>

      {approveState.message && (
        <p
          role="status"
          className={
            approveState.success ? 'text-green-700' : 'text-red-700'
          }
        >
          {approveState.message}
        </p>
      )}

      {rejectState.message && (
        <p
          role="status"
          className={
            rejectState.success ? 'text-green-700' : 'text-red-700'
          }
        >
          {rejectState.message}
        </p>
      )}
    </div>
  );
}