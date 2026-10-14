import type { Types } from "mongoose";
import type { UserRecord } from "@/models/user";

export function toUserDto(
  user: Pick<UserRecord, "email" | "firstName" | "lastName" | "locale"> & { _id: Types.ObjectId },
) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    locale: user.locale,
  };
}
export type UserDto = ReturnType<typeof toUserDto>;
