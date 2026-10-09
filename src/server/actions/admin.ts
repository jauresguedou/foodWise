
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/auth/session';
import { db } from '@/src/db/client';

export type AdminActionResult = {
  success: boolean;
  message: string;
};

const applicationSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required.'),
});

type ReviewDecision = 'APPROVED' | 'REJECTED';

async function reviewVendorApplication(
  formData: FormData,
  decision: ReviewDecision
): Promise<AdminActionResult> {
  // Never trust a role supplied by the browser.
  await requireAdmin();

  const parsed = applicationSchema.safeParse({
    applicationId: formData.get('applicationId'),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid vendor application.',
    };
  }

  const { applicationId } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const application = await tx.vendorApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            emailVerified: true,
          },
        },
      },
    });

    if (!application) {
      return {
        success: false,
        message: 'Vendor application not found.',
      };
    }

    if (application.status !== 'PENDING') {
      return {
        success: false,
        message: 'This application has already been reviewed.',
      };
    }

    if (decision === 'APPROVED' && !application.user.emailVerified) {
      return {
        success: false,
        message: 'The applicant must verify their email first.',
      };
    }

    // Only one concurrent reviewer can change a pending application.
    const updated = await tx.vendorApplication.updateMany({
      where: {
        id: applicationId,
        status: 'PENDING',
      },
      data: {
        status: decision,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      return {
        success: false,
        message: 'This application has already been reviewed.',
      };
    }

    if (decision === 'APPROVED') {
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'VENDOR' },
      });
    }

    return {
      success: true,
      message:
        decision === 'APPROVED'
          ? 'Vendor application approved.'
          : 'Vendor application rejected.',
    };
  });

  if (result.success) {
    revalidatePath('/admin');
    revalidatePath('/admin/vendor-applications');
  }

  return result;
}

export async function approveVendorApplication(
  _previousState: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  return reviewVendorApplication(formData, 'APPROVED');
}

export async function rejectVendorApplication(
  _previousState: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  return reviewVendorApplication(formData, 'REJECTED');
}