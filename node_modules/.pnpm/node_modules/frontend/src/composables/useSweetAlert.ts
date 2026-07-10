import Swal, { type SweetAlertResult } from 'sweetalert2'

const getThemeOptions = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    confirmButtonColor: '#4A1D8F',
    cancelButtonColor:  '#94a3b8',
    background:         isDark ? '#1e293b' : '#ffffff',
    color:              isDark ? '#f1f5f9' : '#1e293b',
    customClass: {
      popup:             'font-sans text-sm rounded-2xl shadow-xl dark:border dark:border-slate-700',
      confirmButton:     'rounded-xl font-semibold px-5 py-2.5 bg-iecm-purple text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-none focus:ring-2 focus:ring-iecm-purple/30',
      cancelButton:      'rounded-xl font-semibold px-5 py-2.5 bg-slate-400 text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/30',
      title:             isDark ? 'text-slate-100 font-bold' : 'text-slate-800 font-bold',
      htmlContainer:     isDark ? 'text-slate-400' : 'text-slate-500',
    }
  }
}

export const useSweetAlert = () => {

  /** ✅ Éxito */
  const success = (titulo: string, texto?: string): Promise<SweetAlertResult> =>
    Swal.fire({
      ...getThemeOptions(),
      icon:              'success',
      title:             titulo,
      text:              texto,
      timer:             2500,
      timerProgressBar:  true,
      showConfirmButton: false,
    })

  /** ✅ Alias exito (compatibilidad) */
  const exito = (titulo: string, mensaje?: string): Promise<SweetAlertResult> =>
    success(titulo, mensaje)

  /** ❌ Error */
  const error = (titulo: string, texto?: string): Promise<SweetAlertResult> =>
    Swal.fire({
      ...getThemeOptions(),
      icon:  'error',
      title: titulo,
      text:  texto ?? titulo,
    })

  /** ⚠️ Confirmación destructiva */
  const confirmar = (titulo: string, texto: string): Promise<SweetAlertResult> =>
    Swal.fire({
      ...getThemeOptions(),
      icon:                  'warning',
      title:                 titulo,
      text:                  texto,
      showCancelButton:      true,
      confirmButtonText:     'Sí, continuar',
      cancelButtonText:      'Cancelar',
    })

  /** ℹ️ Advertencia / Aviso */
  const advertencia = (titulo: string, texto?: string): Promise<SweetAlertResult> =>
    Swal.fire({
      ...getThemeOptions(),
      icon:  'warning',
      title: titulo,
      text:  texto,
    })

  /** 🔒 Sistema cerrado */
  const sistemaCerrado = (): Promise<SweetAlertResult> => {
    const isDark = document.documentElement.classList.contains('dark')
    return Swal.fire({
      ...getThemeOptions(),
      title: 'Periodo de captura cerrado',
      html: `
        <div class="flex flex-col items-center text-center mt-2">
          <!-- Candado estilizado en tono ámbar/dorado institucional -->
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-5 ring-4 ring-amber-500/10">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <p class="text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}">
            El periodo de captura del mes correspondiente ha finalizado. Podrás registrar actividades una vez que el administrador habilite el siguiente periodo.
          </p>
          <div class="text-[11px] font-semibold mt-4 ${isDark ? 'text-slate-450' : 'text-slate-500'} flex items-center gap-1.5 justify-center py-2 px-3.5 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full border border-slate-200/50 dark:border-slate-700/50">
            <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Para más información, contacta al administrador de tu distrito.
          </div>
        </div>
      `,
      confirmButtonText: 'Entendido',
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
      }
    })
  }

  return { success, exito, error, confirmar, advertencia, sistemaCerrado }
}
