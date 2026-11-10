import "server-only";
import { verifyPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/http/errors";
import { toUserDto } from "@/modules/auth/auth.dto";
import { enforceAuthLimit, getCurrentUser } from "@/modules/auth/auth.service";
import type { UpdateProfileInput } from "@/modules/auth/auth.validators";
import * as repository from "./account.repository";

export async function updateProfile(token: string | undefined, input: UpdateProfileInput) {
  const current = await getCurrentUser(token);
  if (!current) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);

  const emailChanged = input.email !== undefined && input.email !== current.email;
  if (emailChanged) {
    await enforceAuthLimit(`account-email-change:${current.id}`, 5, 60 * 60 * 1000);
    const account = await repository.findActiveAccountForPasswordCheck(current.id);
    if (
      !account?.passwordHash ||
      !input.currentPassword ||
      !(await verifyPassword(account.passwordHash, input.currentPassword))
    ) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Enter your current password to change your email address.",
        401,
      );
    }
  }

  try {
    const profileChanges = {
      firstName: input.firstName,
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(emailChanged && input.email ? { email: input.email } : {}),
    };
    const user = await repository.updateProfile(current.id, profileChanges);
    if (!user) throw new AppError("AUTH_SESSION_REQUIRED", "Please sign in to continue.", 401);
    return { user: toUserDto(user), emailChanged };
  } catch (error) {
    if (repository.isDuplicateKey(error)) {
      throw new AppError("EMAIL_ALREADY_IN_USE", "That email address is already in use.", 409);
    }
    throw error;
  }
}
