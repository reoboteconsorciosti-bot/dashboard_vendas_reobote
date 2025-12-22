/**
 * Converte formatos de data da planilha para estrutura do sistema
 */

const MESES_PT: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
}

export interface ParsedDate {
  mes: number
  ano: number
}

/**
 * Converte "dezembro-2025" ou "12-2025" para { mes: 12, ano: 2025 }
 */
export function parseMesAno(mesAno: string): ParsedDate | null {
  try {
    const normalizado = mesAno.toLowerCase().trim()

    // Formato: "dezembro-2025"
    if (normalizado.includes("-")) {
      const [mesPart, anoPart] = normalizado.split("-")

      // Verifica se é número (12-2025) ou texto (dezembro-2025)
      const mesNumero = Number.parseInt(mesPart)
      if (!isNaN(mesNumero) && mesNumero >= 1 && mesNumero <= 12) {
        return {
          mes: mesNumero,
          ano: Number.parseInt(anoPart),
        }
      }

      // Tenta converter nome do mês
      const mes = MESES_PT[mesPart]
      if (mes) {
        return {
          mes,
          ano: Number.parseInt(anoPart),
        }
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Erro ao parsear mes_ano:", mesAno, error)
    return null
  }
}

/**
 * Converte "17/12/2025" para "2025-12-17" (ISO format)
 */
export function parseDataVenda(dataVenda: string): string | null {
  try {
    // Formato brasileiro: DD/MM/YYYY
    if (dataVenda.includes("/")) {
      const [dia, mes, ano] = dataVenda.split("/")
      return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    }

    // Formato ISO: YYYY-MM-DD (já está correto)
    if (dataVenda.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dataVenda
    }

    return null
  } catch (error) {
    console.error("[v0] Erro ao parsear data_venda:", dataVenda, error)
    return null
  }
}

/**
 * Converte string para número, tratando vírgula e ponto
 */
export function parseValor(valor: string | number): number {
  if (typeof valor === "number") return valor

  try {
    // Remove espaços e converte vírgula para ponto
    const normalizado = valor.toString().replace(/\s/g, "").replace(",", ".")
    const numero = Number.parseFloat(normalizado)
    return isNaN(numero) ? 0 : numero
  } catch (error) {
    console.error("[v0] Erro ao parsear valor:", valor, error)
    return 0
  }
}
