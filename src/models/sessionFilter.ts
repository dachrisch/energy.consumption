import { UserSpecific } from "@/app/types";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  MongooseQueryMiddleware,
  Query,
  Document,
  Schema,
  MongooseDocumentMiddleware,
  CallbackWithoutResultAndOptionalError,
} from "mongoose";
import { getServerSession } from "next-auth";

const queryMethods: MongooseQueryMiddleware[] = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
];

const addingMethods: MongooseDocumentMiddleware[] = ["save"];

const filteredByUserId = async function <T extends Document>(
  this: Query<unknown, T>
): Promise<void> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    console.debug(`Filtering query by userId [${session.user.id}]`);
    this.where({userId: session.user.id});
  } else {
    throw new Error("User not logged in or missing user ID");
  }
};

const addUserId = async function (
  this: UserSpecific,
  next: CallbackWithoutResultAndOptionalError
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    console.log(`Adding userId [${session.user.id}] to ${JSON.stringify(this)}`)
    this.userId = session.user.id;
  } else {
    throw new Error("User not logged in or missing user ID");
  }
  next();
};

export const applyPreFilter = async <T extends UserSpecific>(
  schema: Schema<T>
) => {
  queryMethods.forEach((method) => schema.pre(method, filteredByUserId));
  addingMethods.forEach((method) => schema.pre(method, addUserId));
};
