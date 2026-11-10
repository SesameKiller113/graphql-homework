export type Address = {
  street: string;
  city: string;
  zipcode: string;
};

export type Addresses = {
  [key: string]: Address;
};

export type Args = {
  username: string;
};
