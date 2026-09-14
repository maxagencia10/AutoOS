import { StatusOS } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatPlaca(placa: string): string {
  if (!placa) return '';
  const clean = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length === 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function formatKm(km: number): string {
  return (km || 0).toLocaleString('pt-BR') + ' km';
}

export function formatCpfCnpj(val: string): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return val;
}

export function formatPhone(val: string): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return val;
}

export function formatCep(val: string): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return val;
}

export function getStatusBadgeInfo(status: StatusOS): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'ABERTA':
      return {
        bg: 'bg-blue-950/60',
        text: 'text-blue-400',
        border: 'border-blue-800/80',
        dot: 'bg-blue-400',
      };
    case 'AGUARDANDO APROVAÇÃO':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-800/80',
        dot: 'bg-amber-400',
      };
    case 'APROVADA':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-400',
        border: 'border-emerald-800/80',
        dot: 'bg-emerald-400',
      };
    case 'EM EXECUÇÃO':
      return {
        bg: 'bg-indigo-950/60',
        text: 'text-indigo-400',
        border: 'border-indigo-800/80',
        dot: 'bg-indigo-400',
      };
    case 'CONCLUÍDA':
      return {
        bg: 'bg-teal-950/60',
        text: 'text-teal-400',
        border: 'border-teal-800/80',
        dot: 'bg-teal-400',
      };
    case 'ENTREGUE':
      return {
        bg: 'bg-zinc-800',
        text: 'text-zinc-200',
        border: 'border-zinc-700',
        dot: 'bg-emerald-500',
      };
    case 'CANCELADA':
      return {
        bg: 'bg-red-950/70',
        text: 'text-red-400',
        border: 'border-red-800/80',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-zinc-900',
        text: 'text-zinc-300',
        border: 'border-zinc-700',
        dot: 'bg-zinc-400',
      };
  }
}

export function buildWhatsAppLink(
  phone: string,
  osNumero: string,
  clienteNome: string,
  veiculo: string,
  placa: string,
  total: number,
  status: string
): string {
  // Limpa caracteres especiais mantendo DDI/DDD
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }

  const mensagem = `Olá, ${clienteNome}! Tudo bem?
Informamos que a sua *${osNumero}* referente ao veículo *${veiculo} (Placa: ${placa})* encontra-se com o status: *${status}*.
Valor Total: *${formatCurrency(total)}*.

Segue anexo o documento detalhado em PDF com todos os itens, diagnóstico e garantia.
Ficamos à disposição para qualquer esclarecimento!`;

  return `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(mensagem)}`;
}
