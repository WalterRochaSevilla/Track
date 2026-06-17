export interface UserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  nit?: string;
  ci?: string;
}

export const users: UserRecord[] = [
  {
    id: "f69b7f4a-4b79-44a6-af0f-b8f9a0b7e8df",
    email: "admin@cochatech.com",
    password: "Password1!",
    name: "Cochatech SRL",
    role: "pyme",
    nit: "1234567015",
  },
  {
    id: "2aa4dd33-5cde-4c8a-841a-35d7702ad6a2",
    email: "test@empresa.com",
    password: "Password1!",
    name: "Empresa Test SA",
    role: "pyme",
    ci: "8765432",
  },
];
