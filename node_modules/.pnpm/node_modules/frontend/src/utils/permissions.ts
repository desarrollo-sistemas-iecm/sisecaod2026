export const canAccess = (perfil: any, allowedRoles: number[]): boolean =>
  allowedRoles.includes(Number(perfil))

export const esAdmin    = (perfil: number) => perfil === 1
export const esDistrito = (perfil: number) => perfil === 3
export const esCentral  = (idDistrito: number) => idDistrito > 33

export const PERFILES: Record<number, string> = {
  1: 'Administrador',
  2: 'Responsable de Área',
  3: 'Capturista Distrital',
  4: 'Área Específica',
  5: 'Administrador de Configuración',
}
