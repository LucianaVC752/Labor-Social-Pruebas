export type VistaCampesino = {
  id: number  // o number, dependiendo de tu PK
  farmer_cc: string
  farmer_name: string
  farmer_last: string
  full_name: string
  date_born: string
  village: string
  edad: number
  cellphone: string
  email: string | null
  photo: string | null
  created_at: string
}

export type FarmerComplete = {
          cellphone: string
          created_by: string
          date_born: string
          email: string | null
          farmer_cc: string
          farmer_last: string
          farmer_name: string
          farmer_signature: string | null
          photo: string | null
          village: string | null
        }

export type FarmerEditable = {
  id: number
  farmer_name: string
  farmer_last: string
  farmer_cc: string
  email: string | null
  cellphone: string | null
  date_born: string | null
  village: string | null
  biological_sex: string | null
}

export type FarmerView = {
  id: number
  farmer_cc: string
  farmer_name: string
  farmer_last: string
  biological_sex: string | null
  full_name?: string
  date_born: string | null
  village: string | null
  cellphone: string | null
  email: string | null
  photo: string | null
  created_at?: string
}