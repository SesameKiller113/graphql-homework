import { getAddress } from "./address/address";
import { Address, Args } from "./address/types";

export const resolvers = {
  Query: {
    address: (parent: any, args: Args, context: any, info: any): Address => {
      return getAddress(parent, args, context);
    },
  },
};
