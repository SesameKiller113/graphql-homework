export type Address = {
  street: string;
  city: string;
  state?: string | null;
  zipcode: string;
};

export type Addresses = {
  [key: string]: Address;
};

export type Args = {
  username: string;
};

export type CreateAddressArgs = {
  username: string;
  address: Address;
};
